'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { type RefObject, useEffect, useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  type MedicalProfile,
  medicalProfileMutations,
} from '@/features/medical-profile/queries';
import {
  createMedicalProfileSchema,
  hasCurrentConsent,
  type MedicalProfileForm,
  TEXT_FIELDS,
  toFormField,
  toMedicalProfileForm,
  toMedicalProfileRequest,
} from '@/features/medical-profile/schemas';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';
import { useLeaveGuard } from '@/lib/navigation/use-leave-guard';

import { BasicInfoFields } from './basic-info-fields';
import { ConsentField } from './consent-field';
import { ProfileDialogs } from './profile-dialogs';
import { ProfileTextField } from './profile-text-field';

/** 서버 검증 실패를 칸에 붙였으면 true. 붙일 칸이 없으면 일반 오류로 보여 준다. */
function isFieldRejection(error: unknown) {
  return (
    error instanceof ApiError &&
    error.code === 'INVALID_INPUT' &&
    error.fieldErrors.some(({ field }) => toFormField(field) !== null)
  );
}

/** 저장하는 사이 동의 문서가 바뀌었다. 동의 칸을 비우고 다시 묻는다. */
function isConsentRejection(error: unknown) {
  return (
    error instanceof ApiError &&
    error.code === 'MEDICAL_PROFILE_CONSENT_REQUIRED'
  );
}

/** 붙어 있는 저장 바 높이만큼 문서의 아래 스크롤 여백을 둔다. 포커스한 입력칸이 바 아래로 숨지 않게 한다(lg부터는 바가 제자리라 두지 않는다). */
function useStickyBarPadding(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const root = document.documentElement;
    const update = () => {
      if (getComputedStyle(bar).position !== 'sticky') {
        root.style.removeProperty('scroll-padding-bottom');
        return;
      }
      root.style.setProperty(
        'scroll-padding-bottom',
        `calc(${Math.ceil(bar.offsetHeight)}px + 0.5rem)`,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      root.style.removeProperty('scroll-padding-bottom');
    };
  }, [ref]);
}

export function ProfileForm({ profile }: { profile: MedicalProfile | null }) {
  const t = useTranslations('library.medicalProfile');
  const tErrors = useTranslations('errors');
  const format = useFormatter();
  const id = useId();
  const barRef = useRef<HTMLDivElement>(null);
  useStickyBarPadding(barRef);
  const [schema] = useState(() =>
    createMedicalProfileSchema(new Date().getFullYear()),
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    setValue,
    formState: { errors, isDirty },
  } = useForm<MedicalProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: toMedicalProfileForm(profile),
  });
  const texts = useWatch({ control, name: TEXT_FIELDS });
  const [status, setStatus] = useState<'saved' | 'deleted' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const save = useMutation(medicalProfileMutations.save());
  const remove = useMutation(medicalProfileMutations.withdraw());
  const leaveGuard = useLeaveGuard(isDirty);

  function handleSave(values: MedicalProfileForm) {
    setStatus(null);
    save.mutate(toMedicalProfileRequest(values), {
      onSuccess: (saved) => {
        reset(toMedicalProfileForm(saved));
        setStatus('saved');
      },
      onError: (error) => {
        if (isConsentRejection(error)) {
          setValue('consent', false, { shouldDirty: true });
          setError('consent', { message: 'consentOutdated' });
          setFocus('consent');
          return;
        }
        if (!(error instanceof ApiError) || !isFieldRejection(error)) return;
        const fields = error.fieldErrors
          .map(({ field }) => toFormField(field))
          .filter((field) => field !== null);
        for (const field of fields) setError(field, { message: 'invalid' });
        if (fields[0]) setFocus(fields[0]);
      },
    });
  }

  function openDelete() {
    remove.reset();
    setIsDeleting(true);
  }

  function handleDelete() {
    remove.mutate(undefined, {
      onSuccess: () => {
        reset(toMedicalProfileForm(null));
        setIsDeleting(false);
        setStatus('deleted');
      },
    });
  }

  return (
    <form
      noValidate
      aria-labelledby="medical-profile-title"
      onSubmit={handleSubmit(handleSave)}
      className="flex flex-col gap-4"
    >
      <ConsentField
        id={`${id}-consent`}
        error={errors.consent?.message}
        consentedAt={hasCurrentConsent(profile) ? profile?.consentedAt : null}
        {...register('consent')}
      />
      <BasicInfoFields
        id={id}
        control={control}
        register={register}
        errors={errors}
      />
      {TEXT_FIELDS.map((field, index) => (
        <ProfileTextField
          key={field}
          id={`${id}-${field}`}
          label={t(`field.${field}`)}
          placeholder={t(`placeholder.${field}`)}
          text={texts[index] ?? ''}
          error={errors[field]?.message}
          {...register(field)}
        />
      ))}
      <p className="text-caption text-text-tertiary">
        {profile
          ? t('updatedAt', {
              date: format.dateTime(new Date(profile.updatedAt), 'date'),
            })
          : t('notSaved')}
      </p>
      {/** 긴 폼이라 모바일은 저장 바를 화면 아래에 붙인다. 폼 안에서만 붙어 있어 끝에 오면 제자리에 놓이고 내용을 가리지 않는다. */}
      <div
        ref={barRef}
        className="sticky bottom-0 z-(--z-bottom-cta) mx-[calc(50%-50vw)] flex flex-col gap-2 border-t border-hairline bg-bg px-[calc(50vw-50%)] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-bar lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
      >
        {save.isError &&
          !isFieldRejection(save.error) &&
          !isConsentRejection(save.error) && (
            <p role="alert" className="text-body-sm text-danger">
              {tErrors(errorMessageKey(save.error))}
            </p>
          )}
        <p role="status" className="text-body-sm text-positive empty:hidden">
          {status && !isDirty && t(status)}
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            isLoading={save.isPending}
            className="w-full lg:w-auto lg:min-w-30"
          >
            {t('save')}
          </Button>
          {profile && (
            <DeleteButton
              onClick={openDelete}
              className="hidden lg:inline-flex"
            />
          )}
        </div>
      </div>
      {profile && (
        <DeleteButton onClick={openDelete} className="w-full lg:hidden" />
      )}
      <ProfileDialogs
        isDeleting={isDeleting}
        onDeletingChange={setIsDeleting}
        onDelete={handleDelete}
        isDeletePending={remove.isPending}
        deleteError={
          remove.isError ? tErrors(errorMessageKey(remove.error)) : null
        }
        isDeleteDone={remove.isSuccess}
        leaveGuard={leaveGuard}
      />
    </form>
  );
}

function DeleteButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className: string;
}) {
  const t = useTranslations('library.medicalProfile');
  return (
    <Button
      variant="dangerText"
      size="lg"
      onClick={onClick}
      className={className}
    >
      {t('remove')}
    </Button>
  );
}
