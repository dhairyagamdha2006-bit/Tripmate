import { ResponsiveShell } from '@/components/common/responsive-shell';
import { LoadingState } from '@/components/common/loading-state';

export default function AppLoading() {
  return (
    <ResponsiveShell className="py-10">
      <LoadingState title="Loading Tripmate" description="Pulling together your latest trips and planning data." />
    </ResponsiveShell>
  );
}
