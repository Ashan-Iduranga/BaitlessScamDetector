import { analyzeText, buildReport, type Language } from '@baitless/detector';
import { router } from 'expo-router';
import {
  ArrowRight,
  ArrowsClockwise,
  CheckCircle,
  ShieldCheck,
  ShieldWarning,
  XCircle,
} from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { HighlightedMessage } from '@/components/risk/highlighted-message';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EarnedSummary, StepProgress } from '@/features/academy/components';
import type { BadgeId } from '@/features/academy/content';
import { practiceSession, recordPractice } from '@/features/academy/progress';
import { currentLanguage } from '@/lib/i18n';

/** "Spot the scam": decide if each message is a scam, then see why. */
export default function PracticeScreen() {
  const { t } = useTranslation();
  const [session, setSession] = useState(() => practiceSession());
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [earned, setEarned] = useState({ points: 0, badges: [] as BadgeId[] });
  const [finished, setFinished] = useState(false);
  const lang: Language = currentLanguage();

  const item = session[index];

  function choose(saysScam: boolean) {
    if (!item || answer !== null) return;
    const correct = saysScam === item.isScam;
    setAnswer(saysScam);
    if (correct) setCorrectCount((c) => c + 1);
    const got = recordPractice(item.id, correct);
    setEarned((e) => ({ points: e.points + got.points, badges: [...e.badges, ...got.badges] }));
  }

  function next() {
    if (index + 1 >= session.length) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setAnswer(null);
  }

  function restart() {
    setSession(practiceSession());
    setIndex(0);
    setAnswer(null);
    setCorrectCount(0);
    setEarned({ points: 0, badges: [] });
    setFinished(false);
  }

  if (finished || !item) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-4 pb-10 pt-2">
        <Text variant="headline" accessibilityRole="header">
          {t('academy.practice.doneTitle', { n: correctCount, total: session.length })}
        </Text>
        <Text className="text-muted">
          {correctCount === session.length
            ? t('academy.practice.donePerfect')
            : t('academy.practice.doneBody')}
        </Text>
        <EarnedSummary points={earned.points} badges={earned.badges} />
        <Button title={t('academy.practice.again')} icon={ArrowsClockwise} onPress={restart} />
        <Button
          title={t('academy.backToAcademy')}
          variant="outlined"
          onPress={() => router.back()}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 px-4 pb-10 pt-2">
      <StepProgress
        label={t('academy.practice.step', { n: index + 1, total: session.length })}
        value={(index + (answer === null ? 0 : 1)) / session.length}
      />

      {answer === null ? (
        <>
          <Text variant="title" accessibilityRole="header">
            {t('academy.practice.question')}
          </Text>
          <MessageBubble sender={item.sender} text={item.text[lang]} />
          <View className="gap-3">
            <Button
              title={t('academy.practice.scam')}
              icon={ShieldWarning}
              variant="outlined"
              size="large"
              onPress={() => choose(true)}
            />
            <Button
              title={t('academy.practice.safe')}
              icon={ShieldCheck}
              variant="outlined"
              size="large"
              onPress={() => choose(false)}
            />
          </View>
        </>
      ) : (
        <Feedback
          isScam={item.isScam}
          correct={answer === item.isScam}
          sender={item.sender}
          text={item.text[lang]}
          tip={item.tip[lang]}
          onNext={next}
          last={index + 1 >= session.length}
        />
      )}
    </ScrollView>
  );
}

function MessageBubble({ sender, text }: { sender: string; text: string }) {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('academy.practice.from', { sender }) + '. ' + text}
      className="gap-2 rounded-lg rounded-tl-sm border border-outline-variant bg-surface-container p-4">
      <Text variant="label" className="text-muted">
        {t('academy.practice.from', { sender })}
      </Text>
      <Text>{text}</Text>
    </View>
  );
}

function Feedback({
  isScam,
  correct,
  sender,
  text,
  tip,
  onNext,
  last,
}: {
  isScam: boolean;
  correct: boolean;
  sender: string;
  text: string;
  tip: string;
  onNext: () => void;
  last: boolean;
}) {
  const { t } = useTranslation();
  const [safe, danger, muted] = useCSSVariable([
    '--color-safe',
    '--color-danger',
    '--color-muted',
  ]) as (string | undefined)[];
  // The same checks the app runs on real messages (on the phone only).
  const report = useMemo(() => buildReport(analyzeText(text), null), [text]);
  const reasons = [...new Set(report.flags.map((f) => f.ruleId))];
  const ResultIcon = correct ? CheckCircle : XCircle;

  return (
    <View className="gap-5">
      <View
        accessibilityLiveRegion="polite"
        className={`flex-row items-start gap-3 rounded-md p-4 ${correct ? 'bg-safe-container' : 'bg-danger-container'}`}>
        <ResultIcon size={26} color={correct ? safe : danger} weight="fill" />
        <View className="flex-1 gap-1">
          <Text
            variant="title"
            className={correct ? 'text-on-safe-container' : 'text-on-danger-container'}>
            {correct ? t('academy.correct') : t('academy.notQuite')}
          </Text>
          <Text className={correct ? 'text-on-safe-container' : 'text-on-danger-container'}>
            {isScam ? t('academy.practice.wasScam') : t('academy.practice.wasSafe')}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text variant="label" className="text-muted">
          {t('academy.practice.from', { sender })}
        </Text>
        <HighlightedMessage text={text} flags={isScam ? report.flags : []} />
      </View>

      {isScam && reasons.length ? (
        <View className="gap-2">
          <Text variant="title">{t('academy.practice.redFlags')}</Text>
          {reasons.map((id) => (
            <View key={id} className="flex-row items-start gap-2">
              <ShieldWarning size={18} color={danger} />
              <Text className="flex-1">{t(`reasons.${id}`, { defaultValue: id })}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-start gap-3 rounded-md border border-outline-variant bg-surface p-4">
        <ShieldCheck size={22} color={muted} />
        <Text className="flex-1">{tip}</Text>
      </View>

      <Button
        title={last ? t('academy.seeResults') : t('academy.nextMessage')}
        icon={ArrowRight}
        size="large"
        onPress={onNext}
      />
    </View>
  );
}
