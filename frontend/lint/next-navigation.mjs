import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { findVariable, getStringIfConstant } from "@eslint-community/eslint-utils";

const nextRequire = createRequire(import.meta.resolve("eslint-config-next"));
const { getRootDirs } = nextRequire("@next/eslint-plugin-next/dist/utils/get-root-dirs.js");
const docs = "https://nextjs.org/docs/messages/";
const extensions = /\.(?:jsx?|tsx?)$/;
const globalObjects = new Set(["window", "globalThis", "document", "self"]);

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
    const pattern = route.map((segment) => segment.includes("[")
      ? "((?!.+?\\..+?).*?)"
      : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("/");
    return [new RegExp(`^/${pattern}${pattern ? "/" : ""}$`)];
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

function member(node, property) {
  return node?.type === "MemberExpression" && (node.computed
    ? node.property.type === "Literal" && node.property.value === property
    : node.property.type === "Identifier" && node.property.name === property);
}

function globalLocation(node, source) {
  const root = node.type === "Identifier" && node.name === "location" ? node
    : member(node, "location") && node.object.type === "Identifier"
      && globalObjects.has(node.object.name) ? node.object : null;
  if (!root) return false;
  const variable = findVariable(source.getScope(root), root);
  return variable?.defs.length === 0;
}

function stringPrefix(node, source, seen = new Set()) {
  if (seen.has(node)) return null;
  seen.add(node);
  const value = getStringIfConstant(node, source.getScope(node));
  if (value !== null) return value;
  if (node.type === "TemplateLiteral") return node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
  if (node.type === "BinaryExpression" && node.operator === "+") return stringPrefix(node.left, source, seen);
  if (node.type !== "Identifier") return null;
  const variable = findVariable(source.getScope(node), node);
  const definition = variable?.defs.at(-1);
  if (definition?.type !== "Variable") return null;
  let valueNode = definition.node.init;
  for (const reference of variable.references) {
    if (reference.identifier.range[0] >= node.range[0]) break;
    if (reference.isWrite() && reference.writeExpr) valueNode = reference.writeExpr;
  }
  return valueNode ? stringPrefix(valueNode, source, seen) : null;
}

export const noLocationAssignRelativeDestination = {
  meta: {
    type: "problem",
    docs: { url: `${docs}no-location-assign-relative-destination` },
    schema: [],
    messages: {
      navigation: `Do not use \`{{expression}}\` to navigate to internal Next.js pages. Use \`redirect()\` in the render phase, or \`useRouter().push()\` in Client Components' event handlers instead. See: ${docs}no-location-assign-relative-destination`,
    },
  },
  create(context) {
    const source = context.sourceCode;
    function check(node, destination, expression, call = false) {
      if (!destination || destination.type === "SpreadElement" || !globalLocation(expression.object, source)) return;
      const prefix = stringPrefix(destination, source);
      if (prefix !== null && !/^(?:[a-z][\d+.a-z-]*:|\/\/)/i.test(prefix)) {
        context.report({ node, messageId: "navigation", data: { expression: source.getText(expression) + (call ? "()" : "") } });
      }
    }
    return {
      CallExpression(node) {
        if (member(node.callee, "assign")) check(node, node.arguments[0], node.callee, true);
      },
      AssignmentExpression(node) {
        if (member(node.left, "href")) check(node, node.right, node.left);
      },
    };
  },
};
