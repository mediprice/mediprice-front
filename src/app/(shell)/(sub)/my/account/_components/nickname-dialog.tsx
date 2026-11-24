'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import { sessionKeys, updateMyName } from '@/features/auth/queries';
import {
  nicknameErrorKey,
  type NicknameForm,
  nicknameSchema,
} from '@/features/auth/schemas';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

export function NicknameDialog({
  open,
  onOpenChange,
  currentName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
}) {
  const t = useTranslations('mypage.nickname');
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent title={t('title')}>
        {open && (
          <NicknameFormBody
            currentName={currentName}
            onDone={() => onOpenChange(false)}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

/** 다이얼로그를 열 때마다 새로 만들어 현재 이름에서 시작한다. */
function NicknameFormBody({
  currentName,
  onDone,
}: {
  currentName: string;
  onDone: () => void;
}) {
  const t = useTranslations('mypage.nickname');
  const tErrors = useTranslations('errors');
  const id = useId();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NicknameForm>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: { name: currentName },
  });
  const save = useMutation({
    mutationFn: (form: NicknameForm) => updateMyName(form.name),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionKeys.current(), user);
      onDone();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'INVALID_INPUT') {
        setError('name', { message: 'invalid' });
      }
    },
  });
  const fieldError = errors.name;
  const isServerError =
    save.isError &&
    !(save.error instanceof ApiError && save.error.code === 'INVALID_INPUT');

  return (
    <form
      noValidate
      onSubmit={handleSubmit((form) => save.mutate(form))}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-name`} className="text-label-bold">
          {t('label')}
        </label>
        <input
          id={`${id}-name`}
          type="text"
          autoComplete="nickname"
          maxLength={50}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={`${id}-hint${fieldError ? ` ${id}-error` : ''}`}
          className="h-12 w-full rounded-lg border border-border-strong bg-bg px-4 text-field aria-invalid:border-danger"
          {...register('name')}
        />
        <p id={`${id}-hint`} className="text-body-sm text-text-secondary">
          {t('hint')}
        </p>
        {fieldError && (
          <p id={`${id}-error`} className="text-body-sm text-danger">
            {t(`errors.${nicknameErrorKey(fieldError.message)}`)}
          </p>
        )}
      </div>
      {isServerError && (
        <p role="alert" className="text-body-sm text-danger">
          {tErrors(errorMessageKey(save.error))}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        isLoading={save.isPending}
        className="w-full"
      >
        {t('save')}
      </Button>
    </form>
  );
}
