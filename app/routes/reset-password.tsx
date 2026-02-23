import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      // Simply get the session - Supabase should auto-exchange tokens
      const { data: { session } } = await supabase.auth.getSession();

      // If there's a session, the user clicked the reset link
      if (session) {
        setIsValidSession(true);
      } else {
        // No session means invalid or expired link
        setError("Invalid or expired password reset link. Please request a new one.");
      }
    };

    checkSession();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validation
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 p-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold font-serif tracking-wider text-white">
            Pythia
          </h1>
          <p className="text-indigo-300 mt-2">Reset Your Password</p>
        </header>

        {!isValidSession && error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
            <div className="mt-4">
              <button
                onClick={() => navigate("/login")}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Return to login
              </button>
            </div>
          </div>
        )}

        {isValidSession && !success && (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                minLength={6}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-1">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Back to login
              </button>
            </div>
          </form>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 p-6 rounded-lg text-center">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Password Updated!</h2>
            <p className="text-sm mb-4">
              Your password has been successfully updated.
            </p>
            <p className="text-xs text-gray-400">
              Redirecting to login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
