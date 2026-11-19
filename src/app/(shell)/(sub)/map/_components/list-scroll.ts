/** md부터 목록과 지도가 나란히 보인다. */
export const isSideBySide = () =>
  window.matchMedia('(min-width: 48rem)').matches;

/**
 * 옆 목록 열(모바일은 지도 아래 시트)만 스크롤한다. scrollIntoView는 페이지까지 움직여 상단 도구 줄이 가려진다.
 * 시트는 머리가 위에 붙어 있어 그 아래를 위쪽 경계로 본다.
 */
export function scrollListTo(cardId: string) {
  const card = document.getElementById(cardId);
  const list = card?.closest('section');
  if (!card || !list) return;
  const cardBox = card.getBoundingClientRect();
  const listBox = list.getBoundingClientRect();
  const header = list.querySelector('[data-list-header]');
  const top =
    header && getComputedStyle(header).position === 'sticky'
      ? header.getBoundingClientRect().bottom
      : listBox.top;
  if (cardBox.top < top) {
    list.scrollBy({ top: cardBox.top - top - 12 });
  } else if (cardBox.bottom > listBox.bottom) {
    /** 보이는 칸보다 큰 행(낮은 시트)은 아래가 아니라 위를 맞춘다. */
    list.scrollBy({
      top: Math.min(
        cardBox.bottom - listBox.bottom + 12,
        cardBox.top - top - 12,
      ),
    });
  }
}
