'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { petSchema, tutorSchema, type MultiPatientFormValues } from '../schemas/patient.schema';
import { useClientsCreate, getClientsListQueryKey } from '@/api/clients/clients';
import { usePatientsCreate, getPatientsListQueryKey } from '@/api/patients/patients';
import { CreateClientResponse } from '@/api/index.schemas';
import styles from '../styles/PatientForm.module.css';

interface PatientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  existingClientId?: string;
  existingClientName?: string;
}

export function PatientForm({
  onSuccess,
  onCancel,
  existingClientId,
  existingClientName,
}: PatientFormProps) {
  const queryClient = useQueryClient();
  const isAddingToExistingClient = !!existingClientId;

  const formSchema: z.ZodType<MultiPatientFormValues> = useMemo(() => {
    if (isAddingToExistingClient) {
      return z.object({
        client: z.any().optional(),
        patients: z.array(petSchema).min(1, 'Adicione pelo menos um pet'),
      });
    }
    return z.object({
      client: tutorSchema,
      patients: z.array(petSchema).min(1, 'Adicione pelo menos um pet'),
    });
  }, [isAddingToExistingClient]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<MultiPatientFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      client: { name: '', email: '', cpf: '', phone: '' },
      patients: [
        {
          species: '',
          name: '',
          birthDate: '',
          age: '',
          breed: '',
          coatColor: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'patients',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const createClient = useClientsCreate();
  const createPatient = usePatientsCreate();

  const handleBirthDateChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(`patients.${index}.birthDate`, val, { shouldValidate: true });

    if (val) {
      const birth = new Date(val);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
        years--;
        months += 12;
      }
      if (years > 0) {
        setValue(`patients.${index}.age`, `${years} ano${years > 1 ? 's' : ''}`, {
          shouldValidate: true,
        });
      } else if (months > 0) {
        setValue(`patients.${index}.age`, `${months} m${months > 1 ? 'eses' : 'ês'}`, {
          shouldValidate: true,
        });
      } else {
        setValue(`patients.${index}.age`, 'Menos de 1 mês', {
          shouldValidate: true,
        });
      }
    }
  };

  const handleAddPet = () => {
    append({
      species: 'Canino',
      name: '',
      birthDate: '',
      age: '',
      breed: '',
      coatColor: '',
    });
  };

  const onSubmit = async (data: MultiPatientFormValues) => {
    setIsSubmitting(true);
    setGlobalError(null);

    try {
      let targetClientId = existingClientId;

      // 1. Create Tutor (Client) if registering new tutor + pets
      if (!targetClientId) {
        if (!data.client?.name || !data.client?.email) {
          setGlobalError('Dados do tutor incompletos.');
          setIsSubmitting(false);
          return;
        }

        let clientResp;
        try {
          clientResp = await createClient.mutateAsync({
            data: {
              full_name: data.client.name,
              email: data.client.email,
              document_cpf: data.client.cpf ? data.client.cpf.replace(/\D/g, '') : '',
              phone: data.client.phone ? data.client.phone.replace(/\D/g, '') : '',
            },
          });
        } catch {
          setGlobalError('Erro ao criar tutor. Verifique se o e-mail ou CPF já existem.');
          setIsSubmitting(false);
          return;
        }

        targetClientId = String((clientResp?.data?.data as CreateClientResponse)?.id);
        if (!targetClientId) throw new Error('ID do cliente não retornado');
      }

      // 2. Create all pets for this client
      try {
        for (const pet of data.patients) {
          let birthDateToSend = pet.birthDate;
          if (!birthDateToSend && pet.age) {
            const match = pet.age.match(/\d+/);
            const years = match ? parseInt(match[0], 10) : 1;
            const estimatedDate = new Date();
            estimatedDate.setFullYear(estimatedDate.getFullYear() - years);
            birthDateToSend = estimatedDate.toISOString().split('T')[0];
          }

          if (!birthDateToSend) {
            birthDateToSend = new Date().toISOString().split('T')[0];
          }

          await createPatient.mutateAsync({
            data: {
              client_id: targetClientId as unknown as number,
              name: pet.name,
              patient_type: 'PET',
              birth_date: birthDateToSend,
              biological_details: {
                species: pet.species,
                breed: pet.breed || 'Não informada',
                coat_color: pet.coatColor || 'Não informada',
                age: pet.age || 'Não informada',
              },
            },
          });
        }
      } catch {
        setGlobalError(
          'Tutor processado, mas ocorreu um erro ao cadastrar os pets. Tente novamente.',
        );
        setIsSubmitting(false);
        return;
      }

      // 3. Success -> Invalidate queries
      queryClient.invalidateQueries({ queryKey: getClientsListQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getPatientsListQueryKey({ clientId: targetClientId as unknown as number }),
      });

      onSuccess();
    } catch {
      setGlobalError('Erro inesperado durante o cadastro.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
      {isSubmitting && (
        <div className={styles.submittingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {globalError && <div className={styles.globalError}>{globalError}</div>}

      {isAddingToExistingClient ? (
        <div className={styles.tutorBanner}>
          Cadastrando pet(s) para o tutor:{' '}
          <strong>{existingClientName || `#${existingClientId}`}</strong>
        </div>
      ) : (
        <div>
          <h3 className={styles.sectionTitle}>Dados do Tutor</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="clientName" className={styles.label}>
                Nome Completo do Tutor *
              </label>
              <input
                id="clientName"
                {...register('client.name')}
                placeholder="Ex: Carlos Silva"
                className={styles.input}
              />
              {errors.client?.name && (
                <p className={styles.errorText}>{errors.client.name.message}</p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="clientEmail" className={styles.label}>
                E-mail *
              </label>
              <input
                id="clientEmail"
                {...register('client.email')}
                type="email"
                placeholder="tutor@exemplo.com"
                className={styles.input}
              />
              {errors.client?.email && (
                <p className={styles.errorText}>{errors.client.email.message}</p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="clientCpf" className={styles.label}>
                CPF
              </label>
              <input
                id="clientCpf"
                {...register('client.cpf')}
                placeholder="000.000.000-00"
                className={styles.input}
              />
              {errors.client?.cpf && (
                <p className={styles.errorText}>{errors.client.cpf.message}</p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="clientPhone" className={styles.label}>
                Telefone
              </label>
              <input
                id="clientPhone"
                {...register('client.phone')}
                placeholder="(00) 00000-0000"
                className={styles.input}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.petsSection}>
        <div className={styles.petsHeader}>
          <h3 className={styles.sectionTitle} style={{ margin: 0, border: 'none', padding: 0 }}>
            {fields.length > 1 ? `Dados dos Pets (${fields.length})` : 'Dados do Pet'}
          </h3>
          <button type="button" onClick={handleAddPet} className={styles.btnAddPet}>
            + Adicionar outro Pet
          </button>
        </div>

        {errors.patients?.root && (
          <p className={styles.errorText}>{errors.patients.root.message}</p>
        )}

        {fields.map((field, index) => {
          const petErrors = errors.patients?.[index];

          return (
            <div key={field.id} className={styles.petCard}>
              <div className={styles.petCardHeader}>
                <h4 className={styles.petCardTitle}>Pet #{index + 1}</h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className={styles.btnRemovePet}
                    title="Remover este pet do formulário"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor={`patientSpecies_${index}`} className={styles.label}>
                    Espécie *
                  </label>
                  <select
                    id={`patientSpecies_${index}`}
                    {...register(`patients.${index}.species` as const)}
                    className={styles.input}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecione a espécie
                    </option>
                    <option value="Canino">Canino (Cachorro)</option>
                    <option value="Felino">Felino (Gato)</option>
                    <option value="Equino">Equino (Cavalo)</option>
                    <option value="Bovino">Bovino</option>
                    <option value="Ave">Ave</option>
                    <option value="Roedor">Roedor</option>
                    <option value="Réptil">Réptil</option>
                    <option value="Outro">Outro</option>
                  </select>
                  {petErrors?.species && (
                    <p className={styles.errorText}>{petErrors.species.message}</p>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`patientName_${index}`} className={styles.label}>
                    Nome do Pet *
                  </label>
                  <input
                    id={`patientName_${index}`}
                    {...register(`patients.${index}.name` as const)}
                    placeholder="Ex: Rex, Thor, Mel..."
                    className={styles.input}
                  />
                  {petErrors?.name && <p className={styles.errorText}>{petErrors.name.message}</p>}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`patientBirthDate_${index}`} className={styles.label}>
                    Data de Nascimento
                  </label>
                  <input
                    id={`patientBirthDate_${index}`}
                    type="date"
                    {...register(`patients.${index}.birthDate` as const)}
                    onChange={(e) => handleBirthDateChange(index, e)}
                    className={styles.input}
                  />
                  {petErrors?.birthDate && (
                    <p className={styles.errorText}>{petErrors.birthDate.message}</p>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`patientAge_${index}`} className={styles.label}>
                    Ou Idade aproximada
                  </label>
                  <input
                    id={`patientAge_${index}`}
                    {...register(`patients.${index}.age` as const)}
                    placeholder="Ex: 3 anos, 6 meses..."
                    className={styles.input}
                  />
                  <span className={styles.helperText}>
                    Informe a data de nascimento ou a idade.
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor={`patientBreed_${index}`} className={styles.label}>
                    Raça *
                  </label>
                  <input
                    id={`patientBreed_${index}`}
                    {...register(`patients.${index}.breed` as const)}
                    placeholder="Ex: SRD, Poodle, Siamês..."
                    className={styles.input}
                  />
                  {petErrors?.breed && (
                    <p className={styles.errorText}>{petErrors.breed.message}</p>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`patientCoatColor_${index}`} className={styles.label}>
                    Cor da Pelagem *
                  </label>
                  <input
                    id={`patientCoatColor_${index}`}
                    {...register(`patients.${index}.coatColor` as const)}
                    placeholder="Ex: Caramelo, Preto, Branco..."
                    className={styles.input}
                  />
                  {petErrors?.coatColor && (
                    <p className={styles.errorText}>{petErrors.coatColor.message}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.btnCancel}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={styles.btnSubmit}>
          {isSubmitting
            ? 'Salvando...'
            : fields.length > 1
              ? `Salvar Cadastro (${fields.length} pets)`
              : 'Salvar Cadastro'}
        </button>
      </div>
    </form>
  );
}
