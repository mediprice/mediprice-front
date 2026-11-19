'use client';

import { useState } from 'react';

/** 데이터가 없는 쿼리는 다시 불러오는 동안 pending으로 돌아가 에러 칸이 사라지므로, 다시 시도하는 동안 마지막 에러를 붙잡아 둔다. */
export function useStickyError(
  error: unknown,
  refetch: () => Promise<unknown>,
) {
  const [held, setHeld] = useState<unknown>(null);
  return {
    error: error ?? held,
    isRetrying: held != null,
    retry: async () => {
      setHeld(error);
      try {
        await refetch();
      } finally {
        setHeld(null);
      }
    },
  };
}
