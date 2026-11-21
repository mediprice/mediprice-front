/** 시행일(YYYY-MM-DD)은 한국 날짜라 서울 자정으로 읽어야 서버(UTC)와 브라우저에서 같은 날로 보인다. */
export function parseLegalDate(date: string) {
  return new Date(`${date}T00:00:00+09:00`);
}
