import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import saveMoneyImage from "../assets/save_money.jpg";

export const Register: React.FC = () => {
  const { register, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!name.trim() || !email.trim() || !password) {
      setValidationError("Please fill out all fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return;
    }

    if (!agreeToTerms) {
      setValidationError("You must agree to the terms & policy.");
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/");
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen w-screen items-center justify-center p-4 md:p-6 lg:p-8"
      style={{ background: "#ece8f4" }}
    >
      <div className="w-full max-w-5xl rounded-[2rem] bg-white p-3 shadow-xl border border-gray-100 flex flex-col md:flex-row overflow-hidden min-h-[650px]">
        {/* Form Column */}
        <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h1
              className="text-3xl font-bold tracking-tight text-gray-900"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Get Started Now
            </h1>
          </div>

          {/* Errors */}
          {(validationError || authError) && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-xs text-red-600 font-medium leading-relaxed">
                {validationError || authError}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Name
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300"
                id="register-name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Email address
              </label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300"
                id="register-email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-4 pr-11 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300"
                  id="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="agreeToTerms"
                className="text-xs text-gray-600 select-none cursor-pointer"
              >
                I agree to the <span className="font-semibold underline">terms & policy</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all bg-[#355E3B] hover:bg-[#2e5233] active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 mt-2 shadow-sm"
              id="register-submit"
            >
              {loading ? "Signing up..." : "Signup"}
            </button>
          </form>


          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            Have an account?{" "}
            <Link
              to="/login"
              onClick={clearError}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Image Column */}
        <div className="hidden md:block md:w-1/2 p-2">
          <div className="h-full w-full rounded-[1.75rem] overflow-hidden relative">
            <img
              src={saveMoneyImage}
              alt="Save money background"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
