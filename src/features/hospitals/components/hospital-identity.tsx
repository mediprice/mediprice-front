import type { ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** 병원 카드가 어느 화면에서나 같은 모양을 쓰도록 이름(위)과 종별·지역 같은 부가 정보(아래)를 묶는다. */
export function HospitalIdentity({
  name,
  meta,
  as: Name = 'p',
  nameClassName,
  children,
  className,
}: {
  name: ReactNode;
  /** "의원 · 서울 강남구"처럼 이미 합친 한 줄. */
  meta?: ReactNode;
  as?: ElementType;
  nameClassName?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <Name className={cn('text-subheading text-balance', nameClassName)}>
        {name}
      </Name>
      {meta && <p className="text-body-sm text-text-secondary">{meta}</p>}
      {children}
    </div>
  );
}
