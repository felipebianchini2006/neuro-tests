import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-12 text-center sm:px-6">
      <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
        Link inválido
      </p>
      <h1 className="text-4xl font-semibold text-[color:var(--ink)]">
        Sessão não encontrada
      </h1>
      <p className="max-w-xl text-sm leading-7 text-[color:var(--ink-soft)]">
        Verifique se o link foi copiado corretamente ou gere uma nova sessão no
        painel interno.
      </p>
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold text-white"
      >
        Ir para o painel
      </Link>
    </main>
  );
}
