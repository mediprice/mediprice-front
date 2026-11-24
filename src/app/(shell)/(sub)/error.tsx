'use client';

import { RouteError } from '@/app/(shell)/_components/route-error';

export default function SubError(props: { error: unknown; retry: () => void }) {
  return <RouteError {...props} />;
}
