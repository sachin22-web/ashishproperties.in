import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Phone,
  MessageSquare,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import { PhoneAuthService } from "../../lib/firebase";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";

interface PhoneOTPAuthProps {
  userType?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function PhoneOTPAuth({
  userType = "buyer",
  onSuccess,
  onError,
  className = "",
}: PhoneOTPAuthProps) {
  const { loginWithFirebase } = useFirebaseAuth();
  const phoneAuthService = useRef(new PhoneAuthService());

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [recaptchaInitialized, setRecaptchaInitialized] = useState(false);

  // OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((time) => time - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    initializeRecaptcha();
    return () => {
      // Cleanup reCAPTCHA on unmount
      phoneAuthService.current.clearRecaptcha();
    };
  }, []);

  const initializeRecaptcha = async () => {
    try {
      await phoneAuthService.current.initializeRecaptcha("recaptcha-container");
      setRecaptchaInitialized(true);
      console.log("reCAPTCHA initialized successfully");
    } catch (error) {
      console.error("Failed to initialize reCAPTCHA:", error);
      setError(
        "Failed to initialize security verification. Please refresh the page.",
      );
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, "");

    // Add +91 if not present
    if (digitsOnly.length === 10) {
      return `+91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      return `+${digitsOnly}`;
    } else if (digitsOnly.length === 13 && digitsOnly.startsWith("91")) {
      return `+${digitsOnly.substring(0, 12)}`;
    }

    return phone.startsWith("+") ? phone : `+91${phone}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    if (!recaptchaInitialized) {
      setError(
        "Security verification not ready. Please wait or refresh the page.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log("Sending OTP to:", formattedPhone);

      await phoneAuthService.current.sendOTP(formattedPhone);

      setStep("otp");
      setOtpTimer(60);
      setSuccess("OTP sent successfully! Please check your phone.");

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      setError(error.message || "Failed to send OTP. Please try again.");

      // Re-initialize reCAPTCHA on error
      setTimeout(() => {
        initializeRecaptcha();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Verifying OTP:", otpCode);

      // Verify OTP with Firebase
      const firebaseUser = await phoneAuthService.current.verifyOTP(otpCode);
      console.log(
        "OTP verified successfully, Firebase user:",
        firebaseUser.uid,
      );

      // Login with Firebase
      await loginWithFirebase(firebaseUser, userType);

      setSuccess("Phone number verified successfully!");

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      const errorMessage = error.message || "Invalid OTP. Please try again.";
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;

    setOtpCode("");
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await phoneAuthService.current.sendOTP(formattedPhone);

      setOtpTimer(60);
      setSuccess("OTP resent successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Failed to resend OTP:", error);
      setError(error.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setOtpCode("");
    setError("");
    setSuccess("");
    phoneAuthService.current.clearRecaptcha();

    // Re-initialize reCAPTCHA
    setTimeout(() => {
      initializeRecaptcha();
    }, 500);
  };

  return (
    <div className={className}>
      {/* Error Alert */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Phone Number Step */}
      {step === "phone" && (
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#C70000] rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl">Enter your mobile number</CardTitle>
            <p className="text-gray-600">
              We'll send you a verification code via SMS
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                    <span className="text-gray-600 font-medium">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .substring(0, 10);
                      setPhoneNumber(value);
                      setError("");
                    }}
                    className="rounded-l-none"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-digit mobile number without country code
                </p>
              </div>

              {/* reCAPTCHA container */}
              <div className="flex justify-center">
                <div
                  id="recaptcha-container"
                  className="flex justify-center"
                ></div>
              </div>

              {!recaptchaInitialized && (
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">
                    Initializing security verification...
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
                disabled={
                  !validatePhoneNumber(phoneNumber) ||
                  loading ||
                  !recaptchaInitialized
                }
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending OTP...
                  </div>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* OTP Verification Step */}
      {step === "otp" && (
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[#C70000] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl">Enter verification code</CardTitle>
            <p className="text-gray-600">
              We sent a 6-digit code to +91 {phoneNumber}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .substring(0, 6);
                    setOtpCode(value);
                    setError("");
                  }}
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
                disabled={otpCode.length !== 6 || loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </form>

            {/* Action buttons */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <button
                type="button"
                onClick={handleBackToPhone}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Change Number
              </button>

              {otpTimer > 0 ? (
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Resend in {otpTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-[#C70000] hover:text-[#A60000] font-medium"
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
