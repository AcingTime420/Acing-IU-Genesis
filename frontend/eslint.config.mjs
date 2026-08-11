import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    /*
     * Preserve the lint behavior of the pre-upgrade Next.js 14 toolchain.
     * These React 19 compiler-oriented rules require application refactors and
     * are intentionally deferred to a dedicated frontend modernization change.
     */
    rules: {
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
