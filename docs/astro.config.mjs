import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://naamanu.github.io",
  base: "/fp-mode/",
  integrations: [
    starlight({
      title: "fp-mode",
      description:
        "A CLI online judge for functional programming — solve challenges in Haskell and OCaml",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/naamanu/fp-mode",
        },
      ],
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Installation", slug: "getting-started/installation" },
            { label: "Quickstart", slug: "getting-started/quickstart" },
          ],
        },
        {
          label: "Guide",
          items: [
            { label: "Solving Problems", slug: "guide/solving-problems" },
            { label: "Docker Setup", slug: "guide/docker-setup" },
            { label: "Progress Tracking", slug: "guide/progress-tracking" },
          ],
        },
        {
          label: "CLI Reference",
          items: [{ label: "Commands", slug: "cli/commands" }],
        },
        {
          label: "Problems",
          items: [
            { label: "Problem Catalog", slug: "problems/overview" },
            { label: "Contributing Problems", slug: "problems/contributing" },
          ],
        },
        {
          label: "Languages",
          items: [
            { label: "Haskell", slug: "languages/haskell" },
            { label: "OCaml", slug: "languages/ocaml" },
          ],
        },
      ],
    }),
  ],
});
