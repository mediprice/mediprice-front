import { getRequestConfig } from 'next-intl/server';

import { formats } from './formats';
import { messages } from './messages/ko';

/** 쿠키·헤더를 읽지 않아야 페이지가 정적 렌더링으로 남는다. 시간대는 Vercel SSR(UTC)과 브라우저가 같도록 고정한다. */
export default getRequestConfig(() => ({
  locale: 'ko',
  messages,
  timeZone: 'Asia/Seoul',
  formats,
}));
