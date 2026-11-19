import type { Formats } from 'next-intl';

export const formats = {
  dateTime: {
    date: { year: 'numeric', month: 'long', day: 'numeric' },
    dateShort: { year: 'numeric', month: '2-digit', day: '2-digit' },
    dateTime: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
  },
} satisfies Formats;
