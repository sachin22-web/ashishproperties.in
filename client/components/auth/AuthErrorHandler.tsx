import { ReactNode, Component, ErrorInfo } from "react";
import { AlertTriangle, RefreshCcw, Home, Phone, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error(
      "Authentication Error Boundary caught an error:",
      error,
      errorInfo,
    );

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Authentication Error
              </CardTitle>
              <p className="text-gray-600">
                Something went wrong with the authentication process
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {this.state.error?.message ||
                    "An unexpected error occurred during authentication"}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              {process.env.NODE_ENV === "development" &&
                this.state.errorInfo && (
                  <details className="text-xs text-gray-500 mt-4">
                    <summary className="cursor-pointer">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {this.state.error?.stack}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error display component for specific authentication errors
interface AuthErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  suggestions?: string[];
  variant?: "alert" | "card";
}

export function AuthErrorDisplay({
  error,
  onRetry,
  onDismiss,
  suggestions = [],
  variant = "alert",
}: AuthErrorDisplayProps) {
  const getErrorSuggestions = (errorMessage: string): string[] => {
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes("network") || lowerError.includes("fetch")) {
      return [
        "Check your internet connection",
        "Try refreshing the page",
        "Disable any VPN or proxy if active",
      ];
    }

    if (lowerError.includes("popup") || lowerError.includes("blocked")) {
      return [
        "Enable popups for this website",
        "Try using a different browser",
        "Disable popup blockers temporarily",
      ];
    }

    if (lowerError.includes("phone") || lowerError.includes("sms")) {
      return [
        "Ensure your phone number is correct",
        "Check if you can receive SMS messages",
        "Try again in a few minutes",
      ];
    }

    if (lowerError.includes("otp") || lowerError.includes("code")) {
      return [
        "Check if you entered the code correctly",
        "Make sure the code hasn't expired",
        "Request a new verification code",
      ];
    }

    if (lowerError.includes("recaptcha") || lowerError.includes("captcha")) {
      return [
        "Complete the security verification",
        "Try refreshing the page",
        "Ensure cookies are enabled",
      ];
    }

    return suggestions.length > 0
      ? suggestions
      : [
          "Try again in a few moments",
          "Contact support if the problem persists",
        ];
  };

  const errorSuggestions = getErrorSuggestions(error);

  if (variant === "card") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Authentication Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-700">{error}</p>

          {errorSuggestions.length > 0 && (
            <div>
              <h4 className="font-medium text-red-800 mb-2">
                What you can try:
              </h4>
              <ul className="space-y-1">
                {errorSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="text-sm text-red-700 flex items-start"
                  >
                    <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex space-x-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                className="bg-[#C70000] hover:bg-[#A60000] text-white"
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button onClick={onDismiss} size="sm" variant="outline">
                Dismiss
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-red-800">
        <div className="space-y-2">
          <p className="font-medium">{error}</p>

          {errorSuggestions.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">What you can try:</p>
              <ul className="text-sm space-y-1">
                {errorSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(onRetry || onDismiss) && (
            <div className="flex space-x-2 mt-3">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  className="bg-[#C70000] hover:bg-[#A60000] text-white"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button onClick={onDismiss} size="sm" variant="outline">
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Success feedback component
interface AuthSuccessDisplayProps {
  message: string;
  icon?: "phone" | "mail" | "check";
  onDismiss?: () => void;
}

export function AuthSuccessDisplay({
  message,
  icon = "check",
  onDismiss,
}: AuthSuccessDisplayProps) {
  const IconComponent =
    icon === "phone" ? Phone : icon === "mail" ? Mail : RefreshCcw;

  return (
    <Alert className="border-green-200 bg-green-50">
      <IconComponent className="h-4 w-4" />
      <AlertDescription className="text-green-800">
        <div className="flex items-center justify-between">
          <span className="font-medium">{message}</span>
          {onDismiss && (
            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="text-green-800 hover:text-green-900 hover:bg-green-100"
            >
              ×
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
