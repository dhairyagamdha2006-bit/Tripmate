"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CabinClass } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function TripCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amenities, setAmenities] = useState('wifi, breakfast');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a trip request</CardTitle>
        <CardDescription>Start with real search inputs. Airport or city IATA codes work best for provider-backed results.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError(null);

            const form = new FormData(event.currentTarget as HTMLFormElement);
            const payload = {
              title: form.get('title'),
              originCode: form.get('originCode'),
              originCity: form.get('originCity'),
              destinationCode: form.get('destinationCode'),
              destinationCity: form.get('destinationCity'),
              departureDate: form.get('departureDate'),
              returnDate: form.get('returnDate'),
              travelerCount: Number(form.get('travelerCount')),
              budgetCents: Math.round(Number(form.get('budgetUsd')) * 100),
              currency: form.get('currency'),
              cabinClass: form.get('cabinClass'),
              preferDirectFlights: form.get('preferDirectFlights') === 'on',
              hotelStarLevel: Number(form.get('hotelStarLevel')),
              neighborhoodPreference: form.get('neighborhoodPreference') || null,
              amenities: amenities
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
              refundableOnly: form.get('refundableOnly') === 'on',
              notes: form.get('notes') || null
            };

            const response = await fetch('/api/trips', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = (await response.json()) as { ok: boolean; tripId?: string; error?: string };
            setLoading(false);

            if (!response.ok || !data.ok || !data.tripId) {
              setError(data.error ?? 'Failed to create trip.');
              return;
            }

            router.push(`/trips/${data.tripId}`);
            router.refresh();
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Trip title</Label>
              <Input id="title" name="title" placeholder="Spring week in Paris" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originCity">Origin city</Label>
              <Input id="originCity" name="originCity" placeholder="New York" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originCode">Origin code</Label>
              <Input id="originCode" name="originCode" placeholder="JFK" maxLength={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationCity">Destination city</Label>
              <Input id="destinationCity" name="destinationCity" placeholder="Paris" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationCode">Destination code</Label>
              <Input id="destinationCode" name="destinationCode" placeholder="PAR" maxLength={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureDate">Departure date</Label>
              <Input id="departureDate" name="departureDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="returnDate">Return date</Label>
              <Input id="returnDate" name="returnDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travelerCount">Travelers</Label>
              <Input id="travelerCount" name="travelerCount" type="number" min={1} max={9} defaultValue={1} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetUsd">Budget (USD)</Label>
              <Input id="budgetUsd" name="budgetUsd" type="number" min={500} defaultValue={2200} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue="USD" maxLength={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cabinClass">Cabin class</Label>
              <select id="cabinClass" name="cabinClass" className="flex h-11 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 text-sm text-white">
                {Object.values(CabinClass).map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hotelStarLevel">Minimum hotel stars</Label>
              <Input id="hotelStarLevel" name="hotelStarLevel" type="number" min={1} max={5} defaultValue={4} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="neighborhoodPreference">Neighborhood preference</Label>
              <Input id="neighborhoodPreference" name="neighborhoodPreference" placeholder="Le Marais, Shinjuku, Soho..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="amenities">Hotel amenities (comma-separated)</Label>
              <Input id="amenities" value={amenities} onChange={(event) => setAmenities(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes for Tripmate AI</Label>
              <Textarea id="notes" name="notes" placeholder="We care about walking neighborhoods, easy airport transfer, and vegetarian-friendly areas." />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" name="preferDirectFlights" className="h-4 w-4" /> Prefer direct flights
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" name="refundableOnly" className="h-4 w-4" /> Refundable options only
            </label>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating trip...' : 'Create trip'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
