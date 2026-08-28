export default function CargandoPanel() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Cargando">
      <div className="h-6 w-48 rounded bg-hielo/60" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded bg-hielo/60" />
        <div className="h-24 rounded bg-hielo/60" />
        <div className="h-24 rounded bg-hielo/60" />
      </div>
      <div className="h-64 rounded bg-hielo/60" />
    </div>
  );
}
