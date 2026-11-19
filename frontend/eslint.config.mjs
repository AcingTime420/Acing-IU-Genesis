import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import nextTypeScript from "eslint-config-next/typescript";
import { noHtmlLinkForPages } from "./lint/next-navigation.mjs";

// Keep the existing App Router link coverage: the native rule misses /devices in
// the committed regression fixture. All other Next rules use the aligned plugin.
const nextWithAppRouteLinks = nextConfig.map(config => {
  const plugin = config.plugins?.["@next/next"];
  return !plugin ? config : { ...config, plugins: { ...config.plugins,
    "@next/next": { ...plugin, rules: { ...plugin.rules,
      "no-html-link-for-pages": noHtmlLinkForPages } } } };
});

export default defineConfig([
  ...nextWithAppRouteLinks,
  ...nextTypeScript,
  {
    /*
     * Preserve the lint behavior of the pre-upgrade Next.js 14 toolchain.
     * These React 19 compiler-oriented rules require application refactors and
     * are intentionally deferred to a dedicated frontend modernization change.
     */
    rules: {
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-location-assign-relative-destination": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
