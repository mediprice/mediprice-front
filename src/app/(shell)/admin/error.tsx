'use client';

import { RouteError } from '../_components/route-error';

export default function AdminError(props: {
  error: unknown;
  retry: () => void;
}) {
  return <RouteError {...props} />;
}
