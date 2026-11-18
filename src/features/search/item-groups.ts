import type { components } from '@/lib/api/schema';

type NpayItem = components['schemas']['NpayItemResponse'];
type CategoryRef = { code: string; name: string };

export type ItemGroup<T extends NpayItem> = {
  key: string;
  /** 대분류. 화면이 쉬운 이름으로 바꿔 보여 줄 수 있게 코드도 둔다. */
  major: CategoryRef | null;
  /** 중분류. 대분류와 같거나 없으면 null이다. */
  minor: CategoryRef | null;
  items: T[];
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

function toRef(code: string | null, name: string | null) {
  const trimmed = name?.trim();
  return code && trimmed ? { code, name: trimmed } : null;
}

/** 중분류로 묶는다. 처음 나온 순서를 지키므로 "더 보기"로 늘어나도 앞 묶음의 위치가 바뀌지 않는다. */
export function groupItems<T extends NpayItem>(
  items: readonly T[],
): ItemGroup<T>[] {
  const groups = new Map<string, ItemGroup<T>>();
  for (const item of items) {
    const key = item.sdivCode ?? item.mdivCode ?? '';
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
      continue;
    }
    const major = toRef(item.mdivCode, item.mdivName);
    const minor = toRef(item.sdivCode, item.sdivName);
    groups.set(key, {
      key,
      major,
      minor: minor && minor.name !== major?.name ? minor : null,
      items: [item],
    });
  }
  return [...groups.values()];
}

/** 묶음 머리에 보일 단계. omitSharedMajor면 모두 같은 대분류일 때 대분류를 빼고, 항목 하나뿐인 묶음의 머리가 그 이름과 같으면 null이다. */
export function groupHeadingParts<T extends NpayItem>(
  groups: readonly ItemGroup<T>[],
  { omitSharedMajor = false }: { omitSharedMajor?: boolean } = {},
) {
  const firstMajor = groups[0]?.major?.code;
  const isShared =
    omitSharedMajor &&
    firstMajor !== undefined &&
    groups.every((group) => group.major?.code === firstMajor);
  return groups.map((group) => {
    if (!isShared) return { major: group.major, minor: group.minor };
    const [only, ...rest] = group.items;
    const label = group.minor?.name ?? group.major?.name;
    if (only && rest.length === 0 && formatItemName(only) === label) {
      return null;
    }
    return { major: group.minor ? null : group.major, minor: group.minor };
  });
}

/** 그 지역에 가격이 없다고 확인된 항목만 따로 뺀다. 모르는 항목(null)은 가격이 있는 쪽에 둔다. */
export function partitionByPrice<T extends { hasPrice: boolean | null }>(
  items: readonly T[],
) {
  return {
    priced: items.filter((item) => item.hasPrice !== false),
    unpriced: items.filter((item) => item.hasPrice === false),
  };
}
