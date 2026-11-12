import type { RedFlag } from '@baitless/detector';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type Segment = { text: string; flagged: boolean };

/** Splits the message into plain and flagged parts. Overlapping flags are merged. */
export function segment(text: string, flags: RedFlag[]): Segment[] {
  const ranges = flags
    .map((f) => [Math.max(0, f.start), Math.min(text.length, f.end)] as const)
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ranges) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  const out: Segment[] = [];
  let pos = 0;
  for (const [s, e] of merged) {
    if (s > pos) out.push({ text: text.slice(pos, s), flagged: false });
    out.push({ text: text.slice(s, e), flagged: true });
    pos = e;
  }
  if (pos < text.length) out.push({ text: text.slice(pos), flagged: false });
  return out;
}

/** The original message with red-flag phrases underlined and tinted. */
export function HighlightedMessage({ text, flags }: { text: string; flags: RedFlag[] }) {
  return (
    <View className="rounded-md border border-outline-variant bg-surface p-4">
      <Text selectable>
        {segment(text, flags).map((part, i) =>
          part.flagged ? (
            <Text
              key={i}
              className="bg-danger-container text-on-danger-container underline"
              weight="semibold">
              {part.text}
            </Text>
          ) : (
            part.text
          ),
        )}
      </Text>
    </View>
  );
}
