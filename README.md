# Baitless

An AI-assisted scam message detector for Sri Lankan mobile users (Sinhala, Tamil, English and
Singlish). It checks a suspicious SMS, WhatsApp message, link, phone number or screenshot and
explains _why_ it looks like a scam. Built as a practice project from
`Proposal_Baitless_Scam_Detector.docx`.

## Stack

Expo (React Native + TypeScript, Expo Router) · Uniwind (Tailwind v4) · Supabase (Postgres, Auth,
Realtime, Edge Functions) · Gemini (free tier, server-side only) · Google Safe Browsing.

## Layout

```
apps/mobile/         Expo app (routes in src/app)
packages/detector/   Pure TypeScript detection engine + shared Zod schemas
supabase/            Config, migrations and Edge Functions
data/                Labelled dataset + validator
docs/                Design system and notes
```

## Getting started

```bash
npm install
npm run android        # builds a dev client and runs it on an emulator/device
npm run mobile         # starts Metro only
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run data:check
npm run format:check
```

## Roadmap

0. Setup and design ✅
1. MVP: Scanner + Risk Report
2. Link and number checker, community reports
3. SMS Guard (Android native module)
4. Scam Radar
5. Family Guardian and Scam Awareness Academy
