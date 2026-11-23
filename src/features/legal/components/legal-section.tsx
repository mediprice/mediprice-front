import type { ReactNode } from 'react';

/** id는 목차의 앵커(#id)다. 문단·목록은 읽기 좋은 폭(65ch)으로 묶고, 표는 본문 폭 전체를 쓴다. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="border-t border-hairline pt-8 first:border-t-0 first:pt-0"
    >
      <h2 id={`${id}-title`} className="text-heading text-text-primary">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-body text-text-primary [&>p]:max-w-prose [&>ul]:max-w-prose">
        {children}
      </div>
    </section>
  );
}
