import { cn } from '@/lib/utils';

/** 프로필 사진은 외부(Google) 주소라 싣지 않고 이름 첫 글자로 보여 준다. */
export function UserAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-tint text-title text-primary-text lg:size-16',
        className,
      )}
    >
      {Array.from(name)[0]}
    </span>
  );
}
