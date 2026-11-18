import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AiChat } from '@/features/ai/components/ai-chat';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ai.metadata');
  return { title: t('title'), description: t('description') };
}

export default function AiPage() {
  return <AiChat />;
}
