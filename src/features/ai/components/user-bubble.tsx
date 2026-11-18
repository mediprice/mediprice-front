import { useTranslations } from 'next-intl';

export function UserBubble({ text }: { text: string }) {
  const t = useTranslations('ai.log');
  return (
    <div className="flex justify-end pl-9">
      <p className="max-w-[min(100%,36rem)] min-w-0 rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-body whitespace-pre-line text-on-primary">
        <span className="sr-only">{t('user')} </span>
        {text}
      </p>
    </div>
  );
}
