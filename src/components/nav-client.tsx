"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function LogoutButton() {
  const router = useRouter();
  const { success, error } = useToast();

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      success("Вы вышли из аккаунта");
      router.replace("/login");
      router.refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : "Ошибка выхода");
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="gap-2 bg-transparent text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      Выйти
    </Button>
  );
}
