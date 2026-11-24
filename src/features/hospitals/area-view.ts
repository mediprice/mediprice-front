/** 병원이 가운데에 오고, 가까운 이웃 몇 곳이 함께 보이는 폭(최소·최대). */
const MIN_VIEW_RADIUS = 400;
const MAX_VIEW_RADIUS = 1000;
const NEIGHBORS_IN_VIEW = 4;

/** 지도는 검색 영역이 바뀔 때만 다시 맞추므로, 다시 받은 목록이 같으면 같은 값이 되게 숫자로 돌려준다. */
export function areaViewRadius(
  neighbors: readonly { ykiho: string; distanceMeters: number }[] | undefined,
  ykiho: string,
) {
  const distances = (neighbors ?? [])
    .filter((hospital) => hospital.ykiho !== ykiho)
    .map((hospital) => hospital.distanceMeters);
  const reach = distances[Math.min(NEIGHBORS_IN_VIEW, distances.length) - 1];
  return Math.min(
    MAX_VIEW_RADIUS,
    Math.max(MIN_VIEW_RADIUS, (reach ?? 0) * 1.15),
  );
}
