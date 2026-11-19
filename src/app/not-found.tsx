import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { BrandLink } from '@/components/layout/brand-link';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('errors.page.notFound');
  return { title: t('title') };
}

/** 일치하는 라우트가 없을 때 루트 레이아웃 안에서만(셸 없이) 렌더되므로 로고 머리를 직접 둔다. */
export default async function NotFound() {
  const t = await getTranslations('errors.page.notFound');
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-top-bar items-center border-b border-hairline lg:h-top-nav">
        <PageContainer>
          <BrandLink />
        </PageContainer>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center py-section outline-none"
      >
        <EmptyState
          titleAs="h1"
          icon={<SearchX />}
          title={t('title')}
          description={t('description')}
          action={
            <>
              <Button asChild variant="tint" size="md">
                <Link href="/">{t('home')}</Link>
              </Button>
              <Button asChild variant="ghost" size="md">
                <Link href="/search">{t('search')}</Link>
              </Button>
            </>
          }
        />
      </main>
    </div>
  );
}
