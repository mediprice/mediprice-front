import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/** 항목·병원 주소가 없을 때 셸(내비·푸터) 안에서 보여 주고, 다시 찾을 길(검색·홈)을 먼저 둔다. 본문 main은 하위 레이아웃이 감싼다. */
export async function SubNotFound({ kind }: { kind: 'item' | 'hospital' }) {
  const t = await getTranslations('errors.page.notFound');
  const title = t(kind === 'item' ? 'itemTitle' : 'hospitalTitle');
  return (
    <>
      <SubTopBar title={title} backHref="/" />
      <div className="flex flex-1 items-center justify-center">
        <PageContainer className="py-section">
          <EmptyState
            titleAs="h1"
            icon={<SearchX />}
            title={title}
            description={t(
              kind === 'item' ? 'itemDescription' : 'hospitalDescription',
            )}
            action={
              <>
                <Button asChild variant="tint" size="md">
                  <Link
                    href={
                      kind === 'item'
                        ? '/search'
                        : { pathname: '/search', query: { type: 'hospital' } }
                    }
                  >
                    {t('search')}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="md">
                  <Link href="/">{t('home')}</Link>
                </Button>
              </>
            }
          />
        </PageContainer>
      </div>
    </>
  );
}
