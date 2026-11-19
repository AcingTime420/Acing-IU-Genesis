import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const nextRequire = createRequire(import.meta.resolve("eslint-config-next"));
const { getRootDirs } = nextRequire("@next/eslint-plugin-next/dist/utils/get-root-dirs.js");
const docs = "https://nextjs.org/docs/messages/";
const extensions = /\.(?:jsx?|tsx?)$/;

function normalizeUrl(value) {
  const pathname = value.split(/[?#]/, 1)[0].replace(/\/index\.html$/, "/");
  return pathname && (pathname.endsWith("/") ? pathname : `${pathname}/`);
}

function routePatterns(directory, appRouter, segments = []) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      return routePatterns(path.join(directory, entry.name), appRouter, [...segments, entry.name]);
    }
    if (!entry.isFile() || !extensions.test(entry.name)) return [];
    const name = entry.name.replace(extensions, "");
    if (appRouter && name !== "page") return [];
    const route = [...segments, ...((appRouter || name === "index") ? [] : [name])]
      .filter((segment) => !appRouter || !(segment.startsWith("@") || /^\(.*\)$/.test(segment)));
    const pattern = route.map((segment) => {
      if (/^\[\[\.\.\..+\]\]$/.test(segment)) return "(?:/((?!.+?\\..+?).*?))?";
      return `/${segment.includes("[")
        ? "((?!.+?\\..+?).*?)"
        : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
    }).join("");
    return [new RegExp(`^${pattern}/$`)];
  });
}

export const noHtmlLinkForPages = {
  meta: {
    type: "problem",
    docs: { url: `${docs}no-html-link-for-pages` },
    schema: [{ oneOf: [{ type: "string" }, { type: "array", uniqueItems: true, items: { type: "string" } }] }],
  },
  create(context) {
    const roots = getRootDirs(context).map((dir) => path.resolve(context.cwd, dir));
    const customPages = context.options[0];
    const pages = customPages
      ? (Array.isArray(customPages) ? customPages : [customPages]).map((dir) => path.resolve(context.cwd, dir))
      : roots.flatMap((dir) => [path.join(dir, "pages"), path.join(dir, "src/pages")]);
    const patterns = [
      ...pages.flatMap((dir) => routePatterns(dir, false)),
      ...roots.flatMap((dir) => [path.join(dir, "app"), path.join(dir, "src/app")])
        .flatMap((dir) => routePatterns(dir, true)),
    ];
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "a") return;
        const attributes = node.attributes.filter((attr) => attr.type === "JSXAttribute");
        if (attributes.some((attr) => attr.name.name === "download"
          || (attr.name.name === "target" && attr.value?.value === "_blank"))) return;
        const href = attributes.find((attr) => attr.name.name === "href")?.value;
        if (href?.type !== "Literal" || typeof href.value !== "string") return;
        const destination = normalizeUrl(href.value);
        if (/^(https?:\/\/|\/\/)/.test(destination)) return;
        if (patterns.some((pattern) => pattern.test(destination))) {
          context.report({
            node,
            message: `Do not use an \`<a>\` element to navigate to \`${destination}\`. Use \`<Link />\` from \`next/link\` instead. See: ${docs}no-html-link-for-pages`,
          });
        }
      },
    };
  },
};
