'use client';

import { RouteError } from '../_components/route-error';

export default function TabsError(props: {
  error: unknown;
  retry: () => void;
}) {
  return <RouteError {...props} />;
}
