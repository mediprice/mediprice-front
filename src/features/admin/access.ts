import type { CurrentUser } from '@/features/auth/queries';

/** 백엔드 `Role` enum(USER, ADMIN)의 이름. `/api/users/me`의 role이 문자열로 온다. */
const ADMIN_ROLE = 'ADMIN';

export function isAdmin(user: CurrentUser | null) {
  return user?.role === ADMIN_ROLE;
}
