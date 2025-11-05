import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "../../lib/firebaseClient";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { api } from "../../lib/api";

interface EmailVerifyResponse {
  success: boolean;
  data?: { token: string; user: any };
  error?: string;
}

import { useNavigate } from "react-router-dom";

export default function LoginModal() {
  const navigate = useNavigate();
  const { login, loginWithFirebase } = useAuth();
  const [tab, setTab] = useState<"phone" | "email">("phone");

  // Immediately redirect to unified auth page to avoid modal usage across site
  useEffect(() => {
    navigate("/auth", { replace: true });
  }, [navigate]);

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Phone state
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<any>(null);

  // Email state
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    // Prepare recaptcha container
    if (!recaptchaRef.current) return;
    // Clean previous verifier
    try {
      verifierRef.current?.clear?.();
    } catch {}
    verifierRef.current = null;
  }, [tab]);

  async function ensureInvisibleRecaptcha(container: HTMLElement) {
    if (verifierRef.current) return verifierRef.current;
    const v = new RecaptchaVerifier(auth, container, { size: "invisible" });
    await v.render();
    verifierRef.current = v as any;
    return v;
  }

  const sendPhoneOtp = async () => {
    setError("");
    if (!/^\+?\d{6,15}$/.test(countryCode + phone.replace(/\D/g, ""))) {
      setError("Enter valid phone");
      return;
    }
    setLoading(true);
    try {
      if (!recaptchaRef.current) throw new Error("Recaptcha not ready");
      const verifier = await ensureInvisibleRecaptcha(recaptchaRef.current);
      const full = `${countryCode}${phone.replace(/\D/g, "")}`;
      const res = await signInWithPhoneNumber(auth, full, verifier);
      confirmationRef.current = res;
      setOtpSent(true);
    } catch (e: any) {
      setError(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    setError("");
    if (!code || code.length < 6) return setError("Enter 6-digit code");
    setLoading(true);
    try {
      const result = await confirmationRef.current.confirm(code);
      const user = result.user as any;
      await loginWithFirebase(user, "seller");
    } catch (e: any) {
      setError(e?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const requestEmailOtp = async () => {
    setError("");
    setDevOtp(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter valid email");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("auth/email/request-otp", { email });
      if (data?.success) {
        setEmailOtpSent(true);
        // In development, backend may include devOtp for testing
        const maybeOtp = data?.data?.devOtp as string | undefined;
        if (import.meta.env.DEV && maybeOtp) setDevOtp(maybeOtp);
      } else setError(data?.error || "Failed to send OTP");
    } catch (e: any) {
      setError(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    setError("");
    if (!emailOtp || emailOtp.length !== 6)
      return setError("Enter 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await api.post<EmailVerifyResponse>(
        "auth/email/verify-otp",
        { email, otp: emailOtp },
      );
      if (data?.success && data.data) {
        login(data.data.token, data.data.user);
      } else setError(data?.error || "Invalid OTP");
    } catch (e: any) {
      setError(e?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Sign in to Ashish Property
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="phone">Phone OTP</TabsTrigger>
              <TabsTrigger value="email">Email OTP</TabsTrigger>
            </TabsList>

            <TabsContent value="phone">
              <div
                ref={recaptchaRef}
                id="recaptcha-container"
                className="hidden"
                aria-hidden="true"
              />
              {!otpSent ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-[88px_1fr] gap-2">
                    <Input
                      aria-label="Country code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    />
                    <Input
                      aria-label="Phone"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={loading}
                    onClick={sendPhoneOtp}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    aria-label="OTP code"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="Enter 6-digit code"
                  />
                  <Button
                    className="w-full"
                    disabled={loading}
                    onClick={verifyPhoneOtp}
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="email">
              {!emailOtpSent ? (
                <div className="space-y-3">
                  <Input
                    type="email"
                    aria-label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <Button
                    className="w-full"
                    disabled={loading}
                    onClick={requestEmailOtp}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {import.meta.env.DEV && devOtp ? (
                    <p className="text-xs text-gray-500">
                      Development mode: Use OTP <strong>{devOtp}</strong>
                    </p>
                  ) : null}
                  <Input
                    aria-label="Email OTP"
                    value={emailOtp}
                    onChange={(e) =>
                      setEmailOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                  />
                  <Button
                    className="w-full"
                    disabled={loading}
                    onClick={verifyEmail}
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-xs text-gray-500">
            Note: For Gmail, use an App Password. Normal password will not work.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
