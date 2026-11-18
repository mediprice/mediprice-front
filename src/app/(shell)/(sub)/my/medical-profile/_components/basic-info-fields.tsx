import { useTranslations } from 'next-intl';
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';

import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  type Gender,
  medicalProfileErrorKey,
  type MedicalProfileForm,
} from '@/features/medical-profile/schemas';

const GENDERS = ['', 'MALE', 'FEMALE'] as const satisfies readonly Gender[];

export function BasicInfoFields({
  id,
  control,
  register,
  errors,
}: {
  id: string;
  control: Control<MedicalProfileForm>;
  register: UseFormRegister<MedicalProfileForm>;
  errors: FieldErrors<MedicalProfileForm>;
}) {
  const t = useTranslations('library.medicalProfile');
  const birthYearError = errors.birthYear?.message;
  const genderError = errors.gender?.message;
  return (
    <section
      aria-labelledby={`${id}-basic`}
      className="flex flex-col gap-4 rounded-xl bg-surface p-4 lg:p-6"
    >
      <h2 id={`${id}-basic`} className="text-subheading">
        {t('basicTitle')}
      </h2>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-birthYear`} className="text-label-bold">
            {t('birthYear')}
          </label>
          <input
            id={`${id}-birthYear`}
            type="text"
            inputMode="numeric"
            autoComplete="bday-year"
            maxLength={4}
            aria-invalid={birthYearError ? true : undefined}
            aria-describedby={`${id}-birthYear-hint${birthYearError ? ` ${id}-birthYear-error` : ''}`}
            className="h-12 w-full rounded-lg border border-border-strong bg-bg px-4 text-field tabular-nums aria-invalid:border-danger lg:w-40"
            {...register('birthYear')}
          />
          <p
            id={`${id}-birthYear-hint`}
            className="text-body-sm text-text-secondary"
          >
            {t('birthYearHint')}
          </p>
          {birthYearError && (
            <p
              id={`${id}-birthYear-error`}
              className="text-body-sm text-danger"
            >
              {t(`errors.${medicalProfileErrorKey(birthYearError)}`)}
            </p>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span id={`${id}-gender`} className="text-label-bold">
            {t('gender')}
          </span>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <SegmentedControl
                name={`${id}-gender-option`}
                value={field.value}
                onValueChange={field.onChange}
                aria-labelledby={`${id}-gender`}
                aria-describedby={
                  genderError ? `${id}-gender-error` : undefined
                }
                options={GENDERS.map((value) => ({
                  value,
                  label: t(`genderOption.${value || 'none'}`),
                }))}
                className="lg:max-w-96"
              />
            )}
          />
          {genderError && (
            <p id={`${id}-gender-error`} className="text-body-sm text-danger">
              {t(`errors.${medicalProfileErrorKey(genderError)}`)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
