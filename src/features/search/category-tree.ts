import type { components } from '@/lib/api/schema';

type NpayCategory = components['schemas']['NpayCategoryResponse'];

type CategoryNode = { code: string; name: string };

export type CategoryView = {
  /** 전체 분류(와 홈 분야) 아래의 경로. 마지막이 지금 보는 분류다. */
  trail: CategoryNode[];
  /** 항목을 조회할 백엔드 분류 코드 */
  scopeCodes: string[];
  /** 하위 분류 칩. "전체" 칩은 parentCode로 간다. */
  chips: CategoryNode[];
  /** "전체" 칩이 가리키는 code 파라미터. undefined면 홈 분야 자체다. */
  parentCode: string | undefined;
  selectedCode: string | undefined;
};

function toNode(code: string, name: string | null): CategoryNode {
  return { code, name: name?.trim() || code };
}

function childrenOf(category: NpayCategory) {
  return category.subCategories.flatMap((sub) =>
    sub.code ? [toNode(sub.code, sub.name)] : [],
  );
}

/** 홈 분야(백엔드 대분류 묶음)나 code 파라미터로 지금 보는 분류를 찾는다. 찾지 못하면 null이다. */
export function resolveCategoryView(
  categories: readonly NpayCategory[],
  { homeCodes, code }: { homeCodes?: readonly string[]; code?: string },
): CategoryView | null {
  if (homeCodes?.length) {
    const majors = homeCodes
      .map((homeCode) => categories.find((c) => c.code === homeCode))
      .filter((c): c is NpayCategory => c !== undefined);
    const [onlyMajor] = majors;
    const chips =
      majors.length === 1 && onlyMajor
        ? childrenOf(onlyMajor)
        : majors.map((c) => toNode(c.code, c.name));
    const selected = code ? chips.find((chip) => chip.code === code) : null;
    if (code && !selected) return null;
    return {
      trail: selected ? [selected] : [],
      scopeCodes: selected ? [selected.code] : [...homeCodes],
      chips,
      parentCode: undefined,
      selectedCode: selected?.code,
    };
  }

  if (!code) return null;
  const major = categories.find((c) => c.code === code);
  if (major) {
    return {
      trail: [toNode(major.code, major.name)],
      scopeCodes: [major.code],
      chips: childrenOf(major),
      parentCode: major.code,
      selectedCode: undefined,
    };
  }
  for (const parent of categories) {
    const chips = childrenOf(parent);
    const selected = chips.find((chip) => chip.code === code);
    if (!selected) continue;
    return {
      trail: [toNode(parent.code, parent.name), selected],
      scopeCodes: [code],
      chips,
      parentCode: parent.code,
      selectedCode: code,
    };
  }
  return null;
}
