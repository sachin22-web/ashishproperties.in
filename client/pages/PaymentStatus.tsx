import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

async function getAuthToken(): Promise<string | null> {
  let token: string | null =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("adminToken") ||
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
    const fbAuth = (window as any)?.firebaseAuth;
    if (fbAuth?.currentUser?.getIdToken) {
      token = await fbAuth.currentUser.getIdToken(true);
    }
  } catch {}

  return token;
}

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<
    "success" | "failed" | "pending" | "error" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const transactionId = searchParams.get("transactionId");
  const packageId = searchParams.get("packageId");
  const propertyId = searchParams.get("propertyId");
  const initialStatus = searchParams.get("status");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        setLoading(true);

        if (!transactionId) {
          setStatus("error");
          setMessage("Invalid transaction ID");
          return;
        }

        const token = await getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `/api/payments/phonepe/status/${encodeURIComponent(transactionId)}`,
          { headers },
        );

        const data = await response.json();

        if (data?.success && data?.data) {
          const txStatus = data.data.state || data.data.status;
          if (txStatus === "COMPLETED") {
            setStatus("success");
            setMessage("Payment processed successfully!");
            setTimeout(() => {
              window.location.href = `/seller-dashboard?paymentSuccess=true&packageId=${packageId || ""}`;
            }, 2000);
          } else if (txStatus === "FAILED") {
            setStatus("failed");
            setMessage("Payment was declined. Please try again.");
          } else {
            setStatus("pending");
            setMessage("Payment is still being processed. Please wait...");
            setTimeout(checkPaymentStatus, 3000);
          }
        } else {
          setStatus("pending");
          setMessage("Verifying payment status...");
          setTimeout(checkPaymentStatus, 2000);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setStatus("error");
        setMessage("Failed to check payment status. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [transactionId, packageId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {status === "success" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful! ✅
              </h1>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-lg font-semibold text-blue-900 mb-2">
                  ⏳ Waiting for Admin Approval
                </p>
                <p className="text-gray-700">
                  Your property has been posted successfully. Admin will review
                  and approve your listing shortly.
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Transaction ID: {transactionId}
              </p>
              <Button
                onClick={() => (window.location.href = "/seller-dashboard")}
                className="w-full"
              >
                Go to Seller Dashboard
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-4">
                Transaction ID: {transactionId}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => (window.location.href = "/post-property")}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                  className="w-full"
                >
                  Go Home
                </Button>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Payment
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex justify-center mb-6">
                <Loader className="h-8 w-8 animate-spin text-[#C70000]" />
              </div>
              <p className="text-sm text-gray-500">
                This may take a few moments...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-600 rounded-full mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Retry
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                  className="w-full"
                >
                  Go Home
                </Button>
              </div>
            </>
          )}

          {loading && !status && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                <Loader className="h-8 w-8 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Payment
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your payment...
              </p>
            </>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
