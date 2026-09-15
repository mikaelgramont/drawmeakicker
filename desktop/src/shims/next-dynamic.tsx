/**
 * `next/dynamic`, for a bundle with no Next in it.
 *
 * Aliased over the real module by vite.config.ts. It exists so that the shared
 * components can keep using the one Next API they touch: App.tsx defers the
 * editor — three.js, drei and the XR runtime — until someone asks for it, and
 * that split is as worth having here as on the web. The desktop app opens on
 * the same short pitch, and paying for a WebGL context before the user has
 * clicked anything would only slow down launch.
 *
 * `ssr` is accepted and ignored: there is no server to opt out of, so every
 * caller in this codebase is already asking for what it gets.
 */
import { lazy, Suspense, type ComponentType } from "react";

interface DynamicOptions {
  ssr?: boolean;
  loading?: ComponentType;
}

/**
 * Next's loader resolves to the component itself, where `React.lazy` wants it
 * on a `default` key.
 */
export default function dynamic<P extends object>(
  loader: () => Promise<ComponentType<P>>,
  { loading: Loading }: DynamicOptions = {},
): ComponentType<P> {
  const Lazy = lazy(async () => ({ default: await loader() }));

  return function Dynamic(props: P) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
