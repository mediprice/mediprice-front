import { describe, expect, it } from 'vitest';

import { isAdmin } from './access';

describe('isAdmin', () => {
  const user = {
    id: 1,
    email: 'ops@example.com',
    name: null,
    profileImageUrl: null,
  };

  it('역할이 정확히 ADMIN일 때만 운영자다', () => {
    expect(isAdmin({ ...user, role: 'ADMIN' })).toBe(true);
    expect(isAdmin({ ...user, role: 'USER' })).toBe(false);
    expect(isAdmin({ ...user, role: 'admin' })).toBe(false);
    expect(isAdmin({ ...user, role: 'ROLE_ADMIN' })).toBe(false);
  });

  it('로그인하지 않았으면 운영자가 아니다', () => {
    expect(isAdmin(null)).toBe(false);
  });
});
