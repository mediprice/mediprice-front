import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { ClientMessages } from '@/i18n/client-messages';

import { MedicalProfileView } from './_components/medical-profile-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('library.medicalProfile');
  return { title: t('title') };
}

/** S-11 의료 프로필. 백엔드는 자유 글 칸(질환·약·알레르기·메모)과 출생 연도·성별만 저장한다. */
export default async function MedicalProfilePage() {
  const t = await getTranslations('library.medicalProfile');
  return (
    <ClientMessages
      namespaces={['library.medicalProfile', 'legal.document', 'mypage.menu']}
    >
      <SubTopBar title={t('title')} backHref="/my" />
      <MedicalProfileView />
    </ClientMessages>
  );
}
