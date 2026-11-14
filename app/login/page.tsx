
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);

  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const isLogin = mode === "login";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setShowPassword(false);
    setAuthError("");
    setAuthSuccess("");
  }

  // GOOGLE OAUTH LOGIN
  async function handleGoogleLogin() {
    if (isSubmitting) return;

    setAuthError("");
    setAuthSuccess("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : "Google login failed. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  // EMAIL / PASSWORD LOGIN AND SIGNUP
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmitting) return;

    setAuthError("");
    setAuthSuccess("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      if (isLogin) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.replace("/diagnose");
        router.refresh();

      } else {
        // SIGNUP
        const fullName = String(
          formData.get("fullname") || ""
        ).trim();

        const confirmPassword = String(
          formData.get("confirmPassword") || ""
        );

        if (!fullName) {
          throw new Error("Please enter your full name.");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        if (password.length < 8) {
          throw new Error("Password must contain at least 8 characters.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/diagnose");
          router.refresh();
        } else {
          setAuthSuccess(
            "Account created successfully! Please check your email to verify your account before signing in."
          );
        }
      }
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#100e10] px-5 py-12 text-[#f6f1f2]">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#efa4a5]/5 blur-[100px]" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#d98991]/5 blur-[100px]" />

      {/* Back to home */}
      <a
        href="/"
        className="absolute left-6 top-7 text-sm text-white/50 transition hover:text-[#efa4a5] md:left-10"
      >
        ← Back to home
      </a>

      {/* Authentication container */}
      <div className="relative z-10 w-full max-w-md">

        {/* Brand */}
        <div className="mb-9 text-center">
          <a
            href="/"
            className="text-2xl font-semibold tracking-tight"
          >
            EmbeddedSense
          </a>

          <p className="mt-3 text-sm text-white/45">
            Hardware intelligence, made accessible.
          </p>
        </div>

        {/* Authentication card */}
        <div className="rounded-3xl border border-white/10 bg-[#191518] p-7 shadow-2xl sm:p-9">

          {/* Login / Signup tabs */}
          <div className="mb-9 grid grid-cols-2 rounded-full border border-white/10 bg-[#100e10] p-1">

            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-full py-3 text-sm font-medium transition ${
                isLogin
                  ? "bg-[#efa4a5] text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-full py-3 text-sm font-medium transition ${
                !isLogin
                  ? "bg-[#efa4a5] text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Sign up
            </button>

          </div>

          {/* Heading */}
          <div className="mb-8">

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#efa4a5]">
              {isLogin ? "Welcome back" : "Create your account"}
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              {isLogin
                ? "Sign in to EmbeddedSense"
                : "Get started"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/45">
              {isLogin
                ? "Access your workspace and continue your hardware investigations."
                : "Create an account to save your diagnoses and access your conversation history."}
            </p>

          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-[#100e10] py-3.5 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.05 13.22l7.98 6.19C11.93 13.72 17.47 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.62 5.91c4.45-4.11 7.15-10.15 7.15-17.56z"
              />
              <path
                fill="#FBBC05"
                d="M10.03 28.59A14.4 14.4 0 0 1 9.25 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.58 10.78l7.45-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.12 1.42-4.84 2.27-8.28 2.27-6.53 0-12.07-4.22-14.03-9.91l-7.45 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            {isSubmitting ? "Please wait..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/35">
              OR CONTINUE WITH EMAIL
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Authentication form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full name */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="fullname"
                  className="mb-2 block text-sm text-white/70"
                >
                  Full name
                </label>

                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#100e10] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#efa4a5]/60"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-white/70"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-[#100e10] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#efa4a5]/60"
              />
            </div>

            {/* Password */}
            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="text-sm text-white/70"
                >
                  Password
                </label>

                {isLogin && (
                  <button
                    type="button"
                    onClick={() =>
                      setAuthError(
                        "Password recovery will be implemented separately."
                      )
                    }
                    className="text-xs text-[#efa4a5] transition hover:text-[#f5b7b7]"
                  >
                    Forgot password?
                  </button>
                )}

              </div>

              <div className="relative">

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#100e10] px-4 py-3.5 pr-16 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#efa4a5]/60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 transition hover:text-[#efa4a5]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

              {!isLogin && (
                <p className="mt-2 text-xs text-white/35">
                  Use at least 8 characters.
                </p>
              )}

            </div>

            {/* Confirm password */}
            {!isLogin && (
              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm text-white/70"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#100e10] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#efa4a5]/60"
                />

              </div>
            )}

            {/* Error message */}
            {authError && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
              >
                {authError}
              </div>
            )}

            {/* Success message */}
            {authSuccess && (
              <div
                role="status"
                className="rounded-xl border border-green-400/20 bg-green-400/10 p-3 text-sm text-green-300"
              >
                {authSuccess}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 w-full rounded-full bg-[#efa4a5] py-3.5 text-sm font-semibold text-black transition hover:bg-[#f5b7b7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Please wait..."
                : isLogin
                  ? "Sign in →"
                  : "Create account →"}
            </button>

          </form>

          {/* Switch mode */}
          <div className="mt-8 text-center text-sm text-white/45">

            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() =>
                switchMode(isLogin ? "signup" : "login")
              }
              className="ml-2 font-medium text-[#efa4a5] transition hover:text-[#f5b7b7]"
            >
              {isLogin ? "Sign up" : "Login"}
            </button>

          </div>

        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-xs leading-6 text-white/30">
          By continuing, you agree to use EmbeddedSense responsibly.
        </p>

      </div>
    </main>
  );
}
