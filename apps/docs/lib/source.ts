import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";
import { Icon } from "@iconify/react";
import { createElement } from "react";

// `loader()` also assign a URL to your pages
// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return;
    return createElement(Icon, { icon, className: "size-5" });
  },
});
