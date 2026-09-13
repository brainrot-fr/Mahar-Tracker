import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle } from "@/lib/auth/client";
import { supabase, supabaseConfigured } from "@/lib/supabase/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_NAME, APP_TAGLINE } from "@/lib/gold/constants";
import { TRACKER_DISCLAIMER } from "@/lib/gold/copy";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [postAuthRoute, setPostAuthRoute] = useState<"/" | "/onboarding">("/");

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6">
        <Skeleton className="h-64 w-full max-w-sm" />
      </main>
    );
  }
  if (user) {
    return <Navigate to={postAuthRoute} replace />;
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      if (mode === "up") {
        setPostAuthRoute("/onboarding");
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name || email.split("@")[0] } },
        });
        if (err) throw new Error(err.message ?? "Could not create account");
        if (data.session) {
          await navigate({ to: "/onboarding", replace: true });
          return;
        }
        setPostAuthRoute("/");
        setMessage("Account created. Check your email to confirm it, then sign in.");
        setMode("in");
        setPassword("");
        return;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error(err.message ?? "Could not sign in");
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sign-in did not create a session. Check your credentials and email confirmation.");
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-bg px-6 py-10">
      <p className="font-display text-sm tracking-wide text-metal">{APP_NAME}</p>
      <h1 className="mt-2 font-display text-3xl text-fg">Sign in</h1>
      <p className="mt-2 text-sm text-muted">{APP_TAGLINE}. Your mahar records stay on your account.</p>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={busy || !supabaseConfigured}
        onClick={async () => {
          setError(null);
          setMessage(null);
          setBusy(true);
          try {
            await signInWithGoogle();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
            setBusy(false);
          }
        }}
      >
        Continue with Google
      </Button>
      {!supabaseConfigured && <p className="mt-2 text-sm text-danger">Supabase is not configured. Copy `.env.example` to `.env` and add your project values.</p>}

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-subtle">
        <span className="h-px flex-1 bg-border" />
        or email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onEmail} className="space-y-3">
        {mode === "up" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
          />
        </div>
        {message && <p className="text-sm text-metal">{message}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in with email"}
        </Button>
      </form>

      <button
        type="button"
        className="mt-4 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        onClick={() => setMode(mode === "up" ? "in" : "up")}
      >
        {mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>

      <p className="mt-10 text-xs leading-relaxed text-subtle">
        {TRACKER_DISCLAIMER}{" "}
        <Link to="/" className="underline underline-offset-2">
          Back
        </Link>
      </p>
    </main>
  );
}
