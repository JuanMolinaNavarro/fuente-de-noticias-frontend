import type { Red } from "@/lib/sitio";

/** Iconos de redes, en trazo simple para que hereden el color del contenedor. */
export function IconoRed({
  icono,
  size = 18,
}: {
  icono: Red["icono"];
  size?: number;
}) {
  const comun = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
  } as const;

  if (icono === "x") {
    return (
      <svg {...comun} fill="currentColor">
        <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.83L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
      </svg>
    );
  }

  const trazo = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  if (icono === "instagram") {
    return (
      <svg {...comun} {...trazo}>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (icono === "facebook") {
    return (
      <svg {...comun} {...trazo}>
        <path d="M17.5 2.5h-2.7a4.6 4.6 0 0 0-4.6 4.6v2.8H7.3v3.9h2.9v7.7h4v-7.7h2.9l.6-3.9h-3.5V7.4c0-.6.5-1 1-1h2.3V2.5Z" />
      </svg>
    );
  }

  if (icono === "youtube") {
    return (
      <svg {...comun} {...trazo}>
        <rect x="2.3" y="5" width="19.4" height="14" rx="4.5" />
        <path d="m10.2 8.9 5.3 3.1-5.3 3.1V8.9Z" fill="currentColor" />
      </svg>
    );
  }

  // WhatsApp
  return (
    <svg {...comun} {...trazo}>
      <path d="M20.6 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.6a8.4 8.4 0 1 1 15.5-4.3Z" />
      <path d="M8.9 8.3c.6-.1.9.1 1.1.6l.5 1.2c.1.3 0 .5-.2.7l-.5.5c.5 1 1.3 1.8 2.3 2.3l.5-.5c.2-.2.4-.3.7-.2l1.2.5c.5.2.7.5.6 1.1-.1.6-.7 1.1-1.4 1.1-2.7 0-5.7-3-5.7-5.7 0-.7.4-1.3 1-1.6Z" />
    </svg>
  );
}
