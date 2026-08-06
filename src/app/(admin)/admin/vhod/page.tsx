import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { isAdminConfigured, isSignedIn } from "@/server/auth";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <h1 className="text-heading tracking-tight">Администрацията е изключена</h1>
        <p className="mt-4 leading-relaxed text-ink-muted">
          Не е зададена променлива <code className="font-mono">ADMIN_PASSWORD</code>.
        </p>
      </div>
    );
  }

  if (await isSignedIn()) redirect("/admin");

  return (
    <div className="mx-auto flex max-w-sm flex-col justify-center px-5 py-24">
      <h1 className="text-heading tracking-tight">Вход в администрацията</h1>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
