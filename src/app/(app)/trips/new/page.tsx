import { TripCreateForm } from '@/components/trip/trip-create-form';

export default function NewTripPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Create a trip</h1>
        <p className="mt-2 text-slate-300">Start with structured travel preferences so provider search and AI reasoning stay grounded.</p>
      </div>
      <TripCreateForm />
    </div>
  );
}
