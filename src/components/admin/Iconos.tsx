/* Íconos SVG inline del panel (misma decisión que IconoRed: sin librería,
   heredan currentColor). Trazo 1.75, viewBox 24. */

type Props = { className?: string };

const base = (className: string) => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export function IcoMenu({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <line x1="4" y1="6.5" x2="20" y2="6.5" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17.5" x2="20" y2="17.5" />
    </svg>
  );
}

export function IcoCerrar({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function IcoTablero({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IcoNotas({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

export function IcoNueva({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IcoUsuarios({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.5a5 5 0 0 1 6 4.5" />
    </svg>
  );
}

export function IcoFeeds({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 5a15 15 0 0 1 15 15" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IcoCategorias({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M3 7l9-4 9 4-9 4z" />
      <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
    </svg>
  );
}

export function IcoActividad({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  );
}

export function IcoCuenta({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function IcoSitio({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export function IcoSalir({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}

export function IcoOjo({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IcoReloj({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IcoChispa({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </svg>
  );
}

export function IcoAlerta({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18h.01" />
    </svg>
  );
}

export function IcoCheck({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function IcoLupa({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function IcoImagen({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-8 8" />
    </svg>
  );
}

export function IcoFlecha({ className = "" }: Props) {
  return (
    <svg {...base(className)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
