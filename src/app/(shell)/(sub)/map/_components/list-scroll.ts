export const isDesktop = () => window.matchMedia('(min-width: 64rem)').matches;

/** 데스크톱 목록 열만 스크롤한다. scrollIntoView는 페이지까지 움직여 상단 도구 줄이 가려진다. */
export function scrollListTo(cardId: string) {
  const card = document.getElementById(cardId);
  const list = card?.closest('section');
  if (!card || !list) return;
  const cardBox = card.getBoundingClientRect();
  const listBox = list.getBoundingClientRect();
  if (cardBox.top < listBox.top) {
    list.scrollBy({ top: cardBox.top - listBox.top - 12 });
  } else if (cardBox.bottom > listBox.bottom) {
    list.scrollBy({ top: cardBox.bottom - listBox.bottom + 12 });
  }
}
