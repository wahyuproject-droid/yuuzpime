import { lazy, Suspense } from 'react';
import type { ComponentProps } from 'react';
import { useHydrated } from '~/utils/react/hooks/useHydrated';

const BrowserPlayer = lazy(() =>
  import('@lottiefiles/react-lottie-player').then((module) => ({
    default: module.Player,
  })),
);

type PlayerProps = ComponentProps<typeof BrowserPlayer>;

export function Player(props: PlayerProps) {
  const hydrated = useHydrated();
  const fallback = <span className={props.className} aria-hidden="true" />;

  if (!hydrated) return fallback;

  return (
    <Suspense fallback={fallback}>
      <BrowserPlayer {...props} />
    </Suspense>
  );
}
