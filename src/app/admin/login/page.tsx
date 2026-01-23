"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Login failed.");
      }

      toast.success("Welcome back.");
      router.push("/admin");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <Card className="w-full max-w-md border-white/10 bg-slate-900/80 p-8 text-white">
        <h1 className="text-2xl font-semibold">Admin Access</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your admin password to access the dashboard.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="bg-slate-950 text-white"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
