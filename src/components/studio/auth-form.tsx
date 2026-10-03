"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Segmented } from "@/components/builder/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (form: FormData) => {
    setPending(true);
    setError(null);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const res =
      mode === "signin"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: String(form.get("name")) });
    setPending(false);
    if (res.error) return setError(res.error.message ?? "Something went wrong.");
    router.push(next);
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Log in to your Cospel Studio." : "Save passes, manage customers and publish."}</p>
      <Segmented
        label="Account"
        className="mt-5 w-full"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
        options={[
          { value: "signin", label: "Log in" },
          { value: "signup", label: "Sign up" },
        ]}
      />
      <form action={submit} className="mt-5 space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" required autoComplete="name" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Please wait…" : mode === "signin" ? "Log in" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
