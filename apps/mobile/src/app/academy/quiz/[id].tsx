import type { Language } from '@baitless/detector';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, ArrowsClockwise, Check, CheckCircle, XCircle } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { RadioGroup } from '@/components/ui/radio-group';
import { Text } from '@/components/ui/text';
import { EarnedSummary, StepProgress } from '@/features/academy/components';
import { findQuiz, type BadgeId } from '@/features/academy/content';
import { recordQuiz } from '@/features/academy/progress';
import { currentLanguage } from '@/lib/i18n';

export default function QuizScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const quiz = findQuiz(id);
  const lang: Language = currentLanguage();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ points: number; badges: BadgeId[] } | null>(null);
  const [safe, danger] = useCSSVariable(['--color-safe', '--color-danger']) as (
    string | undefined
  )[];

  if (!quiz) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted">{t('academy.quiz.missing')}</Text>
      </View>
    );
  }

  const total = quiz.questions.length;
  const question = quiz.questions[index]!;
  const correct = choice !== null && Number(choice) === question.answer;

  function check() {
    if (choice === null) return;
    setChecked(true);
    if (Number(choice) === question.answer) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= total) {
      setResult(recordQuiz(quiz!.id, score));
      return;
    }
    setIndex(index + 1);
    setChoice(null);
    setChecked(false);
  }

  function restart() {
    setIndex(0);
    setChoice(null);
    setChecked(false);
    setScore(0);
    setResult(null);
  }

  if (result) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-4 pb-10 pt-2">
        <Text variant="headline" accessibilityRole="header">
          {t('academy.quiz.doneTitle', { n: score, total })}
        </Text>
        <Text className="text-muted">
          {score === total ? t('academy.quiz.donePerfect') : t('academy.quiz.doneBody')}
        </Text>
        <EarnedSummary points={result.points} badges={result.badges} />
        {score < total ? (
          <Button title={t('academy.quiz.again')} icon={ArrowsClockwise} onPress={restart} />
        ) : null}
        <Button
          title={t('academy.backToAcademy')}
          variant={score < total ? 'outlined' : 'filled'}
          onPress={() => router.back()}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 px-4 pb-10 pt-2">
      <Text variant="label" className="text-primary">
        {t(`academy.quiz.${quiz.id}.title`)}
      </Text>
      <StepProgress
        label={t('academy.quiz.step', { n: index + 1, total })}
        value={(index + (checked ? 1 : 0)) / total}
      />
      <Text variant="title" accessibilityRole="header">
        {question.prompt[lang]}
      </Text>

      <View pointerEvents={checked ? 'none' : 'auto'}>
        <RadioGroup
          label={question.prompt[lang]}
          value={choice ?? ''}
          onChange={setChoice}
          options={question.options.map((o, i) => ({ value: String(i), label: o[lang] }))}
        />
      </View>

      {checked ? (
        <View className="gap-4">
          <View
            accessibilityLiveRegion="polite"
            className={`flex-row items-start gap-3 rounded-md p-4 ${correct ? 'bg-safe-container' : 'bg-danger-container'}`}>
            {correct ? (
              <CheckCircle size={26} color={safe} weight="fill" />
            ) : (
              <XCircle size={26} color={danger} weight="fill" />
            )}
            <View className="flex-1 gap-1">
              <Text
                variant="title"
                className={correct ? 'text-on-safe-container' : 'text-on-danger-container'}>
                {correct ? t('academy.correct') : t('academy.notQuite')}
              </Text>
              {!correct ? (
                <Text className="text-on-danger-container">
                  {t('academy.quiz.rightAnswer', {
                    answer: question.options[question.answer]![lang],
                  })}
                </Text>
              ) : null}
              <Text className={correct ? 'text-on-safe-container' : 'text-on-danger-container'}>
                {question.why[lang]}
              </Text>
            </View>
          </View>
          <Button
            title={index + 1 >= total ? t('academy.seeResults') : t('academy.nextQuestion')}
            icon={ArrowRight}
            size="large"
            onPress={next}
          />
        </View>
      ) : (
        <Button
          title={t('academy.quiz.check')}
          icon={Check}
          size="large"
          disabled={choice === null}
          onPress={check}
        />
      )}
    </ScrollView>
  );
}
