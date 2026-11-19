'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

/** 지도 SDK는 브라우저에서만 돌아서 지도 코드를 서버 렌더링과 첫 번들에서 빼고 필요할 때 불러온다. */
export const LazyHospitalMap = dynamic(
  () => import('./hospital-map').then((module) => module.HospitalMap),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full rounded-none" />,
  },
);
