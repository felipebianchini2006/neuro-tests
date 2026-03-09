import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getSessionRepository } from "@/lib/server/session-repository";

export default async function AdminPage() {
  const isAuthenticated = await isAdminAuthenticated();
  const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD);
  const persistentStoreEnabled = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const initialSessions =
    hasAdminPassword && isAuthenticated
      ? await getSessionRepository().listSessions()
      : [];

  if (hasAdminPassword && isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_24%),linear-gradient(180deg,#f7f1e6_0%,#efe6d7_100%)]">
        <AdminDashboard
          initialSessions={initialSessions}
          persistentStoreEnabled={persistentStoreEnabled}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_24%),linear-gradient(180deg,#f7f1e6_0%,#efe6d7_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-4 px-4 py-4 sm:px-6 lg:gap-5 lg:px-8 lg:py-6">
        <section className="overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[linear-gradient(140deg,rgba(255,252,245,0.92)_0%,rgba(255,249,240,0.88)_48%,rgba(239,229,210,0.72)_100%)] shadow-[0_28px_64px_rgba(49,40,28,0.1)]">
          <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:px-7 lg:py-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[color:var(--line)] bg-white/72 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Painel interno
                </span>
                <span className="rounded-full border border-[rgba(50,111,93,0.18)] bg-[color:var(--accent-soft)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">
                  {persistentStoreEnabled ? "Supabase ativo" : "Memoria local"}
                </span>
              </div>

              <div className="max-w-3xl">
                <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-[color:var(--ink)] sm:text-[2.4rem]">
                  Controle clinico das sessoes
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)] sm:text-[0.95rem]">
                  Um painel mais enxuto para criar sessoes, abrir links e fechar
                  atendimentos sem trocar de contexto.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  label: "Operacao",
                  value: "Criacao, observacao e encerramento",
                },
                {
                  label: "Painel",
                  value: "Layout compacto para desktop e mobile",
                },
                {
                  label: "Acesso",
                  value: hasAdminPassword ? "Protegido por senha" : "Nao configurado",
                },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/66 px-4 py-4 backdrop-blur"
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--ink)]">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {!hasAdminPassword ? (
          <section className="rounded-[1.6rem] border border-[rgba(180,71,49,0.24)] bg-[rgba(255,245,240,0.86)] px-5 py-4 text-sm leading-7 text-[color:var(--danger)] shadow-[0_18px_36px_rgba(180,71,49,0.08)]">
            Defina `ADMIN_PASSWORD` no ambiente para habilitar o painel.
          </section>
        ) : null}

        {hasAdminPassword && !isAuthenticated ? (
          <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[0_24px_54px_rgba(49,40,28,0.08)] sm:p-6">
            <AdminLoginForm />
          </section>
        ) : null}

      </div>
    </main>
  );
}
