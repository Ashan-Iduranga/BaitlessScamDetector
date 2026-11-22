# Baitless

An AI-assisted scam message detector for Sri Lankan mobile users (Sinhala, Tamil, English and
Singlish). It checks a suspicious SMS, WhatsApp message, link, phone number or screenshot and
explains _why_ it looks like a scam. Built as a practice project. Android only, installed by
sideloading (not on Google Play).

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
```

## Getting started

1. `npm install`
2. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in the Supabase URL and
   publishable key.
3. Optional, for the online checks (all free, no billing account):
   - In Supabase, turn on **Authentication > Providers > Allow anonymous sign-ins**.
   - Create a Gemini API key at <https://aistudio.google.com/apikey>, and a Google Safe Browsing
     API key in Google Cloud Console (enable the Safe Browsing API first).
   - Save them as Supabase Edge Function secrets named `GEMINI_API_KEY` and
     `SAFE_BROWSING_API_KEY`. The keys live only in Supabase, never in the app or in git.
4. Run it:

```bash
npm run android        # builds a dev client and runs it on an emulator/device
npm run mobile         # starts Metro only
```

Without the keys, the app still works offline with the on-device rules.

## Release APK

Release builds are signed with your own upload key, kept outside the repo. Put its path and
passwords in your user `~/.gradle/gradle.properties` as `BAITLESS_UPLOAD_STORE_FILE`,
`BAITLESS_UPLOAD_STORE_PASSWORD`, `BAITLESS_UPLOAD_KEY_ALIAS` and `BAITLESS_UPLOAD_KEY_PASSWORD`
(read by `apps/mobile/plugins/with-release-signing.js`). Then:

```bash
cd apps/mobile
npx expo prebuild --platform android --no-install --clean
cd android
./gradlew assembleRelease
```

The APKs are in `apps/mobile/android/app/build/outputs/apk/release/`. Share
`app-arm64-v8a-release.apk`. Raise `android.versionCode` in `apps/mobile/app.json` for every new
APK, and always sign with the same key.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run eval           # scores the on-device rules against data/messages.jsonl
npm run data:check
npm run format:check
```

## Privacy

Personal details are hidden before a message is sent online. SMS Guard checks SMS on the phone
only and never uploads them. History stays on the phone. Community reports store phone numbers
hashed, and Family Guardian alerts carry a summary, never the message.

## Roadmap

0. Setup and design ✅
1. MVP: Scanner + Risk Report ✅
2. Link and number checker, community reports ✅
3. SMS Guard (Android native module) ✅
4. Scam Radar ✅
5. Family Guardian and Scam Awareness Academy ✅

Next: native-speaker review of Sinhala and Tamil, real messages in the dataset, and a field test on
real phones.
