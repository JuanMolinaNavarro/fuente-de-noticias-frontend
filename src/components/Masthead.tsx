import Link from "next/link";

/* Isotipo: pluma en placa azul (avatar de marca según el manual) */
export function Isotipo({ size = 44 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md bg-azul"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.58}
        height={size * 0.58}
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.2 3.8c-3.4-.6-7.9.6-10.9 3.6-2.4 2.4-3.6 5.5-3.8 8.6l-1.7 4.2 4.2-1.7c3.1-.2 6.2-1.4 8.6-3.8 3-3 4.2-7.5 3.6-10.9z" />
        <path d="M5.5 18.5 15 9" />
      </svg>
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
          <h1 className="font-display text-4xl font-black tracking-tight text-azul sm:text-6xl">
            Fuente de Noticias
          </h1>
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gris">
          Tu fuente. Tu Tucumán.
        </p>
      </div>
      <div className="regla-doble" />
    </header>
  );
}

export function PiePagina() {
  return (
    <footer className="mt-16 bg-carbon">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-center gap-3">
          <Isotipo size={34} />
          <p className="font-display text-xl font-bold text-white">
            Fuente de Noticias
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-2 text-[11px] uppercase tracking-[0.16em] text-white/50 sm:flex-row sm:justify-between">
          <span>
            © {new Date().getFullYear()} Fuente de Noticias — Tu fuente. Tu
            Tucumán.
          </span>
          <span>
            Notas elaboradas a partir de información publicada por los medios
            citados en cada artículo.
          </span>
        </div>
      </div>
    </footer>
  );
}
