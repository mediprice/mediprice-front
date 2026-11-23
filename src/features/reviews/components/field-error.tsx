import { useTranslations } from 'next-intl';

import { reviewFormErrorKey } from '@/features/reviews/schemas';

/** 후기 폼 칸 아래의 오류 문구. zod 메시지 키를 reviews.form.errors 문구로 바꾼다. */
export function FieldError({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}) {
  const t = useTranslations('reviews.form.errors');
  if (!message) return null;
  return (
    <p id={id} className="text-body-sm text-danger">
      {t(reviewFormErrorKey(message))}
    </p>
  );
}
