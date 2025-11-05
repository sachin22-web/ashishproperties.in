// server/lib/phonepe.ts
import crypto from "crypto";
import { phonePeConfig as C } from "../config/phonepe";

export function baseUrl() {
  return C.testMode ? C.sandboxBase : C.prodBase;
}

// For /pg/v1/pay: X-VERIFY = sha256( base64Payload + payPath + saltKey ) + ### + saltIndex
export function xVerifyForPay(base64Payload: string) {
  const payload = base64Payload + C.payPath + C.saltKey;
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  return `${hash}###${C.saltIndex}`;
}

// For /pg/v1/status: X-VERIFY = sha256( statusPath + saltKey ) + ### + saltIndex
export function xVerifyForStatus(merchantTxnId: string) {
  const statusPath = `${C.statusPathPrefix}/${C.merchantId}/${merchantTxnId}`;
  const hash = crypto
    .createHash("sha256")
    .update(statusPath + C.saltKey)
    .digest("hex");
  return { statusPath, xVerify: `${hash}###${C.saltIndex}` };
}
