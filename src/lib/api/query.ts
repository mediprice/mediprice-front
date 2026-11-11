function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 백엔드는 조건 객체를 `condition`으로 문서화하지만 실제 요청은 평평하다. 객체는 한 단계 풀고 배열은 쉼표로 잇는다. */
export function serializeQuery(query: Record<string, unknown>) {
  const search = new URLSearchParams();

  const append = (name: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) search.append(name, value.join(','));
      return;
    }
    search.append(name, String(value));
  };

  for (const [name, value] of Object.entries(query)) {
    if (isPlainObject(value)) {
      for (const [field, fieldValue] of Object.entries(value)) {
        append(field, fieldValue);
      }
    } else {
      append(name, value);
    }
  }
  return search.toString();
}
