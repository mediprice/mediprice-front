/** AI 서버는 결과 답 끝에 비급여 고지를 붙인다. 결과 목록이 같은 고지를 따로 보여 주므로 말풍선에서는 뺀다. 문구가 달라지면 그대로 둔다. */
export function withoutNotice(reply: string, notice: string) {
  if (!notice || !reply.includes(notice)) return reply;
  return reply
    .split(notice)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
}

/* eslint-disable-next-line no-restricted-syntax -- 화면 문구가 아니라 AI가 준 이유에서 찾을 낱말이다. */
const JUDGE_MARKER = '사용자';

/** "사용자가 요청한 … 항목과 일치함"처럼 사용자를 3인칭으로 부르는 이유는 판정 메모라 보여 주지 않는다. */
export function isShownReason(reason: string) {
  const text = reason.trim();
  return text.length > 0 && !text.includes(JUDGE_MARKER);
}
