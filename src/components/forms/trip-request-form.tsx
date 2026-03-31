'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CabinClass } from '@prisma/client';
import { tripRequestSchema, type TripRequestInput } from '@/lib/validations/trips';
import { FormSection } from '@/components/common/form-section';
import { FieldWrapper } from '@/components/common/field-wrapper';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function TripRequestForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TripRequestInput>({
    resolver: zodResolver(tripRequestSchema),
    defaultValues: {
      originCode: 'SFO',
      originCity: 'San Francisco',
      destinationCode: 'NRT',
      destinationCity: 'Tokyo',
      departureDate: '',
      returnDate: '',
      travelerCount: 2,
      budgetUsd: 8000,
      cabinClass: 'BUSINESS',
      preferDirectFlights: true,
      hotelStarLevel: 4,
      neighborhoodPreference: 'Shibuya or Shinjuku',
      amenities: ['WiFi', 'Breakfast', 'Gym'],
      refundableOnly: false,
      notes: ''
    }
  });

  const amenitiesText = form.watch('amenities').join(', ');

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null);
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Unable to create trip.');
      }
      router.push(`/trips/${payload.data.tripId}/planning`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create trip.');
    }
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <FormSection title="Where and when" description="Tell Tripmate where you want to go. We will search and rank the best options from there.">
        <div className="grid gap-5 md:grid-cols-2">
          <FieldWrapper label="Origin airport" htmlFor="originCode" error={form.formState.errors.originCode?.message}>
            <Input id="originCode" maxLength={3} {...form.register('originCode')} />
          </FieldWrapper>
          <FieldWrapper label="Origin city" htmlFor="originCity" error={form.formState.errors.originCity?.message}>
            <Input id="originCity" {...form.register('originCity')} />
          </FieldWrapper>
          <FieldWrapper label="Destination airport" htmlFor="destinationCode" error={form.formState.errors.destinationCode?.message}>
            <Input id="destinationCode" maxLength={3} {...form.register('destinationCode')} />
          </FieldWrapper>
          <FieldWrapper label="Destination city" htmlFor="destinationCity" error={form.formState.errors.destinationCity?.message}>
            <Input id="destinationCity" {...form.register('destinationCity')} />
          </FieldWrapper>
          <FieldWrapper label="Departure date" htmlFor="departureDate" error={form.formState.errors.departureDate?.message}>
            <Input id="departureDate" type="date" {...form.register('departureDate')} />
          </FieldWrapper>
          <FieldWrapper label="Return date" htmlFor="returnDate" error={form.formState.errors.returnDate?.message}>
            <Input id="returnDate" type="date" {...form.register('returnDate')} />
          </FieldWrapper>
        </div>
      </FormSection>

      <FormSection title="Budget and comfort" description="These preferences help Tripmate score bundles more accurately.">
        <div className="grid gap-5 md:grid-cols-2">
          <FieldWrapper label="Travelers" htmlFor="travelerCount" error={form.formState.errors.travelerCount?.message}>
            <Input id="travelerCount" type="number" min={1} max={9} {...form.register('travelerCount', { valueAsNumber: true })} />
          </FieldWrapper>
          <FieldWrapper label="Budget (USD)" htmlFor="budgetUsd" error={form.formState.errors.budgetUsd?.message}>
            <Input id="budgetUsd" type="number" min={100} step={100} {...form.register('budgetUsd', { valueAsNumber: true })} />
          </FieldWrapper>
          <FieldWrapper label="Cabin class" htmlFor="cabinClass" error={form.formState.errors.cabinClass?.message}>
            <Select id="cabinClass" {...form.register('cabinClass')}>
              {(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'] as CabinClass[]).map((value) => (
                <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
              ))}
            </Select>
          </FieldWrapper>
          <FieldWrapper label="Minimum hotel stars" htmlFor="hotelStarLevel" error={form.formState.errors.hotelStarLevel?.message}>
            <Input id="hotelStarLevel" type="number" min={1} max={5} {...form.register('hotelStarLevel', { valueAsNumber: true })} />
          </FieldWrapper>
          <FieldWrapper label="Neighborhood preference" htmlFor="neighborhoodPreference" error={form.formState.errors.neighborhoodPreference?.message as string | undefined}>
            <Input id="neighborhoodPreference" {...form.register('neighborhoodPreference')} />
          </FieldWrapper>
          <FieldWrapper label="Amenities" htmlFor="amenities" helpText="Separate preferred amenities with commas.">
            <Input
              id="amenities"
              value={amenitiesText}
              onChange={(event) => form.setValue('amenities', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
            />
          </FieldWrapper>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4" checked={form.watch('preferDirectFlights')} onChange={(event) => form.setValue('preferDirectFlights', event.target.checked)} />
            Prefer direct flights when possible
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4" checked={form.watch('refundableOnly')} onChange={(event) => form.setValue('refundableOnly', event.target.checked)} />
            Show refundable options only
          </label>
        </div>
        <div className="mt-5">
          <FieldWrapper label="Extra notes" htmlFor="notes" error={form.formState.errors.notes?.message as string | undefined} helpText="Optional. Add any routing, hotel, or timing preferences.">
            <Textarea id="notes" {...form.register('notes')} />
          </FieldWrapper>
        </div>
      </FormSection>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Creating trip…' : 'Create trip and start planning'}</Button>
    </form>
  );
}
