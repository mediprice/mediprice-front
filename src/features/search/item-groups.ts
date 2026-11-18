import type { components } from '@/lib/api/schema';

type NpayItem = components['schemas']['NpayItemResponse'];

export type ItemGroup = {
  key: string;
  /** 대분류와 중분류 이름. 같거나 없는 단계는 뺀다. */
  path: string[];
  items: NpayItem[];
};

/** 공식 이름 "이학요법료/도수치료"에서 묶음 머리에 이미 보이는 대분류를 빼고 단계를 " · "로 잇는다. */
export function formatItemName({ name, mdivName }: NpayItem) {
  const parts = name.split('/').map((part) => part.trim());
  const rest =
    mdivName && parts.length > 1 && parts[0] === mdivName.trim()
      ? parts.slice(1)
      : parts;
  return rest.filter(Boolean).join(' · ');
}

/** 중분류로 묶는다. 처음 나온 순서를 지키므로 "더 보기"로 늘어나도 앞 묶음의 위치가 바뀌지 않는다. */
export function groupItems(items: readonly NpayItem[]): ItemGroup[] {
  const groups = new Map<string, ItemGroup>();
  for (const item of items) {
    const key = item.sdivCode ?? item.mdivCode ?? '';
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
      continue;
    }
    const path = [item.mdivName, item.sdivName]
      .map((name) => name?.trim())
      .filter((name): name is string => Boolean(name))
      .filter((name, index, names) => names.indexOf(name) === index);
    groups.set(key, { key, path, items: [item] });
  }
  return [...groups.values()];
}
