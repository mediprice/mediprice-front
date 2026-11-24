export type LabelCandidate = {
  id: string;
  /** 화면 좌표(px). 같은 확대 수준에서 서로의 거리만 쓰므로 기준점은 상관없다. */
  x: number;
  y: number;
  label: string;
};

/** text-caption-bold(13px) 알약의 대략적인 크기. 실제 글자 폭보다 조금 넉넉하게 잡는다. */
const CHAR_WIDTH = 7.5;
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

type PositionedMarker = {
  id: string;
  position: { lat: number; lng: number };
  kind: string;
};

export type MarkerGroup<T extends PositionedMarker> = {
  key: string;
  members: [T, ...T[]];
};

/** 소수 다섯째 자리(약 1m)까지 같으면 같은 자리로 본다. */
const positionKey = ({ lat, lng }: PositionedMarker['position']) =>
  `${lat.toFixed(5)},${lng.toFixed(5)}`;

/**
 * 같은 자리의 병원 마커를 하나로 묶는다. 겹친 마커끼리 hover가 번갈아 바뀌지 않게 한다.
 * 묶음과 그 안의 순서는 목록 순서(가까운 순·가격 순)를 따르고, 기준 장소(place)는 묶지 않는다.
 */
export function groupByPosition<T extends PositionedMarker>(
  markers: readonly T[],
) {
  const groups = new Map<string, MarkerGroup<T>>();
  for (const marker of markers) {
    const key =
      marker.kind === 'place'
        ? `place:${marker.id}`
        : positionKey(marker.position);
    const group = groups.get(key);
    if (group) group.members.push(marker);
    else groups.set(key, { key, members: [marker] });
  }
  return [...groups.values()];
}

/** 묶음을 누를 때 고를 병원. 지금 병원이 묶음 밖이면 첫 병원, 안이면 다음 병원(끝이면 처음)이다. */
export function nextMemberId(
  members: readonly [{ id: string }, ...{ id: string }[]],
  currentId: string | null,
) {
  const index = members.findIndex((member) => member.id === currentId);
  return (members[(index + 1) % members.length] ?? members[0]).id;
}

/** 묶음 마커에 보일 병원. 고른 병원이 묶음 안에 있으면 그 병원, 아니면 목록에서 앞선 병원이다. */
export function representativeOf<T extends PositionedMarker>(
  group: MarkerGroup<T>,
  selectedId: string | null,
) {
  return (
    group.members.find((member) => member.id === selectedId) ?? group.members[0]
  );
}
