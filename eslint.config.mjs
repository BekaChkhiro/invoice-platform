import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "src/lib/testing/**/*",
      "src/components/ui/error-polish.tsx",
      "src/components/ui/mobile-optimization.ts",
      "src/components/ui/notifications.ts",
      "src/components/ui/performance.tsx",
      "src/components/ui/seo-optimization.tsx",
      "src/components/ui/accessibility.ts",
      "src/components/ui/animations.ts",
      "src/components/ui/deployment-setup.ts",
      "src/components/ui/loading-enhancements.ts",
      "src/components/ui/qa-checklist.ts"
    ]
  }
];

export default eslintConfig;
