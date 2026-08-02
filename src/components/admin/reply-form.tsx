"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { replyToThread, type ReplyState } from "@/server/admin-actions";

/**
 * The reply box.
 *
 * Deliberately plain text. The people writing to info@ are asking whether a
 * machine is available and what it costs, and a rich text editor would add a
 * toolbar, a sanitiser and a second body format to store in exchange for bold.
 *
 * The one thing it does insist on is not losing what was typed: a failed send
 * leaves the text in the box and says why, rather than clearing the form and
 * showing a toast.
 */

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-sm bg-ink px-5 py-2.5 text-ui font-semibold text-ink-inverse transition-transform duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97] disabled:opacity-60"
    >
      {pending ? "Изпраща се..." : "Изпрати"}
    </button>
  );
}

export function ReplyForm({
  threadId,
  sender,
}: {
  threadId: string;
  /** Shown above the box, because "which address is this leaving from" is the
   *  whole reason to answer here rather than in Gmail. */
  sender: string;
}) {
  const [state, action] = useActionState<ReplyState, FormData>(
    replyToThread,
    {},
  );
  const form = useRef<HTMLFormElement>(null);

  /* Cleared only on success, and only after the render that reported it: the
     form is uncontrolled, so a failed send keeps the typed reply exactly where
     it was. Keyed on the state object rather than on `sent`, so a second
     successful reply clears the box as well as the first. */
  useEffect(() => {
    if (state.sent) form.current?.reset();
  }, [state]);

  return (
    <form
      ref={form}
      action={action}
      className="mt-6 rounded-md border border-line-strong bg-paper-raised p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <label htmlFor="body" className="text-ui font-semibold">
          Отговор
        </label>
        <p className="text-ui-sm text-ink-subtle">от {sender}</p>
      </div>

      <input type="hidden" name="threadId" value={threadId} />

      <textarea
        id="body"
        name="body"
        rows={7}
        required
        placeholder="Напишете отговора..."
        className="mt-2 w-full rounded-sm border border-line-strong bg-paper px-3.5 py-3 text-[1rem] leading-relaxed focus:border-ink"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="text-ui-sm text-ink-muted">
          <span className="block font-medium text-ink">Прикачени файлове</span>
          <input
            type="file"
            name="files"
            multiple
            className="mt-1 max-w-full text-ui-sm file:mr-3 file:min-h-9 file:rounded-sm file:border file:border-line-strong file:bg-paper file:px-3 file:text-ui-sm file:font-medium"
          />
        </label>
        <Submit />
      </div>

      {state.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.sent && (
        <p role="status" className="mt-3 text-sm font-medium text-ink-muted">
          Отговорът е изпратен.
        </p>
      )}
    </form>
  );
}
