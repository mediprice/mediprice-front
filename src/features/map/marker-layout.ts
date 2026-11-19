export type LabelCandidate = {
  id: string;
  /** 화면 좌표(px). 같은 확대 수준에서 서로의 거리만 쓰므로 기준점은 상관없다. */
  x: number;
  y: number;
  label: string;
};

/** text-label-bold(15–16px) 핀의 대략적인 크기. 실제 글자 폭보다 조금 넉넉하게 잡는다. */
const CHAR_WIDTH = 8.5;
const PILL_PADDING = 28;
const PILL_HEIGHT = 32;
const GAP = 4;

function boxOf({ x, y, label }: LabelCandidate) {
  const width = label.length * CHAR_WIDTH + PILL_PADDING + GAP;
  const height = PILL_HEIGHT + GAP;
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

type Box = ReturnType<typeof boxOf>;
const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/**
 * 가격 알약이 겹치면 뒤의 것을 점으로 줄인다. 앞에 올수록(고른 것 → 가까운 순) 글자를 남긴다.
 * 줄여야 할 마커 id를 돌려준다.
 */
export function findCollapsedLabels(
  candidates: LabelCandidate[],
  priorityIds: readonly string[] = [],
) {
  const isPriority = (id: string) => priorityIds.includes(id);
  const ordered = [
    ...candidates.filter((candidate) => isPriority(candidate.id)),
    ...candidates.filter((candidate) => !isPriority(candidate.id)),
  ];
  const placed: Box[] = [];
  const collapsed = new Set<string>();
  for (const candidate of ordered) {
    const box = boxOf(candidate);
    if (placed.some((other) => overlaps(box, other))) {
      collapsed.add(candidate.id);
    } else {
      placed.push(box);
    }
  }
  return collapsed;
}
