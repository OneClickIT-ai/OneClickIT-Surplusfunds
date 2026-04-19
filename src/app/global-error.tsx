"use client";

/**
 * Root-level error boundary. Next.js renders this when any error escapes
 * every nested `error.tsx` or during root-layout render itself. Required
 * for Sentry v8+ to capture those cases — without it they are only logged.
 *
 * Keep the fallback markup minimal and self-contained: this renders when
 * the normal layout may be broken, so we can't rely on shared components.
 */
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={500} />
      </body>
    </html>
  );
}
