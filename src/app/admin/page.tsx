import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";

export default async function AdminPage() {
  const isAuthenticated = await isAdminAuthenticated();
  const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD);
  const persistentStoreEnabled = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2.2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 shadow-[0_24px_48px_rgba(34,29,22,0.08)]">
        <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--muted)]">
          Painel interno
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
          Controle das sessões
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
          Gere os links de aplicação e acompanhe o andamento do avaliado por uma
          URL separada.
        </p>
      </section>

      {!hasAdminPassword ? (
        <section className="rounded-[2rem] border border-[color:var(--danger)] bg-[color:var(--danger-soft)] p-6 text-sm leading-7 text-[color:var(--danger)]">
          Defina `ADMIN_PASSWORD` no ambiente para habilitar o painel.
        </section>
      ) : null}

      {hasAdminPassword && !isAuthenticated ? (
        <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 shadow-[0_20px_40px_rgba(34,29,22,0.08)]">
          <AdminLoginForm />
        </section>
      ) : null}

      {hasAdminPassword && isAuthenticated ? (
        <AdminDashboard persistentStoreEnabled={persistentStoreEnabled} />
      ) : null}
    </main>
  );
}
