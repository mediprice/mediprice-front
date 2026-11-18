'use client';

import { Activity, Clock, Heart, PenLine } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { GoogleLoginButton } from '@/features/auth/components/google-login-button';
import { MyPageHeader } from '@/features/auth/components/my-page-header';

const BENEFITS = ['favorite', 'history', 'review', 'medicalProfile'] as const;

/** 로그인하지 않은 마이 홈. 권하는 문장과 큰 로그인 버튼, 로그인하면 쓸 수 있는 기능을 줄로 보여 준다. */
export function MySignedOut() {
  const t = useTranslations('mypage.home');
  const tBenefit = useTranslations('auth.loginDialog.benefits');
  const icon = { 'aria-hidden': true, strokeWidth: 1.75 } as const;
  const icons = {
    favorite: <Heart {...icon} />,
    history: <Clock {...icon} />,
    review: <PenLine {...icon} />,
    medicalProfile: <Activity {...icon} />,
  };
  return (
    <>
      <MyPageHeader>
        <h1 className="text-hero text-balance">{t('signedOutTitle')}</h1>
        <p className="text-body-lg text-text-secondary">
          {t('signedOutDescription')}
        </p>
        <GoogleLoginButton
          size="lg"
          className="mt-4 min-h-14 w-full text-subheading md:w-auto md:min-w-80 md:self-start"
        />
      </MyPageHeader>
      <PageContainer className="pt-4 pb-section md:max-w-2xl lg:max-w-page lg:pt-6">
        <section aria-labelledby="my-benefits" className="lg:max-w-2xl">
          <h2
            id="my-benefits"
            className="pb-2 text-label-bold text-text-secondary"
          >
            {t('signedOutBenefitsLabel')}
          </h2>
          <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex min-h-16 items-center gap-4 py-3 text-body-lg"
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-text-secondary [&_svg]:size-5.5"
                >
                  {icons[benefit]}
                </span>
                {tBenefit(benefit)}
              </li>
            ))}
          </ul>
        </section>
      </PageContainer>
    </>
  );
}
