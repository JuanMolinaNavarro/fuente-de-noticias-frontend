"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { Modulo } from "@/components/Modulo";
import { IconoRed } from "@/components/IconoRed";
import { INSTAGRAM } from "@/lib/sitio";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/** Tarjeta que ocupa el módulo mientras no hay publicaciones cargadas. */
function InvitacionSeguir({
  usuario,
  url,
  alto,
}: {
  usuario?: string;
  url: string;
  alto: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg bg-hielo/60 px-5 text-center"
      style={{ minHeight: alto }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-azul text-white">
        <IconoRed icono="instagram" size={22} />
      </span>
      <p className="text-sm font-semibold text-azul">
        {usuario ? `@${usuario}` : "Seguinos"}
      </p>
      <p className="max-w-[220px] text-xs leading-relaxed text-gris">
        Seguí la cobertura minuto a minuto en Instagram.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-azul-medio px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-azul"
      >
        Seguir
      </a>
    </div>
  );
}

/**
 * Publicaciones de Instagram, la única red del medio.
 *
 * Incrusta los permalinks cargados en `INSTAGRAM.posts` con el widget oficial
 * (embed.js). Sin publicaciones cargadas muestra la tarjeta de seguimiento.
 */
export function MuroInstagram() {
  const contenedor = useRef<HTMLDivElement>(null);
  const { usuario, posts } = INSTAGRAM;
  const perfil = `https://www.instagram.com/${usuario}`;

  // El script procesa los <blockquote> ya presentes; al navegar entre páginas
  // hay que pedirle que vuelva a procesar los nuevos.
  useEffect(() => {
    window.instgrm?.Embeds.process();
  }, []);

  return (
    <Modulo
      titulo="Instagram"
      accion={{ texto: `@${usuario}`, href: perfil, externo: true }}
    >
      {posts.length === 0 ? (
        <InvitacionSeguir usuario={usuario} url={perfil} alto={320} />
      ) : (
        <div ref={contenedor} className="space-y-4">
          {posts.map((url) => (
            <blockquote
              key={url}
              className="instagram-media"
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{ margin: 0, width: "100%", minWidth: 0 }}
            />
          ))}
          <Script
            src="https://www.instagram.com/embed.js"
            strategy="lazyOnload"
            onReady={() => window.instgrm?.Embeds.process()}
          />
        </div>
      )}
    </Modulo>
  );
}
