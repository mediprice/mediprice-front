'use client';

import {
  type AbstractIntlMessages,
  NextIntlClientProvider,
  useLocale,
  useMessages,
} from 'next-intl';
import { type ReactNode, useMemo } from 'react';

import { mergeMessages } from './message-scope';

/** 안쪽 provider는 바깥 문구를 물려받지 않으므로 바깥 문구와 합쳐서 넘긴다. */
export function MergeMessages({
  messages,
  children,
}: {
  messages: AbstractIntlMessages;
  children: ReactNode;
}) {
  const locale = useLocale();
  const parent = useMessages();
  const merged = useMemo(
    () => mergeMessages(parent, messages),
    [parent, messages],
  );
  return (
    <NextIntlClientProvider locale={locale} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}
