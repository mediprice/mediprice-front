import { ImageResponse } from 'next/og';

import { BrandTile } from './_components/brand-tile';

const SIZES = [32, 192, 512];

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
  return new ImageResponse(<BrandTile size={size} />, {
    width: size,
    height: size,
  });
}
