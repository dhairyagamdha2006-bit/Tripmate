"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProfileForm({ profile }: { profile?: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState(
    (profile?.loyaltyPrograms ?? []).map((item: any) => `${item.program}:${item.memberId}`).join(', ')
  );
  const [chains, setChains] = useState((profile?.preferredHotelChains ?? []).join(', '));
  const [accessibilityNeeds, setAccessibilityNeeds] = useState((profile?.accessibilityNeeds ?? []).join(', '));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traveler profile</CardTitle>
        <CardDescription>Used for future provider-side fulfillment, traveler defaults, and better package matching.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError(null);
            setSuccess(null);
            const form = new FormData(event.currentTarget as HTMLFormElement);
            const payload = {
              fullLegalName: form.get('fullLegalName'),
              dateOfBirth: form.get('dateOfBirth'),
              nationality: form.get('nationality'),
              passportNumber: form.get('passportNumber'),
              passportExpiry: form.get('passportExpiry'),
              passportIssuingCountry: form.get('passportIssuingCountry') || null,
              phoneNumber: form.get('phoneNumber') || null,
              gender: form.get('gender') || null,
              homeAirportCode: form.get('homeAirportCode'),
              preferredCabinClass: form.get('preferredCabinClass'),
              seatPreference: form.get('seatPreference'),
              preferDirectFlights: form.get('preferDirectFlights') === 'on',
              preferredHotelChains: chains.split(',').map((value) => value.trim()).filter(Boolean),
              bedType: form.get('bedType') || null,
              smokingPreference: form.get('smokingPreference'),
              accessibilityNeeds: accessibilityNeeds.split(',').map((value) => value.trim()).filter(Boolean),
              loyaltyPrograms: loyaltyPrograms
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean)
                .map((value) => {
                  const [program, memberId] = value.split(':');
                  return { program: program?.trim(), memberId: memberId?.trim() };
                })
                .filter((item) => item.program && item.memberId)
            };

            const response = await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = (await response.json()) as { ok: boolean; error?: string };
            setLoading(false);
            if (!response.ok || !data.ok) {
              setError(data.error ?? 'Failed to save profile.');
              return;
            }
            setSuccess('Traveler profile saved.');
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullLegalName">Full legal name</Label>
              <Input id="fullLegalName" name="fullLegalName" defaultValue={profile?.fullLegalName ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={profile?.dateOfBirth?.slice?.(0, 10) ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" name="nationality" defaultValue={profile?.nationality ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passportNumber">Passport number</Label>
              <Input id="passportNumber" name="passportNumber" defaultValue={profile?.passportNumber ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passportExpiry">Passport expiry</Label>
              <Input id="passportExpiry" name="passportExpiry" type="date" defaultValue={profile?.passportExpiry?.slice?.(0, 10) ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passportIssuingCountry">Passport issuing country</Label>
              <Input id="passportIssuingCountry" name="passportIssuingCountry" defaultValue={profile?.passportIssuingCountry ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input id="phoneNumber" name="phoneNumber" defaultValue={profile?.phoneNumber ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" name="gender" defaultValue={profile?.gender ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homeAirportCode">Home airport code</Label>
              <Input id="homeAirportCode" name="homeAirportCode" defaultValue={profile?.homeAirportCode ?? ''} maxLength={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredCabinClass">Preferred cabin class</Label>
              <Input id="preferredCabinClass" name="preferredCabinClass" defaultValue={profile?.preferredCabinClass ?? 'ECONOMY'} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seatPreference">Seat preference</Label>
              <Input id="seatPreference" name="seatPreference" defaultValue={profile?.seatPreference ?? 'NO_PREFERENCE'} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedType">Bed type</Label>
              <Input id="bedType" name="bedType" defaultValue={profile?.bedType ?? ''} placeholder="KING, QUEEN, TWIN..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smokingPreference">Smoking preference</Label>
              <Input id="smokingPreference" name="smokingPreference" defaultValue={profile?.smokingPreference ?? 'NON_SMOKING'} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="preferredHotelChains">Preferred hotel chains</Label>
              <Input id="preferredHotelChains" value={chains} onChange={(event) => setChains(event.target.value)} placeholder="Hyatt, Marriott" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="accessibilityNeeds">Accessibility needs</Label>
              <Input id="accessibilityNeeds" value={accessibilityNeeds} onChange={(event) => setAccessibilityNeeds(event.target.value)} placeholder="step free access, hearing assistance" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="loyaltyPrograms">Loyalty programs (comma-separated program:memberId)</Label>
              <Input id="loyaltyPrograms" value={loyaltyPrograms} onChange={(event) => setLoyaltyPrograms(event.target.value)} placeholder="MileagePlus:12345, Hilton Honors:54321" />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
            <input type="checkbox" name="preferDirectFlights" defaultChecked={profile?.preferDirectFlights ?? false} className="h-4 w-4" /> Prefer direct flights
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save traveler profile'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
