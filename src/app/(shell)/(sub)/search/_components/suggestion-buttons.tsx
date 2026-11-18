import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { Region } from '@/features/search/search-params';

import { suggestionHref, type SuggestionId } from './suggestion-href';

/** 결과 없음 패널의 다음 행동. 마지막은 AI 찾기다. */
export function SuggestionButtons({
  links,
  keyword,
  region,
}: {
  links: SuggestionId[];
  keyword: string;
  region: Region;
}) {
  const t = useTranslations('search.suggestions');
  return (
    <>
      {links.map((id) => (
        <Button key={id} asChild size="md" variant="tint">
          <Link href={suggestionHref(id, keyword, region)}>
            {t(`${id}.title`)}
          </Link>
        </Button>
      ))}
      <Button asChild size="md" variant="tint">
        <Link href="/ai">{t('ai.title')}</Link>
      </Button>
    </>
  );
}
