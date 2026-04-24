import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { tripRepository } from '@/server/repositories/trip.repository';
import { CheckoutPanel } from '@/components/booking/checkout-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const trip = await tripRepository.getTripForUser(params.id, session!.user.id);
  if (!trip?.bookings[0]) {
    notFound();
  }

  const booking = trip.bookings[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Checkout for {trip.title}</h1>
          <p className="mt-2 text-slate-300">Real Stripe payment, truthful booking states, and provider-aware fulfillment handling.</p>
        </div>
        <Link href={`/trips/${trip.id}`}>
          <Button variant="outline">Back to itinerary</Button>
        </Link>
      </div>

      {trip.user.paymentMethods.length ? (
        <CheckoutPanel booking={booking} paymentMethods={trip.user.paymentMethods} publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add a payment method first</CardTitle>
            <CardDescription>You need a saved card in Stripe before Tripmate can create a payment intent for this booking.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile"><Button>Go to profile</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
