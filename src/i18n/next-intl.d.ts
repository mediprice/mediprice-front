import type { formats } from './formats';
import type messages from './messages/ko.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'ko';
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
