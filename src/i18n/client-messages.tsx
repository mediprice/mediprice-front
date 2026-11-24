import { getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';

import { MergeMessages } from './merge-messages';
import { pickMessages } from './message-scope';

/** 이 화면의 클라이언트 컴포넌트만 쓰는 문구를 루트 문구에 더해 넘긴다. 목록은 client-namespaces 테스트가 코드와 대조한다. */
export async function ClientMessages({
  namespaces,
  children,
}: {
  namespaces: readonly string[];
  children: ReactNode;
}) {
  const messages = await getMessages();
  return (
    <MergeMessages messages={pickMessages(messages, namespaces)}>
      {children}
    </MergeMessages>
  );
}
