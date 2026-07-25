import type { MetadataRoute } from "next";
import { STORE_NAME, STORE_DESCRIPTION } from "@/utils/storeConfig";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STORE_NAME,
    short_name: STORE_NAME,
    description: STORE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#059669",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
