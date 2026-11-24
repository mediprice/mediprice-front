/** 같은 이름의 URL 파라미터가 여러 번 오면(`?q=a&q=b`) 첫 값만 쓴다. */
export function firstParam(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}
