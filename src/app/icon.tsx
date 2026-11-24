import { ImageResponse } from 'next/og';

import { AppIcon, TabIcon } from './_components/brand-tile';

const SIZES = [32, 192, 512];

/** 이보다 작으면 탭 아이콘(배경 없음, 작은 크기용 심볼), 크면 앱 아이콘이다. */
const TAB_ICON_MAX = 48;

/** 탭 아이콘(32)과 manifest 아이콘(192·512)을 한 파일에서 만든다. 주소는 /icon/<크기>다. */
export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: 'image/png',
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  const icon =
    size <= TAB_ICON_MAX ? <TabIcon size={size} /> : <AppIcon size={size} />;
  return new ImageResponse(icon, {
    width: size,
    height: size,
  });
}
