'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { isAdmin } from '@/features/admin/access';
import { useSession } from '@/features/auth/use-session';

import { AdminNotFound } from './admin-not-found';

/** 운영자에게만 children을 보여 준다. 서버도 막지만, 운영자가 아니면 화면이 있다는 것도 알리지 않도록 404와 같은 모습을 보여 준다. */
export function AdminGate({ children }: { children: ReactNode }) {
  const t = useTranslations('admin.gate');
  const tActions = useTranslations('common.actions');
  const { status, user, refetch } = useSession();

  if (status === 'pending') {
    return (
      <PageContainer role="status" className="flex flex-col gap-4 py-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <span className="sr-only">{t('checking')}</span>
      </PageContainer>
    );
  }

  if (status === 'error') {
    return (
      <PageContainer className="flex flex-1 items-center justify-center py-section">
        <EmptyState
          titleAs="h1"
          icon={<CircleAlert />}
          title={t('errorTitle')}
          description={t('errorDescription')}
          action={
            <Button variant="tint" size="md" onClick={refetch}>
              {tActions('retry')}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!isAdmin(user)) return <AdminNotFound />;

  return children;
}
