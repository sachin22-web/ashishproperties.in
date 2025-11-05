interface PhonePeConfig {
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  testMode: boolean;
}

class PhonePeService {
  // Client only reads public payment method info
  async loadConfig(): Promise<PhonePeConfig> {
    const resp = await fetch("/api/payments/methods");
    const data = await resp.json().catch(() => null);
    if (!data || !data.success)
      throw new Error("Failed to fetch payment methods");
    const phonepe = data.data?.phonepe || { enabled: false };
    return {
      merchantId: phonepe.merchantId || "",
      saltKey: "",
      saltIndex: "",
      testMode: phonepe.testMode || true,
    } as PhonePeConfig;
  }

  generateTransactionId(): string {
    return `MT${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  async initiatePayment(paymentData: {
    amount: number;
    packageId: string;
    propertyId?: string;
    userId: string;
    userPhone?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("Authentication required. Please login again.");

      // Create transaction on server which initiates PhonePe call server-side
      const createTxnResponse = await fetch(
        "/api/payments/phonepe/transaction",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            packageId: paymentData.packageId,
            propertyId: paymentData.propertyId,
            paymentMethod: "phonepe",
            paymentDetails: {
              merchantTransactionId: this.generateTransactionId(),
              amount: paymentData.amount,
            },
          }),
        },
      );

      if (!createTxnResponse.ok) {
        const err = await createTxnResponse.json().catch(() => ({}));
        throw new Error(
          err.error ||
            `Failed to create transaction: ${createTxnResponse.status}`,
        );
      }

      const txnResult = await createTxnResponse.json();
      if (!txnResult.success)
        throw new Error(txnResult.error || "Failed to create transaction");

      // Return server data (may include instrumentResponse with redirect info)
      return { success: true, data: txnResult.data };
    } catch (err: any) {
      console.error("PhonePe initiation error:", err);
      return {
        success: false,
        error: err.message || "Failed to initiate PhonePe payment",
      };
    }
  }

  async checkPaymentStatus(transactionId: string) {
    try {
      const resp = await fetch(`/api/payments/phonepe/status/${transactionId}`);
      if (!resp.ok) throw new Error("Failed to fetch status");
      const data = await resp.json();
      return data;
    } catch (err: any) {
      console.error("PhonePe status error:", err);
      return { success: false, error: err.message };
    }
  }
}

export const phonePeService = new PhonePeService();
export default PhonePeService;
