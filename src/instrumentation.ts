/**
 * Next.js instrumentation hook (Sentry SDK v8+).
 *
 * `register` auto-loads the correct Sentry init per runtime. Also exports
 * `onRequestError` so Next.js forwards uncaught server request errors
 * straight to Sentry (required for request-level context — 404s stay
 * out of the pipeline because Next doesn't call this hook on them).
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
