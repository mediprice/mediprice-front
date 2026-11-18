import { createLucideIcon } from 'lucide-react';

/** lucide House와 모양이 같지만 문을 몸통 뒤에 그려, 활성 탭에서 몸통을 채워도 문(마지막 path)이 보이게 한다. */
export const HouseIcon = createLucideIcon('house-front-door', [
  [
    'path',
    {
      d: 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      key: 'body',
    },
  ],
  ['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', key: 'door' }],
]);
