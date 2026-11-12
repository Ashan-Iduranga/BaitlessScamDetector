import { Children, type ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { detectScript, type Script } from '@/lib/script';

type Variant = 'display' | 'headline' | 'title' | 'body' | 'label';
type Weight = 'regular' | 'semibold';

const variantClass: Record<Variant, string> = {
  display: 'text-display',
  headline: 'text-headline',
  title: 'text-title',
  body: 'text-body',
  label: 'text-label',
};

const fontClass: Record<Script, Record<Weight, string>> = {
  latin: { regular: 'font-latin', semibold: 'font-latin-semibold' },
  sinhala: { regular: 'font-sinhala', semibold: 'font-sinhala-semibold' },
  tamil: { regular: 'font-tamil', semibold: 'font-tamil-semibold' },
};

const defaultWeight: Record<Variant, Weight> = {
  display: 'semibold',
  headline: 'semibold',
  title: 'semibold',
  body: 'regular',
  label: 'semibold',
};

function plainText(children: ReactNode): string {
  return Children.toArray(children)
    .filter((c): c is string | number => typeof c === 'string' || typeof c === 'number')
    .join('');
}

export type TextProps = RNTextProps & {
  variant?: Variant;
  weight?: Weight;
  className?: string;
};

/** App text. Chooses the Noto family for Latin, Sinhala or Tamil from the content. */
export function Text({ variant = 'body', weight, className = '', children, ...rest }: TextProps) {
  const script = detectScript(plainText(children));
  const font = fontClass[script][weight ?? defaultWeight[variant]];
  return (
    <RNText className={`${variantClass[variant]} ${font} text-foreground ${className}`} {...rest}>
      {children}
    </RNText>
  );
}
