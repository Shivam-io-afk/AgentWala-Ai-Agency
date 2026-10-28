import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agmeta",
    short_name: "Agmeta",
    description: "AI receptionists & autonomous agents for Indian businesses",
    start_url: "/",
    display: "standalone",
    background_color: "#1C1F3A",
    theme_color: "#1C1F3A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

