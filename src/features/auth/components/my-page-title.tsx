import { cn } from '@/lib/utils';

/** 내 정보 하위 화면의 문장형 제목과 한 줄 설명. 모바일은 위 바가 짧은 화면 이름을 보여 주고 여기서는 문장으로 말한다. */
export function MyPageTitle({
  id,
  title,
  description,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 lg:mt-2', className)}>
      <h1
        id={id}
        tabIndex={id ? -1 : undefined}
        className="text-title text-balance outline-none"
      >
        {title}
      </h1>
      {description && (
        <p className="text-body text-text-secondary">{description}</p>
      )}
    </div>
  );
}
