import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={<Compass size={26} aria-hidden />}
      title="This page does not exist"
      description="The link may be old, or something was mistyped."
      action={<Button onClick={() => void navigate('/')}>Back to browsing</Button>}
    />
  );
}
