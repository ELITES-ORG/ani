import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      action={
        <Link to="/" className="text-sm text-leaf-700 underline">
          Back to browse
        </Link>
      }
    />
  );
}
