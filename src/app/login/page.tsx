"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "Login failed");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Вход</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Пароль</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <div className="text-sm text-red-400">{error}</div> : null}
          <Button className="w-full" disabled={isBusy} onClick={onSubmit}>
            Войти
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Нет аккаунта? <a className="underline" href="/register">Регистрация</a>
      </div>
    </div>
  );
}
