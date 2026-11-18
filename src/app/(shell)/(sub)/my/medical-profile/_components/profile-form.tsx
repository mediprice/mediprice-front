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
      {save.isError && !isFieldRejection(save.error) && (
        <p role="alert" className="text-body-sm text-danger">
          {tErrors(errorMessageKey(save.error))}
        </p>
      )}
      <p role="status" className="text-body-sm text-positive empty:hidden">
        {status && !isDirty && t(status)}
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Button
          type="submit"
          size="lg"
          isLoading={save.isPending}
          className="w-full lg:w-auto lg:min-w-30"
        >
          {t('save')}
        </Button>
        {profile && (
          <Button
            variant="dangerText"
            size="lg"
            onClick={() => {
              remove.reset();
              setIsDeleting(true);
            }}
            className="w-full lg:w-auto"
          >
            {t('remove')}
          </Button>
        )}
      </div>
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
