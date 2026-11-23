import Link from 'next/link';
import type { ReactNode } from 'react';

const LINK =
  'text-primary-text underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

/** 법적 문서 메시지(legal.json)의 <p>·<ul>·<li>·<b>와 문서 간 링크 태그를 화면 요소로 바꾼다. */
export const legalRichTags = {
  p: (chunks: ReactNode) => <p>{chunks}</p>,
  ul: (chunks: ReactNode) => (
    <ul className="list-disc space-y-2 pl-5 marker:text-text-tertiary">
      {chunks}
    </ul>
  ),
  li: (chunks: ReactNode) => <li className="pl-1">{chunks}</li>,
  b: (chunks: ReactNode) => <strong>{chunks}</strong>,
  privacyLink: (chunks: ReactNode) => (
    <Link href="/privacy" className={LINK}>
      {chunks}
    </Link>
  ),
  termsLink: (chunks: ReactNode) => (
    <Link href="/terms" className={LINK}>
      {chunks}
    </Link>
  ),
  reviewsLink: (chunks: ReactNode) => (
    <Link href="/policy/reviews" className={LINK}>
      {chunks}
    </Link>
  ),
};
