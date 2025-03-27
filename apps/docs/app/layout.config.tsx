import { Icon } from "@iconify/react";
// import { GithubInfo } from "fumadocs-ui/components/github-info";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Icon icon="ph:magnifying-glass" className="size-6" />
        RepoLens
      </>
    ),
  },
  links: [
    // {
    //   type: "custom",
    //   children: (
    //     <GithubInfo owner="repolens" repo="repolens" className="lg:-mx-2" />
    //   ),
    // },
  ],
  githubUrl: "https://github.com/repolens/repolens",
};
