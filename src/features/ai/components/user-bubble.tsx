import { useTranslations } from 'next-intl';

export function UserBubble({ text }: { text: string }) {
  const t = useTranslations('ai.log');
  return (
    <div className="flex justify-end pl-10.5 transition-[opacity,translate] duration-300 ease-enter @max-xs:pl-0 starting:translate-y-3 starting:opacity-0">
      <p className="max-w-[min(100%,36rem)] min-w-0 rounded-3xl rounded-br-md bg-primary px-4 py-3 text-body break-words whitespace-pre-line text-on-primary">
        <span className="sr-only">{t('user')} </span>
        {text}
      </p>
    </div>
  );
}
