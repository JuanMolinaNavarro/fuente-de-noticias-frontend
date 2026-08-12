import Link from "next/link";

/* Isotipo de marca: logo oficial (plumín con "f" sobre placa azul) */
export function Isotipo({ size = 44 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Fuente de Noticias"
      width={size}
      height={size}
      className="inline-block shrink-0 select-none"
    />
  );
}

/* Wordmark bitonal del manual: "Fuente" + "de Noticias" en azul claro */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-black tracking-tight ${className}`}>
      <span className="text-azul">Fuente </span>
      <span className="text-azul-claro">de Noticias</span>
    </span>
  );
}

export function Masthead() {
  const hoy = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="mx-auto max-w-6xl px-5">
      <div className="flex items-baseline justify-between border-b border-hielo py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gris">
        <span>{hoy}</span>
        <span className="hidden sm:inline">Tucumán · Argentina</span>
        <span className="text-azul-medio">Rápido · Directo · Confiable</span>
      </div>
      <div className="flex flex-col items-center gap-3 py-7">
        <Link href="/" className="flex items-center gap-4">
          <Isotipo />
          <h1 className="text-4xl sm:text-6xl">
            <Wordmark />
          </h1>
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gris">
          Tu fuente. Tu Tucumán.
        </p>
      </div>
      <div className="regla-marca" />
    </header>
  );
}

export function PiePagina() {
  return (
    <footer className="mt-16 bg-pie">
      <div className="mx-auto max-w-6xl px-5 py-14 text-center">
        <div className="mb-4 flex justify-center">
          <Isotipo size={40} />
        </div>
        <p className="font-display text-3xl font-black tracking-tight text-white">
          FUENTE <span className="text-azul-claro">DE NOTICIAS</span>
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
          Tu fuente. Tu Tucumán.
        </p>
        <div className="mx-auto mt-8 h-px w-16 bg-azul-medio/40" />
        <p className="mt-6 text-xs leading-relaxed text-white/30">
          © {new Date().getFullYear()} Fuente de Noticias · Tucumán · Argentina
          <br />
          Notas elaboradas a partir de información publicada por los medios
          citados en cada artículo.
        </p>
      </div>
    </footer>
  );
}
