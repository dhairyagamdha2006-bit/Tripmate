import { auth } from '@/auth';
import { ProfileForm } from '@/components/profile/profile-form';
import { PaymentMethodManager } from '@/components/profile/payment-method-manager';
import { profileService } from '@/server/services/profile.service';

export default async function ProfilePage() {
  const session = await auth();
  const profile = await profileService.getProfile(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Profile & payments</h1>
        <p className="mt-2 text-slate-300">Manage traveler details, loyalty preferences, and Stripe-backed saved payment methods.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ProfileForm profile={profile?.travelerProfile ? {
          ...profile.travelerProfile,
          dateOfBirth: profile.travelerProfile.dateOfBirth.toISOString(),
          passportExpiry: profile.travelerProfile.passportExpiry.toISOString(),
          loyaltyPrograms: profile.travelerProfile.loyaltyPrograms
        } : undefined} />
        <PaymentMethodManager paymentMethods={profile?.paymentMethods ?? []} publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} />
      </div>
    </div>
  );
}
