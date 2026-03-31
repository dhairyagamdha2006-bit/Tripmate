import { EmptyState } from '@/components/common/empty-state';
import { LinkButton } from '@/components/ui/link-button';
import { ResponsiveShell } from '@/components/common/responsive-shell';

export default function NotFound() {
  return (
    <ResponsiveShell className="py-20">
      <EmptyState
        title="Page not found"
        description="The page you requested is missing or may have moved."
        action={<LinkButton href="/">Go home</LinkButton>}
      />
    </ResponsiveShell>
  );
}
