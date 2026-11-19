import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { ServiceRegion } from '@/features/regions/service-region';

import { suggestionHref, type SuggestionId } from './suggestion-href';

/** 결과 없음의 다음 행동. 첫 번째만 tint로 강조하고 나머지(마지막은 AI 찾기)는 ghost로 쌓는다. */
export function SuggestionButtons({
  links,
  keyword,
  region,
}: {
  links: SuggestionId[];
  keyword: string;
  region: ServiceRegion;
}) {
  const t = useTranslations('search.suggestions');
  return (
    <>
      {links.map((id, index) => (
        <Button
          key={id}
          asChild
          size="md"
          variant={index === 0 ? 'tint' : 'ghost'}
        >
          <Link href={suggestionHref(id, keyword, region)}>
            {t(`${id}.title`)}
          </Link>
        </Button>
      ))}
      <Button asChild size="md" variant="ghost">
        <Link href="/ai">{t('ai.title')}</Link>
      </Button>
    </>
  );
}
