import { setupServer } from 'msw/node';

/** 백엔드(http://api.test)를 대신하는 테스트용 서버 */
export const server = setupServer();
export const API = 'http://api.test';
