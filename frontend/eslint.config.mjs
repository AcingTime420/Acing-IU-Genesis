import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules } from "@eslint/compat";
import nextConfig from "eslint-config-next";
import nextTypeScript from "eslint-config-next/typescript";
import noLocationAssignRelativeDestination from "./eslint-rules/no-location-assign-relative-destination.mjs";

export default defineConfig([
  ...fixupConfigRules([...nextConfig, ...nextTypeScript]),
  {
    plugins: {
      "next-compat": {
        rules: {
          "no-location-assign-relative-destination": noLocationAssignRelativeDestination,
        },
      },
    },
    rules: {
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-sync-scripts": "error",
      "next-compat/no-location-assign-relative-destination": "warn",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='a'] > JSXAttribute[name.name='href'][value.value=/^\\u002F([^\\u002F]|$)/]",
          message: "Use next/link instead of an <a> element for internal navigation.",
        },
      ],
      /*
       * Keep the React 19 compiler-oriented rules disabled until their
       * application refactors are handled separately.
       */
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
