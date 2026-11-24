'use client';

import { RouteError } from '@/app/(shell)/_components/route-error';

export default function AdminError(props: {
  error: unknown;
  retry: () => void;
}) {
  return <RouteError {...props} />;
}
