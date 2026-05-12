import type { MetadataRoute } from "next";

/** PWA install / Add to Home Screen — paid app opens at dashboard. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hybrid365",
    short_name: "Hybrid365",
    description: "Hybrid strength and conditioning — programme, habits, challenge and progress.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#F4D23C",
    icons: [
      {
        src: "/icons/hybrid365-app.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/hybrid365-app.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
