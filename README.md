# Baitless

An AI-assisted scam message detector for Sri Lankan mobile users (Sinhala, Tamil, English and
Singlish). It checks a suspicious SMS, WhatsApp message, link, phone number or screenshot and
explains _why_ it looks like a scam. Built as a practice project from
`Proposal_Baitless_Scam_Detector.docx`. Android only, installed by sideloading (not on Google Play).

## Features

| Tab / screen        | What it does                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scan**            | Paste, share or screenshot a message. On-device rules give a 0–100 risk score at once; the server adds a Gemini review, a Google Safe Browsing link check and community reports. Personal details are hidden first. |
| **Result / Report** | Explains the red flags, highlights them in the message, and lets people report the scam to the community list or copy a summary into Sri Lanka CERT's form.                                                         |
| **SMS Guard**       | Optional (Settings). Checks every new SMS on the phone and shows a warning notification for risky ones. SMS are never sent online.                                                                                  |
| **Radar**           | Community scam trends: reports per day, top scam types, and links confirmed by 3+ people. Optional "new scam" alerts every few hours.                                                                               |
| **Family Guardian** | Settings > Family Guardian. A parent shares a code with a son or daughter, who then gets an alert when Baitless finds a likely scam on the parent's phone (summary only, never the message).                        |
| **Learn**           | Scam Academy: "Spot the scam" practice with realistic messages, three quizzes, points, levels and badges. Works offline.                                                                                            |
| **History**         | Every check, kept on the phone only.                                                                                                                                                                                |

All screens are in English, Sinhala and Tamil.

## Stack

Expo SDK 58 (React Native + TypeScript, Expo Router) · Uniwind (Tailwind v4) · a local Kotlin Expo
module for SMS Guard · Supabase (Postgres + RLS, anonymous Auth, Realtime, Edge Functions) · Gemini
(free tier, server-side only) · Google Safe Browsing.

## Layout

```
apps/mobile/                 Expo app (routes in src/app, features in src/features)
apps/mobile/modules/sms-guard Kotlin module: SMS receiver, headless task, notifications
packages/detector/           Pure TypeScript detection engine + shared Zod schemas
supabase/                    Config, migrations and Edge Functions (analyze, read-image)
data/                        Labelled dataset + validator
docs/                        Design system, key setup, privacy, translation review
```

## Getting started

1. `npm install`
2. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in the Supabase URL and
   publishable key.
3. For the online checks, follow [docs/setup-keys.md](docs/setup-keys.md) (free; the API keys go
   into Supabase, never into the app).
4. Run it:

```bash
npm run android        # builds a dev client and runs it on an emulator/device
npm run mobile         # starts Metro only
```

To build an APK for real phones, see [docs/release.md](docs/release.md).

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run eval           # scores the on-device rules against data/messages.jsonl
npm run data:check
npm run format:check
```

## Documentation

- [docs/privacy.md](docs/privacy.md): what leaves the phone, what the server stores, and why.
- [docs/setup-keys.md](docs/setup-keys.md): switch on Gemini and Safe Browsing.
- [docs/design-system.md](docs/design-system.md): colours, type and component rules.
- [docs/translation-review.md](docs/translation-review.md): Sinhala and Tamil text that needs a
  native speaker.
- [docs/release.md](docs/release.md): build and install a release APK.

## Roadmap

0. Setup and design ✅
1. MVP: Scanner + Risk Report ✅
2. Link and number checker, community reports ✅
3. SMS Guard (Android native module) ✅
4. Scam Radar ✅
5. Family Guardian and Scam Awareness Academy ✅

Next: native-speaker review of Sinhala and Tamil, real messages in the dataset, and a field test on
real phones.
