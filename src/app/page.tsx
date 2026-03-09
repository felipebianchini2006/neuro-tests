import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="rounded-[2.4rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 shadow-[0_24px_48px_rgba(34,29,22,0.08)] sm:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Plataforma clínica
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-5xl">
            Aplicação online para arranjo de figuras e cubos.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--ink-soft)]">
            Sessões individuais por link, execução limpa para o avaliado e
            acompanhamento em tempo quase real para o profissional.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold text-white"
            >
              Abrir painel interno
            </Link>
          </div>
        </article>

        <article className="rounded-[2.4rem] border border-[color:var(--line)] bg-[color:var(--paper)] p-8 shadow-[0_24px_48px_rgba(34,29,22,0.06)] sm:p-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.6rem] bg-[color:var(--surface-strong)] p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Arranjo
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--ink)]">
                11 histórias
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                Ordenação visual com feedback mínimo e progressão controlada.
              </p>
            </div>

            <div className="rounded-[1.6rem] bg-[color:var(--surface-strong)] p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Cubos
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--ink)]">
                9 desafios
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                Grades 2x2 e 3x3 com peças bicolores e rotação manual.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 sm:col-span-2">
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Fluxo
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                O painel gera um link do avaliado e um link do observador para cada
                sessão. O observador acompanha item atual, tempo e tentativas sem
                precisar compartilhar tela.
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
