import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './server';

// 처리하지 않은 요청은 오류로 만들어, 테스트가 실제 네트워크로 나가지 못하게 한다.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
