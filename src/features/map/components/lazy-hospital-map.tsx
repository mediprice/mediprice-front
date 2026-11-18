'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

/** Leaflet은 import하는 순간 window를 읽어서 서버 렌더링에서 빼고 브라우저에서만 불러온다. */
export const LazyHospitalMap = dynamic(
  () => import('./hospital-map').then((module) => module.HospitalMap),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full rounded-none" />,
  },
);
