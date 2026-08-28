export function fechaCorta(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function fechaLarga(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
