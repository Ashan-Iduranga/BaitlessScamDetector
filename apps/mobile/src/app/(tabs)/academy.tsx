import { router } from 'expo-router';
import {
  CaretRight,
  ChatCircleText,
  CheckCircle,
  Fire,
  GraduationCap,
  Link as LinkIcon,
  LockSimple,
  Phone,
  ShieldCheck,
  Gift,
  Globe,
  type Icon,
} from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { CERT_HOTLINE, CERT_REPORT_URL } from '@/features/community/report';
import { PRACTICE, QUIZZES, type BadgeId, type QuizId } from '@/features/academy/content';
import { activeStreak, levelFor, useProgress } from '@/features/academy/progress';

const QUIZ_ICON: Record<QuizId, Icon> = { otp: ShieldCheck, links: LinkIcon, offers: Gift };
const BADGES: BadgeId[] = [
  'first_catch',
  'sharp_eye',
  'otp_safe',
  'link_checker',
  'offer_skeptic',
  'streak_3',
];

export default function AcademyScreen() {
  const { t } = useTranslation();
  const progress = useProgress();
  const [primary, muted] = useCSSVariable(['--color-primary', '--color-muted']) as (
    string | undefined
  )[];
  const { current, next, toNext } = levelFor(progress.points);
  const streak = activeStreak(progress);
  const levelStart = current.min;
  const levelEnd = next?.min ?? current.min;
  const fill = next ? (progress.points - levelStart) / (levelEnd - levelStart) : 1;

  return (
    <Screen>
      <View className="gap-2">
        <Text variant="headline" accessibilityRole="header">
          {t('academy.title')}
        </Text>
        <Text className="text-muted">{t('academy.intro')}</Text>
      </View>

      {/* Level and streak */}
      <View
        accessible
        accessibilityLabel={`${t(`academy.level.${current.id}`)}. ${t('academy.points', { n: progress.points })}. ${next ? t('academy.toNext', { n: toNext, level: t(`academy.level.${next.id}`) }) : t('academy.maxLevel')}`}
        className="gap-3 rounded-lg bg-primary-container p-4">
        <View className="flex-row items-center gap-3">
          <GraduationCap size={28} color={primary} weight="fill" />
          <View className="flex-1">
            <Text variant="title" className="text-on-primary-container">
              {t(`academy.level.${current.id}`)}
            </Text>
            <Text variant="label" weight="regular" className="text-on-primary-container">
              {t('academy.points', { n: progress.points })}
            </Text>
          </View>
          {streak > 0 ? (
            <View className="flex-row items-center gap-1">
              <Fire size={20} color={primary} weight="fill" />
              <Text variant="label" className="text-on-primary-container">
                {t('academy.streak', { n: streak })}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-surface">
          <View
            style={{ width: `${Math.min(1, fill) * 100}%` }}
            className="h-full rounded-full bg-primary"
          />
        </View>
        <Text variant="label" weight="regular" className="text-on-primary-container">
          {next
            ? t('academy.toNext', { n: toNext, level: t(`academy.level.${next.id}`) })
            : t('academy.maxLevel')}
        </Text>
      </View>

      {/* Practice */}
      <View className="gap-3 rounded-md border border-outline-variant bg-surface p-4">
        <View className="flex-row items-center gap-2">
          <ChatCircleText size={22} color={primary} />
          <Text variant="title">{t('academy.practice.title')}</Text>
        </View>
        <Text className="text-muted">{t('academy.practice.body')}</Text>
        <Text variant="label" weight="regular" className="text-muted">
          {t('academy.practice.mastered', {
            n: progress.practiceMastered.length,
            total: PRACTICE.length,
          })}
        </Text>
        <Button
          title={t('academy.practice.start')}
          icon={ChatCircleText}
          onPress={() => router.push('/academy/practice')}
        />
      </View>

      {/* Quizzes */}
      <View className="gap-3">
        <Text variant="title" accessibilityRole="header">
          {t('academy.quizzes')}
        </Text>
        {QUIZZES.map((quiz) => {
          const QuizIcon = QUIZ_ICON[quiz.id];
          const best = progress.quizBest[quiz.id];
          const perfect = best === quiz.questions.length;
          const status =
            best === undefined
              ? t('academy.quiz.notStarted')
              : t('academy.quiz.best', { n: best, total: quiz.questions.length });
          return (
            <Pressable
              key={quiz.id}
              accessibilityRole="button"
              accessibilityLabel={`${t(`academy.quiz.${quiz.id}.title`)}. ${status}`}
              onPress={() =>
                router.push({ pathname: '/academy/quiz/[id]', params: { id: quiz.id } })
              }
              className="min-h-16 flex-row items-center gap-3 rounded-md border border-outline-variant bg-surface p-4 active:bg-surface-container-high">
              <QuizIcon size={24} color={primary} />
              <View className="flex-1 gap-0.5">
                <Text weight="semibold">{t(`academy.quiz.${quiz.id}.title`)}</Text>
                <View className="flex-row items-center gap-1">
                  {perfect ? <CheckCircle size={16} color={primary} weight="fill" /> : null}
                  <Text variant="label" weight="regular" className="text-muted">
                    {status}
                  </Text>
                </View>
              </View>
              <CaretRight size={20} color={muted} />
            </Pressable>
          );
        })}
      </View>

      {/* Badges */}
      <View className="gap-3">
        <Text variant="title" accessibilityRole="header">
          {t('academy.badges.title')}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {BADGES.map((id) => (
            <Badge key={id} id={id} earned={progress.badges.includes(id)} />
          ))}
        </View>
      </View>

      {/* If it already happened */}
      <View className="gap-3 rounded-md bg-caution-container p-4">
        <Text weight="semibold" className="text-on-caution-container">
          {t('academy.scammed.title')}
        </Text>
        <Text className="text-on-caution-container">{t('academy.scammed.body')}</Text>
        <Button
          title={t('report.openCert')}
          icon={Globe}
          variant="outlined"
          onPress={() => void Linking.openURL(CERT_REPORT_URL)}
        />
        <Button
          title={t('report.callCert', { number: CERT_HOTLINE })}
          icon={Phone}
          variant="outlined"
          onPress={() => void Linking.openURL(`tel:${CERT_HOTLINE}`)}
        />
      </View>
    </Screen>
  );
}

function Badge({ id, earned }: { id: BadgeId; earned: boolean }) {
  const { t } = useTranslation();
  const [primary, muted] = useCSSVariable(['--color-primary', '--color-muted']) as (
    string | undefined
  )[];
  const BadgeIcon = earned ? CheckCircle : LockSimple;
  return (
    <View
      accessible
      accessibilityLabel={`${t(`academy.badges.${id}.name`)}. ${earned ? t('academy.badges.earned') : t('academy.badges.locked')}. ${t(`academy.badges.${id}.how`)}`}
      className={`w-[47%] grow gap-1 rounded-md border p-3 ${earned ? 'border-primary bg-primary-container' : 'border-outline-variant bg-surface'}`}>
      <View className="flex-row items-center gap-1.5">
        <BadgeIcon
          size={18}
          color={earned ? primary : muted}
          weight={earned ? 'fill' : 'regular'}
        />
        <Text variant="label" className={earned ? 'text-on-primary-container' : 'text-muted'}>
          {earned ? t('academy.badges.earned') : t('academy.badges.locked')}
        </Text>
      </View>
      <Text weight="semibold" className={earned ? 'text-on-primary-container' : ''}>
        {t(`academy.badges.${id}.name`)}
      </Text>
      <Text
        variant="label"
        weight="regular"
        className={earned ? 'text-on-primary-container' : 'text-muted'}>
        {t(`academy.badges.${id}.how`)}
      </Text>
    </View>
  );
}
