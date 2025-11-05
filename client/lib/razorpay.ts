// client/lib/razorpay.ts
// Loads Razorpay Checkout script dynamically and starts the payment flow.

import { api } from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type StartRazorpayOpts = {
  packageId: string;
  propertyId?: string;
  authToken?: string; // if your api wrapper auto-adds token, you can skip this
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // already loaded?
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function ensureRazorpayLoaded() {
  if (typeof window !== "undefined" && window.Razorpay) return;
  // Razorpay official checkout script
  await loadScript("https://checkout.razorpay.com/v1/checkout.js");
  if (!window.Razorpay) {
    throw new Error("Razorpay SDK failed to load");
  }
}

/**
 * Hit server: POST /api/payments/razorpay/create
 * Server returns: { razorpayOrderId, amount (paise), currency, keyId, transactionId }
 * Then open checkout and on success, POST /api/payments/razorpay/verify
 */
export async function startRazorpayPayment(opts: StartRazorpayOpts): Promise<{ ok: boolean; error?: string }> {
  const { packageId, propertyId, prefill } = opts;

  await ensureRazorpayLoaded();

  // 1) create order from backend
  let createResp;
  try {
    createResp = await api.post("payments/razorpay/create", {
      packageId,
      propertyId,
    });
  } catch (e: any) {
    console.error("create order failed:", e);
    return { ok: false, error: e?.message || "Failed to create order" };
  }

  const payload = createResp?.data;
  if (!payload?.success || !payload?.data?.razorpayOrderId) {
    const msg = payload?.error || "Failed to create order";
    return { ok: false, error: msg };
  }

  const { razorpayOrderId, amount, currency, keyId, transactionId } = payload.data;

  // 2) open Razorpay checkout
  const rzpOptions = {
    key: keyId,
    amount, // in paise
    currency: currency || "INR",
    name: "Ashish Properties",
    description: "Package purchase",
    order_id: razorpayOrderId,
    prefill: {
      name: prefill?.name || "Customer",
      email: prefill?.email || "user@example.com",
      contact: prefill?.contact || "9999999999",
    },
    theme: { color: "#C70000" },
    handler: async function (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) {
      // 3) verify on backend
      try {
        const verifyResp = await api.post("payments/razorpay/verify", {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          transactionId,
        });
        const vr = verifyResp?.data;
        if (vr?.success) {
          alert("Payment successful ✅");
          // TODO: redirect/update UI if needed
        } else {
          alert(vr?.error || "Verification failed");
        }
      } catch (err: any) {
        console.error("verify error:", err);
        alert(err?.message || "Verification failed");
      }
    },
    modal: {
      ondismiss: function () {
        console.log("Razorpay modal closed by user");
      },
    },
    notes: {
      transactionId,
      packageId,
      propertyId: propertyId || "none",
    },
  };

  const rzp = new window.Razorpay(rzpOptions);
  rzp.open();

  return { ok: true };
}
