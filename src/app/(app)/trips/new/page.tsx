import { PageHeader } from '@/components/common/page-header';
import { ResponsiveShell } from '@/components/common/responsive-shell';
import { TripRequestForm } from '@/components/forms/trip-request-form';
import { StepProgress } from '@/components/trip/step-progress';

export default function NewTripPage() {
  return (
    <ResponsiveShell className="py-10">
      <PageHeader
        eyebrow="New trip"
        title="Plan a new trip"
        description="Enter the essentials once. Tripmate will search, bundle, and explain the best options before you approve anything."
      />
      <div className="mb-8">
        <StepProgress steps={['Trip details', 'Planning', 'Recommendations', 'Book']} current={0} />
      </div>
      <TripRequestForm />
    </ResponsiveShell>
  );
}
