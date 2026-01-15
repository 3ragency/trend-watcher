"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, displayName })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "Registration failed");
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
          <CardTitle>Регистрация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Имя (опционально)</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Пароль (минимум 8 символов)</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <div className="text-sm text-red-400">{error}</div> : null}
          <Button className="w-full" disabled={isBusy} onClick={onSubmit}>
            Создать аккаунт
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт? <a className="underline" href="/login">Войти</a>
      </div>
    </div>
  );
}
