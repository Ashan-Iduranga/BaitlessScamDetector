# Baitless dataset

Labelled scam and genuine messages, used to tune the rules and measure accuracy
(target: at least 90% on 200+ messages).

## Files

- `messages.jsonl`: one message per line.
- `validate.mjs`: checks every line and prints counts. Run `npm run data:check` from the repo root.

## Line format

```json
{
  "id": "syn-001",
  "text": "...",
  "label": "scam",
  "category": "bank",
  "language": "en",
  "source": "synthetic",
  "notes": ""
}
```

| Field      | Values                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | Unique. `syn-` for synthetic, `col-` for collected                                                                                                |
| `label`    | `scam` or `genuine`                                                                                                                               |
| `category` | `bank`, `lottery_prize`, `courier`, `job`, `investment`, `telecom`, `government`, `romance`, `shopping`, `other`, `none` (use `none` for genuine) |
| `language` | `en`, `si`, `ta` or `singlish`                                                                                                                    |
| `source`   | `synthetic` (written for testing) or `collected` (a real message)                                                                                 |

## Rules for collected messages

1. **Remove personal details before saving:** names, NIC numbers, account and card numbers, OTPs, and the phone number of the person who _received_ the message. Replace them with `[NAME]`, `[NIC]`, `[ACCOUNT]`, `[OTP]`, `[PHONE]`.
2. Keep the scammer's link and sender number as they were. The detector needs them.
3. Good sources: your own and your family's SMS/WhatsApp, public SLCERT and bank warning posts, and news reports quoting scam messages.
4. Include genuine messages too (real bank OTP texts, courier updates, telco offers). Otherwise the accuracy number means nothing.

## About the seed data

The `syn-` rows were written by hand to test the format and early rules. Their links use the
reserved `.test` domain and their phone numbers are made up. **Do not report accuracy on synthetic
rows alone.** The 90% target must be measured on `collected` messages.
