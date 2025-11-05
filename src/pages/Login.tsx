import React, { useEffect, useState } from "react";
import {
  loginWithGooglePopup,
  sendOtp,
  onAuth,
  auth,
  formatPhone,
} from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function Login() {
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = onAuth((u) => setUser(u));
    return () => unsub();
  }, []);

  const handleGoogle = async () => {
    setError(null);
    try {
      await loginWithGooglePopup();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Google sign-in failed");
    }
  };

  const handleSendOtp = async (e?: any) => {
    e?.preventDefault();
    setError(null);
    setSending(true);
    try {
      const conf = await sendOtp(phone);
      setConfirmation(conf);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e?: any) => {
    e?.preventDefault();
    setError(null);
    if (!confirmation) return setError("No OTP request found");
    try {
      await confirmation.confirm(otp);
      setOtp("");
      setConfirmation(null);
    } catch (e: any) {
      console.error(e);
      setError("Invalid OTP. Try again.");
    }
  };

  if (user) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
        <p className="mb-2">
          {user.displayName || user.phoneNumber || user.email}
        </p>
        <pre className="text-xs text-gray-600 mb-4">
          {JSON.stringify(
            { uid: user.uid, email: user.email, phone: user.phoneNumber },
            null,
            2,
          )}
        </pre>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={() => signOut(auth)}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="space-y-3 mb-6">
        <button
          onClick={handleGoogle}
          className="w-full px-4 py-2 border rounded flex items-center justify-center"
        >
          Continue with Google
        </button>
      </div>

      <hr className="my-4" />

      <form onSubmit={handleSendOtp} className="space-y-3">
        <label className="block text-sm font-medium">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 9876543210 or +919876543210"
          className="w-full p-2 border rounded"
        />
        <div className="flex space-x-2">
          <button
            onClick={handleSendOtp}
            disabled={!phone || sending}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            {sending ? "Sending..." : "Send OTP"}
          </button>
          <button
            type="button"
            onClick={() => setPhone(formatPhone(phone))}
            className="px-3 py-2 bg-gray-100 rounded"
          >
            Normalize
          </button>
        </div>
      </form>

      {confirmation && (
        <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
          <label className="block text-sm font-medium">Enter OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleVerifyOtp}
            disabled={otp.length !== 6}
            className="px-4 py-2 bg-[#C70000] text-white rounded"
          >
            Verify & Login
          </button>
        </form>
      )}

      <div id="recaptcha-container" />
    </div>
  );
}
