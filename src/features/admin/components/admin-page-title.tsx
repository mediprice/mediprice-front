/** 운영 화면의 제목과 한 줄 설명. */
export function AdminPageTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-display text-balance">{title}</h1>
      <p className="text-body text-text-secondary">{description}</p>
    </div>
  );
}
