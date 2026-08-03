import type { ReactElement } from "react";
import { render } from "@react-email/components";

/**
 * Turn a template into HTML ourselves, rather than handing Resend the element.
 *
 * `resend.emails.send({ react })` looks tidier and does not work here. The SDK
 * renders it with `await import("@react-email/render")` and throws "Failed to
 * render React component" when that resolves to nothing - which is this
 * project, because `@react-email/render` is a transitive dependency inside
 * `@react-email/components` and not a package of its own in node_modules.
 *
 * Installing it directly would silence the error and leave a dynamic import
 * inside a dependency deciding whether email works in a serverless bundle. So
 * the render happens here instead, through the export that IS installed:
 * predictable in dev, in tests and on Vercel, and inspectable when it is
 * wrong. `src/emails/branding.test.ts` renders through this same function, so
 * the tests exercise the path production takes rather than a parallel one -
 * which is how the `react` version passed every check and still failed on the
 * first real send.
 *
 * Carries no `server-only` marker deliberately: it holds no secret and touches
 * no request, and marking it would put it out of reach of the tests.
 */
export function renderEmail(template: ReactElement): Promise<string> {
  return render(template);
}
