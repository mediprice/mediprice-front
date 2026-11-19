import { splitTrailingUnit } from '@/features/hospitals/price-groups';

/** 세부 항목 이름. "-N / 20분"처럼 단위만 다음 줄로 떨어지지 않게 마지막 조각을 붙여 둔다. */
export function VariantName({ name }: { name: string }) {
  const [head, tail] = splitTrailingUnit(name);
  return (
    <span className="text-balance">
      {head}
      {tail && <span className="whitespace-nowrap">{tail}</span>}
    </span>
  );
}
