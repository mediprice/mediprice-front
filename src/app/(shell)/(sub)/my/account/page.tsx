import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';

import { AccountView } from './_components/account-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mypage.account');
  return { title: t('metaTitle') };
}

export default async function AccountPage() {
  const t = await getTranslations('mypage.account');
  return (
    <>
      <SubTopBar title={t('title')} backHref="/my" />
      <AccountView />
    </>
  );
}
