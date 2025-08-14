# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js app routes (`page.tsx`, `layout.tsx`, API routes in `src/app/api`).
- `src/components`: Reusable UI and feature components (e.g., `invoices`, `forms`, `dashboard`).
- `src/lib`: Application logic/utilities; includes a custom testing framework in `src/lib/testing`.
- `src/contexts`, `src/hooks`, `src/styles`, `src/types`: React context, hooks, Tailwind styles, shared types.
- `public/`: Static assets.  `supabase/`: DB/auth config.  `scripts/`: setup utilities (sitemap, storage).

## Build, Test, and Development Commands
- `npm run dev`: Start local dev at `http://localhost:3000`.
- `npm run build`: Production build with Next.js.
- `npm start`: Run the built app.
- `npm run lint`: Lint using Next + TypeScript ESLint config.
- Testing (custom runner in `src/lib/testing`):
  - `npm run test:all`: Run the full suite.
  - `npm run test:critical`: Minimal checks for pre-deploy.
  - `npm run test:performance`: Perf/regression focus.
  - `npm run test:pre-deploy` / `test:post-deployment`: CI/CD gates.
  - `npm run test:examples`: See `src/lib/testing/test-example.ts`.

## Coding Style & Naming Conventions
- Language: TypeScript + React Server/Client Components (Next.js 15).
- Linting: ESLint (`eslint.config.mjs`) with Next core-web-vitals. Fix issues before PRs.
- Styles: TailwindCSS (`tailwind.config.ts`). Prefer utility-first classes; co-locate component styles.
- Naming: Components exported as `PascalCase`. Files generally `kebab-case.tsx/ts` (match existing directories).

## Testing Guidelines
- Framework: Custom Node-based runner (no Jest). Start from `src/lib/testing` and `README.md` inside.
- Add tests by composing suites in `src/lib/testing/*-testing.ts` or mirroring `test-example.ts`.
- Coverage: Not enforced; prioritize critical paths (auth, invoices, API, forms, performance).
- CI: Use `test:pre-deploy` before merging; `test:post-deployment` after releases.

## Commit & Pull Request Guidelines
- Commits: Use clear, imperative subject lines (e.g., "fix: invoice totals rounding"). Scope prefixes encouraged but not required.
- PRs: Include purpose, key changes, screenshots for UI, reproduction/verification steps, and linked issues. Ensure `lint` and critical tests pass locally.

## Security & Config Tips
- Secrets: Use `.env.local`; never commit credentials. Common vars: `NEXT_PUBLIC_APP_URL`, Supabase keys.
- Review `middleware.ts`, `next.config.ts`, and `vercel.json` for route/security behavior before deploying.
