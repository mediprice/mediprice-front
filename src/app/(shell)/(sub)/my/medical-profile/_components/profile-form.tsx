'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  type MedicalProfile,
  medicalProfileMutations,
} from '@/features/medical-profile/queries';
import {
  createMedicalProfileSchema,
  type MedicalProfileForm,
  TEXT_FIELDS,
  toFormField,
  toMedicalProfileForm,
  toMedicalProfileRequest,
} from '@/features/medical-profile/schemas';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

import { BasicInfoFields } from './basic-info-fields';
import { ConsentField } from './consent-field';
import { ProfileDialogs } from './profile-dialogs';
import { ProfileTextField } from './profile-text-field';
import { useLeaveGuard } from './use-leave-guard';

/** 서버 검증 실패를 칸에 붙였으면 true. 붙일 칸이 없으면 일반 오류로 보여 준다. */
function isFieldRejection(error: unknown) {
  return (
    error instanceof ApiError &&
    error.code === 'INVALID_INPUT' &&
    error.fieldErrors.some(({ field }) => toFormField(field) !== null)
  );
}

export function ProfileForm({ profile }: { profile: MedicalProfile | null }) {
  const t = useTranslations('library.medicalProfile');
  const tErrors = useTranslations('errors');
  const format = useFormatter();
  const id = useId();
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
    formState: { errors, isDirty },
  } = useForm<MedicalProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: toMedicalProfileForm(profile),
  });
  const texts = useWatch({ control, name: TEXT_FIELDS });
  const [status, setStatus] = useState<'saved' | 'deleted' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const save = useMutation(medicalProfileMutations.save());
  const remove = useMutation(medicalProfileMutations.remove());
  const leaveGuard = useLeaveGuard(isDirty);

  function handleSave(values: MedicalProfileForm) {
    setStatus(null);
    save.mutate(toMedicalProfileRequest(values), {
      onSuccess: (saved) => {
        reset(toMedicalProfileForm(saved));
        setStatus('saved');
      },
      onError: (error) => {
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
      className="flex flex-col gap-8"
    >
      <ConsentField
        id={`${id}-consent`}
        error={errors.consent?.message}
        {...register('consent')}
      />
      <BasicInfoFields
        id={id}
        control={control}
        register={register}
        errors={errors}
      />
      <section
        aria-labelledby={`${id}-health`}
        className="flex flex-col gap-6 border-t border-hairline pt-8"
      >
        <div className="flex flex-col gap-1">
          <h2 id={`${id}-health`} className="text-heading">
            {t('healthTitle')}
          </h2>
          <p className="text-body text-text-secondary">
            {t('healthDescription')}
          </p>
        </div>
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
      </section>
      <p className="-mt-4 text-body-sm text-text-secondary">
        {profile
          ? t('updatedAt', {
              date: format.dateTime(new Date(profile.updatedAt), 'date'),
            })
          : t('notSaved')}
      </p>
      {/** 긴 폼이라 모바일은 저장 바를 화면 아래에 붙인다. 폼 안에서만 붙어 있어 끝에 오면 제자리에 놓이고 내용을 가리지 않는다. */}
      <div className="sticky bottom-0 z-(--z-bottom-cta) mx-[calc(50%-50vw)] -mt-4 flex flex-col gap-2 border-t border-hairline bg-bg px-[calc(50vw-50%)] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-bar lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        {save.isError && !isFieldRejection(save.error) && (
          <p role="alert" className="text-body-sm text-danger">
            {tErrors(errorMessageKey(save.error))}
          </p>
        )}
        <p role="status" className="text-body text-positive empty:hidden">
          {status && !isDirty && t(status)}
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            isLoading={save.isPending}
            className="w-full lg:w-auto lg:min-w-40"
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
        <DeleteButton onClick={openDelete} className="-mt-4 w-full lg:hidden" />
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
