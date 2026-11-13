import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://localhost").hostname;

const nextConfig: NextConfig = {
  // Lecturas del catálogo con 'use cache' + cacheTag; ver claude/web/cache-y-revalidacion.md
  cacheComponents: true,
  // El catálogo es la portada: los links viejos a /catalogo (con sus filtros) siguen andando.
  async redirects() {
    return [{ source: "/catalogo", destination: "/", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
