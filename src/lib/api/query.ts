type Primitive = string | number | boolean;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 쿼리 문자열 직렬화.
 *
 * 백엔드(Spring `@ModelAttribute`)는 조건 객체를 `condition`, 페이지를 `pageQuery`라는 하나의 파라미터로
 * 문서화하지만, 실제 요청은 `?keyword=삼성&page=0&size=20`처럼 필드를 평평하게 받는다. 그래서 객체 값은
 * 한 단계 풀어서 보내고, 배열은 백엔드가 받는 쉼표 구분(`ykihos=A,B`)으로 이어 붙인다.
 */
export function serializeQuery(query: Record<string, unknown>) {
  const search = new URLSearchParams();

  const append = (name: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) search.append(name, value.join(','));
      return;
    }
    search.append(name, String(value as Primitive));
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
