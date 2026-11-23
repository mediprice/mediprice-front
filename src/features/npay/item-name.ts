function segments(path: string) {
  return path.split('/').map((part) => part.trim());
}

/** 항목 이름은 "대분류/중분류/세부" 경로라서, 따로 보여 주는 대분류는 떼고 나머지 단계를 " · "로 잇는다. */
export function formatItemPath(name: string, majorName: string | null) {
  const parts = segments(name);
  const major = majorName ? segments(majorName) : [];
  const hasMajorPrefix =
    major.length > 0 &&
    parts.length > major.length &&
    major.every((part, index) => parts[index] === part);
  return (hasMajorPrefix ? parts.slice(major.length) : parts)
    .filter(Boolean)
    .join(' · ');
}

/** "예방접종료/대상포진/스카이조스터주"처럼 분류 경로가 붙은 이름의 마지막 조각. */
export function lastSegment(name: string) {
  return segments(name).findLast((part) => part !== '') ?? name.trim();
}
