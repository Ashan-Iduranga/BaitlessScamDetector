# Baitless

Monorepo with npm workspaces (not pnpm): `apps/mobile` (Expo SDK 58), `packages/detector` (pure TS,
Vitest), `supabase/`, `data/`. App-specific rules are in `apps/mobile/AGENTS.md`.

- Styling uses **Uniwind** (Tailwind v4) and its tokens in `apps/mobile/src/global.css`. Follow
  `docs/design-system.md`: token classes only (no raw hex values in components), risk shown with
  colour + icon + text, and the `Text` component from `src/components/ui/text.tsx` (it picks the
  Sinhala/Tamil/Latin font).
- `packages/detector` must stay free of React Native and Deno APIs, because both the app and the
  Edge Function import it. Use `.ts` extensions in relative imports so Deno can load it.
- Never commit API keys. Gemini and Safe Browsing keys live only in Supabase Edge Function secrets.
- Before calling work done: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`.
