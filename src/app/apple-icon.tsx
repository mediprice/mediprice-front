import { ImageResponse } from 'next/og';

import { BrandTile } from './_components/brand-tile';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(<BrandTile size={size.width} isSquare />, size);
}
