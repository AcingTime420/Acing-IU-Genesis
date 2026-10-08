import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules } from "@eslint/compat";
import nextConfig from "eslint-config-next";
import nextTypeScript from "eslint-config-next/typescript";
import {
  noHtmlLinkForPages,
  noLocationAssignRelativeDestination,
} from "./lint/next-navigation.mjs";

// Keep the braces-free Next 14 dependency, restoring navigation checks locally.
const compatibleNextConfig = nextConfig.map((config) => {
  const plugin = config.plugins?.["@next/next"];
  if (!plugin) return config;
  return {
    ...config,
    plugins: {
      ...config.plugins,
      "@next/next": {
        ...plugin,
        rules: {
          ...plugin.rules,
          "no-html-link-for-pages": noHtmlLinkForPages,
          "no-location-assign-relative-destination": noLocationAssignRelativeDestination,
        },
      },
    },
  };
});

export default defineConfig([
  ...fixupConfigRules([...compatibleNextConfig, ...nextTypeScript]),
  {
    // The braces-free Next 14 plugin uses legacy configs; retain its Vitals rules.
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
