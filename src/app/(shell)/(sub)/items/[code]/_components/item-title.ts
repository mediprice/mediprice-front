type ItemNameParts = {
  name: string;
  mdivName: string | null;
};

/** 항목 이름은 "대분류/중분류/세부" 경로라서, 대분류는 꼬리표로 보여 주고 제목에서는 뺀다. */
export function formatItemTitle({ name, mdivName }: ItemNameParts) {
  const prefix = mdivName ? `${mdivName}/` : '';
  const title =
    prefix && name.startsWith(prefix) ? name.slice(prefix.length) : name;
  return title.split('/').join(' · ');
}
