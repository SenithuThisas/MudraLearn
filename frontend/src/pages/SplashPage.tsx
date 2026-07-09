import { useSearchParams } from 'react-router-dom';
import LoadingTransition from '../components/ui/LoadingTransition';

/**
 * SplashPage — a thin wrapper around LoadingTransition.
 *
 * Navigate here via:
 *   /splash                   → transitions to /signin (default)
 *   /splash?to=/dashboard     → transitions to /dashboard
 *   /splash?to=/signin        → transitions to /signin
 *
 * You can also use <LoadingTransition /> directly inside any component
 * without going through this route — see components/ui/LoadingTransition.tsx
 */
export default function SplashPage() {
  const [params] = useSearchParams();
  const destination = params.get('to') ?? '/signin';

  return <LoadingTransition destination={destination} minDuration={1400} />;
}

