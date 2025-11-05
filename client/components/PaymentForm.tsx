import React, { useState } from "react";
import { Button } from "./ui/button";
import { Zap, ExternalLink, AlertCircle, Clock } from "lucide-react";

/** ---------- helpers ---------- */
async function getAuthToken(): Promise<string | null> {
  let token: string | null =
    localStorage.getItem("userToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    null;

  if (!token) {
    try {
      const u =
        JSON.parse(localStorage.getItem("user") || "null") ||
        JSON.parse(localStorage.getItem("adminUser") || "null");
      token = u?.token || null;
    } catch {}
  }
  try {
    // @ts-ignore
    const fbAuth = (window as any)?.firebaseAuth;
    if (fbAuth?.currentUser?.getIdToken) {
      token = await fbAuth.currentUser.getIdToken(true);
    }
  } catch {}
  return token;
}

interface PaymentFormProps {
  packageId: string;
  propertyId: string;
  amount: number;
  packageName?: string;
  onPaymentComplete: (transactionId: string) => void; // call ONLY after SUCCESS
  onCancel: () => void;
}

export default function PaymentForm({
  packageId,
  propertyId,
  amount,
  packageName = "Promotional Package",
  onPaymentComplete,
  onCancel,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const [merchantTxnId, setMerchantTxnId] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);

  // Force hosted pay page
  const MODE: "redirect" | "qr" = "redirect";

  const handlePhonePePayment = async () => {
    try {
      setError("");
      setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        alert("Please login to continue");
        window.location.href =
          "/auth?returnTo=" + encodeURIComponent(window.location.pathname);
        return;
      }

      const userInfo =
        JSON.parse(localStorage.getItem("user") || "null") ||
        JSON.parse(localStorage.getItem("adminUser") || "null") ||
        {};

      const merchantTransactionId = `ap_${(userInfo.id || userInfo._id || "u")}_${Date.now()}_${Math.floor(Math.random()*1e6)}`;

      const resp = await fetch("/api/payments/phonepe/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId,
          propertyId,
          paymentMethod: "phonepe",
          mode: MODE, // <<< force hosted pay page
          paymentDetails: {
            merchantTransactionId,
            amount: Math.round(amount * 100), // paise (server also uses package price)
            currency: "INR",
            userId: userInfo.id || userInfo._id,
            userPhone: userInfo.phone,
          },
        }),
      });

      const text = await resp.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch {}
      console.log("Create PhonePe TXN -> RAW:", text, "\nParsed:", data);

      if (!resp.ok || !data?.success) {
        // Show exact server/PhonePe error
        throw new Error(
          data?.error || `Payment initiation failed: ${resp.status} ${resp.statusText}`
        );
      }

      // Normalize possible shapes
      const urlFromNested = data?.data?.instrumentResponse?.redirectInfo?.url;
      const urlFromData = data?.data?.redirectUrl || data?.data?.url;
      const redirectUrl = urlFromNested || urlFromData || null;

      const qr: string | null = data?.data?.qrBase64 || null;
      const mtid: string | null =
        data?.data?.merchantTransactionId || merchantTransactionId || null;

      if (mtid) setMerchantTxnId(mtid);

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      if (qr) {
        setQrBase64(qr);
        return;
      }

      // If success but no URL/QR — treat as error so we see log
      throw new Error("PhonePe success but no redirect URL/QR provided");
    } catch (err: any) {
      setError(err?.message || "Failed to process payment");
      console.error("PhonePe payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyStatus = async () => {
    if (!merchantTxnId) {
      setError("Missing transaction id to verify.");
      return;
    }
    try {
      setVerifying(true);
      setError("");

      const r = await fetch(
        `/api/payments/phonepe/status/${encodeURIComponent(merchantTxnId)}`,
        { credentials: "include" }
      );
      const t = await r.text();
      let j: any = null;
      try { j = JSON.parse(t); } catch {}
      console.log("PhonePe status -> RAW:", t, "\nParsed:", j);

      if (!j?.success) throw new Error("Unable to fetch payment status. Try again.");

      const state: string | undefined = j?.data?.state;
      if (state === "SUCCESS" || state === "COMPLETED") {
        onPaymentComplete(merchantTxnId);
        return;
      }
      if (state === "PENDING" || state === "PROCESSING") {
        setError("Payment pending. Complete in UPI app then click Verify again.");
        return;
      }
      if (state === "FAILED") {
        setError("Payment failed/cancelled. Please try again.");
        return;
      }
      setError("Unexpected status. Try again in a moment.");
    } catch (e: any) {
      setError(e?.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <p className="text-gray-600">
          {packageName} • <span className="font-semibold text-lg">₹{amount}</span>
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Payment Status Timeline</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span><strong>Now:</strong> Complete PhonePe payment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span><strong>After Payment:</strong> Property = "Pending Approval"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span><strong>Admin Approval:</strong> Property becomes "Live"</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">PhonePe Payment</h3>
            <p className="text-sm text-gray-600">Fast, secure, and convenient</p>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Payment Amount</div>
              <div className="text-2xl font-bold text-gray-900">₹{amount}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Package</div>
              <div className="font-semibold text-gray-900">{packageName}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <Button
          onClick={handlePhonePePayment}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Processing...
            </>
          ) : (
            <>
              {MODE === "redirect" ? "Pay with PhonePe" : "Generate PhonePe QR"}
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </Button>

        {qrBase64 && (
          <div className="mt-6 text-center">
            <img
              src={`data:image/png;base64,${qrBase64}`}
              alt="PhonePe QR"
              className="mx-auto w-64 h-64 border rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-2">
              Scan & pay via PhonePe/UPI, then click Verify.
            </p>
            <div className="mt-3">
              <Button onClick={verifyStatus} disabled={verifying} className="bg-green-600 hover:bg-green-700 text-white">
                {verifying ? "Verifying..." : "I’ve Paid — Verify"}
              </Button>
            </div>
          </div>
        )}

        {!qrBase64 && merchantTxnId && (
          <div className="mt-4 text-center">
            <Button onClick={verifyStatus} disabled={verifying} variant="outline" className="border-gray-300">
              {verifying ? "Checking..." : "Verify Payment Status"}
            </Button>
          </div>
        )}
      </div>

      <div className="text-center">
        <Button onClick={onCancel} variant="outline" disabled={loading || verifying} className="border-gray-300 hover:bg-gray-50">
          Cancel Payment
        </Button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong>What happens next?</strong>
            <p className="mt-1">
              After successful payment, your property will be listed as "Pending Admin Approval".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
