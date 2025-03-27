import { remarkAutoTypeTable } from "fumadocs-typescript";
import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkAutoTypeTable],
  },
});
