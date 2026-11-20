'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@/components/ui/Alert';
import { templateFormSchema, type TemplateFormData } from '../schemas/template-schema';
import type { TemplateFormProps } from '../types';
import RichTextEditor from './RichTextEditor';
import styles from './TemplateForm.module.css';

export default function TemplateForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  serverError,
  onCancel,
}: TemplateFormProps) {
  const isEditing = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      content: initialData?.content ?? '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        content: initialData.content,
      });
    }
  }, [initialData, reset]);

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.topActions}>
        <div className={styles.titleArea}>
          <h2 className={styles.pageHeading}>
            {isEditing ? 'Editar Modelo de Laudo' : 'Novo Modelo de Laudo'}
          </h2>
          <p className={styles.pageSubheading}>
            {isEditing
              ? 'Atualize o título ou o texto formatado do modelo.'
              : 'Defina o título e o corpo formatado do novo modelo de laudo.'}
          </p>
        </div>

        <div className={styles.buttonGroup}>
          {onCancel ? (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          ) : null}
          <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Template'}
          </button>
        </div>
      </div>

      {serverError ? <Alert variant="error">{serverError}</Alert> : null}

      <div className={styles.formBody}>
        <div className={styles.fieldGroup}>
          <label htmlFor="template-title" className={styles.fieldLabel}>
            Título do Template *
          </label>
          <input
            id="template-title"
            type="text"
            className={`${styles.fieldInput} ${errors.title ? styles.hasError : ''}`}
            placeholder="Ex: Ultrassonografia Abdominal Normal"
            maxLength={255}
            {...register('title')}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title ? (
            <p id="title-error" className={styles.fieldError}>
              {errors.title.message}
            </p>
          ) : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Conteúdo do Laudo *</label>
          <Controller
            name="content"
            control={control}
            render={({ field, fieldState }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>
    </form>
  );
}
