import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** globals.css의 커스텀 토큰을 등록해야 cn('text-title', 'text-text-primary')에서 앞 클래스가 지워지지 않는다. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'hero',
        'display',
        'title',
        'section',
        'heading',
        'subheading',
        'body-lg',
        'body',
        'body-sm',
        'label',
        'label-bold',
        'caption',
        'caption-strong',
        'caption-bold',
        'price-md',
        'price-lg',
        'price-xl',
        'field',
      ],
      shadow: ['card', 'cta-glow', 'float', 'sheet', 'bar'],
      spacing: ['top-nav', 'top-bar', 'tab-bar', 'section', 'page'],
      container: ['page'],
      ease: ['standard', 'enter'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
