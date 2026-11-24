import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { errorMessageKey } from '@/lib/api/error-message';

/** "더 보기"와 그 실패 배너. 실패해도 이미 본 결과는 그대로 둔다. */
export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  error,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** 다음 페이지 요청이 실패했을 때만 넘긴다. */
  error: unknown;
  onLoadMore: () => void;
}) {
  const t = useTranslations();
  const tErrors = useTranslations('errors');

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-lg bg-danger-tint p-4 lg:flex-row lg:items-center lg:justify-between lg:py-3 lg:pr-3"
      >
        <p className="flex items-start gap-2 text-body-sm text-danger">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4.5 shrink-0"
            strokeWidth={1.75}
          />
          <span>
            <span className="block">{t('search.loadMore.error')}</span>
            <span className="block text-text-secondary">
              {tErrors(errorMessageKey(error))}
            </span>
          </span>
        </p>
        <Button
          variant="onTint"
          size="md"
          isLoading={isFetchingNextPage}
          onClick={onLoadMore}
          className="w-full lg:w-auto"
        >
          {t('common.actions.retry')}
        </Button>
      </div>
    );
  }

  if (!hasNextPage) return null;
  return (
    <div className="flex justify-center pt-2">
      <Button
        variant="tint"
        size="md"
        isLoading={isFetchingNextPage}
        onClick={onLoadMore}
        className="w-full lg:w-auto lg:px-8"
      >
        {t('common.actions.more')}
      </Button>
    </div>
  );
}
