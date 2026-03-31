'use client';

import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BedType, CabinClass, SeatPreference, SmokingPreference } from '@prisma/client';
import { travelerProfileSchema, type TravelerProfileInput } from '@/lib/validations/profile';
import type { TravelerProfileFormData } from '@/types/travel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FieldWrapper } from '@/components/common/field-wrapper';
import { FormSection } from '@/components/common/form-section';

export function ProfileForm({ initialData }: { initialData?: TravelerProfileFormData | null }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const defaultValues = useMemo<TravelerProfileInput>(() => ({
    fullLegalName: initialData?.fullLegalName ?? '',
    dateOfBirth: initialData?.dateOfBirth ?? '1990-03-22',
    nationality: initialData?.nationality ?? 'American',
    passportNumber: initialData?.passportNumber ?? '',
    passportExpiry: initialData?.passportExpiry ?? '',
    homeAirportCode: initialData?.homeAirportCode ?? 'SFO',
    preferredCabinClass: initialData?.preferredCabinClass ?? 'BUSINESS',
    seatPreference: initialData?.seatPreference ?? 'AISLE',
    preferDirectFlights: initialData?.preferDirectFlights ?? true,
    preferredHotelChains: initialData?.preferredHotelChains ?? [],
    bedType: initialData?.bedType ?? null,
    smokingPreference: initialData?.smokingPreference ?? 'NON_SMOKING',
    accessibilityNeeds: initialData?.accessibilityNeeds ?? [],
    loyaltyPrograms: initialData?.loyaltyPrograms ?? []
  }), [initialData]);

  const form = useForm<TravelerProfileInput>({
    resolver: zodResolver(travelerProfileSchema),
    defaultValues
  });

  const loyaltyPrograms = useFieldArray({
    control: form.control,
    name: 'loyaltyPrograms'
  });

  const hotelChainsText = form.watch('preferredHotelChains').join(', ');
  const accessibilityText = form.watch('accessibilityNeeds').join(', ');

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null);
      setSuccess(null);
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Unable to save profile.');
      }
      setSuccess('Traveler profile saved. Tripmate will use these preferences in future searches.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    }
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <FormSection title="Personal details" description="Tripmate uses these details to prepare bookings accurately.">
        <div className="grid gap-5 md:grid-cols-2">
          <FieldWrapper label="Full legal name" htmlFor="fullLegalName" error={form.formState.errors.fullLegalName?.message}>
            <Input id="fullLegalName" {...form.register('fullLegalName')} />
          </FieldWrapper>
          <FieldWrapper label="Nationality" htmlFor="nationality" error={form.formState.errors.nationality?.message}>
            <Input id="nationality" {...form.register('nationality')} />
          </FieldWrapper>
          <FieldWrapper label="Date of birth" htmlFor="dateOfBirth" error={form.formState.errors.dateOfBirth?.message}>
            <Input id="dateOfBirth" type="date" {...form.register('dateOfBirth')} />
          </FieldWrapper>
          <FieldWrapper label="Home airport" htmlFor="homeAirportCode" error={form.formState.errors.homeAirportCode?.message} helpText="Use a 3-letter airport code like SFO or JFK.">
            <Input id="homeAirportCode" maxLength={3} {...form.register('homeAirportCode')} />
          </FieldWrapper>
        </div>
      </FormSection>

      <FormSection title="Passport and preferences" description="These are only used to reduce booking mistakes and match your travel style.">
        <div className="grid gap-5 md:grid-cols-2">
          <FieldWrapper label="Passport number" htmlFor="passportNumber" error={form.formState.errors.passportNumber?.message} helpText="Stored securely and only used for booking details.">
            <Input id="passportNumber" {...form.register('passportNumber')} />
          </FieldWrapper>
          <FieldWrapper label="Passport expiry" htmlFor="passportExpiry" error={form.formState.errors.passportExpiry?.message}>
            <Input id="passportExpiry" type="date" {...form.register('passportExpiry')} />
          </FieldWrapper>
          <FieldWrapper label="Preferred cabin" htmlFor="preferredCabinClass" error={form.formState.errors.preferredCabinClass?.message}>
            <Select id="preferredCabinClass" {...form.register('preferredCabinClass')}>
              {(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'] as CabinClass[]).map((value) => (
                <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
              ))}
            </Select>
          </FieldWrapper>
          <FieldWrapper label="Seat preference" htmlFor="seatPreference" error={form.formState.errors.seatPreference?.message}>
            <Select id="seatPreference" {...form.register('seatPreference')}>
              {(['AISLE', 'WINDOW', 'MIDDLE', 'NO_PREFERENCE'] as SeatPreference[]).map((value) => (
                <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
              ))}
            </Select>
          </FieldWrapper>
          <FieldWrapper label="Bed type" htmlFor="bedType" error={form.formState.errors.bedType?.message as string | undefined}>
            <Select id="bedType" value={form.watch('bedType') ?? ''} onChange={(event) => form.setValue('bedType', (event.target.value || null) as BedType | null)}>
              <option value="">No preference</option>
              {(['KING', 'QUEEN', 'TWIN', 'DOUBLE', 'NO_PREFERENCE'] as BedType[]).map((value) => (
                <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
              ))}
            </Select>
          </FieldWrapper>
          <FieldWrapper label="Smoking preference" htmlFor="smokingPreference" error={form.formState.errors.smokingPreference?.message}>
            <Select id="smokingPreference" {...form.register('smokingPreference')}>
              {(['NON_SMOKING', 'SMOKING', 'NO_PREFERENCE'] as SmokingPreference[]).map((value) => (
                <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
              ))}
            </Select>
          </FieldWrapper>
        </div>
        <div className="mt-5 space-y-4">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={form.watch('preferDirectFlights')} onChange={(event) => form.setValue('preferDirectFlights', event.target.checked)} />
            Prefer direct flights when available
          </label>
          <FieldWrapper label="Preferred hotel chains" htmlFor="preferredHotelChains" helpText="Separate multiple hotel chains with commas.">
            <Input
              id="preferredHotelChains"
              value={hotelChainsText}
              onChange={(event) => form.setValue('preferredHotelChains', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
            />
          </FieldWrapper>
          <FieldWrapper label="Accessibility needs" htmlFor="accessibilityNeeds" helpText="Optional. Separate multiple needs with commas.">
            <Input
              id="accessibilityNeeds"
              value={accessibilityText}
              onChange={(event) => form.setValue('accessibilityNeeds', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
            />
          </FieldWrapper>
        </div>
      </FormSection>

      <FormSection title="Loyalty programs" description="Add any airline or hotel memberships that Tripmate should prefer when ranking options.">
        <div className="space-y-4">
          {loyaltyPrograms.fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <FieldWrapper label="Program" htmlFor={`program-${index}`} error={form.formState.errors.loyaltyPrograms?.[index]?.program?.message}>
                <Input id={`program-${index}`} {...form.register(`loyaltyPrograms.${index}.program`)} />
              </FieldWrapper>
              <FieldWrapper label="Member ID" htmlFor={`memberId-${index}`} error={form.formState.errors.loyaltyPrograms?.[index]?.memberId?.message}>
                <Input id={`memberId-${index}`} {...form.register(`loyaltyPrograms.${index}.memberId`)} />
              </FieldWrapper>
              <div className="flex items-end">
                <Button type="button" variant="secondary" onClick={() => loyaltyPrograms.remove(index)} className="w-full">Remove</Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => loyaltyPrograms.append({ program: '', memberId: '' })}>Add loyalty program</Button>
        </div>
      </FormSection>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Saving…' : 'Save profile'}</Button>
      </div>
    </form>
  );
}
