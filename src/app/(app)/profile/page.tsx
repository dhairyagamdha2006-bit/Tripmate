import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { ProfileForm } from '@/components/forms/profile-form';
import { requireCurrentUser } from '@/lib/auth/session';
import { profileService } from '@/server/services/profile.service';
import type { TravelerProfileFormData } from '@/types/travel';
import { toDateInputValue } from '@/lib/utils/date';

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const profile = await profileService.getProfile(user.id);

  const initialData: TravelerProfileFormData | null = profile
    ? {
        fullLegalName: profile.fullLegalName,
        dateOfBirth: toDateInputValue(profile.dateOfBirth),
        nationality: profile.nationality,
        passportNumber: profile.passportNumber,
        passportExpiry: toDateInputValue(profile.passportExpiry),
        homeAirportCode: profile.homeAirportCode,
        preferredCabinClass: profile.preferredCabinClass,
        seatPreference: profile.seatPreference,
        preferDirectFlights: profile.preferDirectFlights,
        preferredHotelChains: profile.preferredHotelChains,
        bedType: profile.bedType,
        smokingPreference: profile.smokingPreference,
        accessibilityNeeds: profile.accessibilityNeeds,
        loyaltyPrograms: profile.loyaltyPrograms.map((item) => ({ program: item.program, memberId: item.memberId }))
      }
    : null;

  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="Traveler profile"
        title="Saved traveler details"
        description="Tripmate uses this profile to reduce booking errors, respect your preferences, and prepare better bundles."
      />
      <ProfileForm initialData={initialData} />
    </ResponsiveShell>
  );
}
