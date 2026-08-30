"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { replyToEnquiry, type EnquiryReplyState } from "@/server/admin-actions";

/**
 * Answering a lead without leaving the screen it arrived on.
 *
 * The notification for this enquiry is already sitting in the owner's Gmail with
 * `Reply-To` set to the customer, so the obvious thing to do sends from
 * gmail.com - which is the exact impression info@ exists to prevent, on the one
 * message where it matters most. This box is the alternative, and it says whose
 * address it leaves from because that is its entire argument.
 *
 * CLOSED UNTIL ASKED FOR. The list is read down, quickly, to see who is waiting;
 * a textarea open on every card would push four enquiries off the screen to make
 * room for boxes nobody is typing in. Opening one is a tap, and the tap is also
 * what says "I am dealing with this one".
 *
 * Plain text, like the mailbox reply and for the same reason: a toolbar, a
 * sanitiser and a second body format is a lot to carry in exchange for bold.
 */

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-10 rounded-sm bg-ink px-4 py-2 text-ui font-semibold text-ink-inverse transition-transform duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97] disabled:opacity-60"
    >
      {pending ? "Изпраща се..." : "Изпрати"}
    </button>
  );
}

export function EnquiryReplyForm({
  enquiryId,
  recipient,
  sender,
}: {
  enquiryId: string;
  /** Shown on the trigger, so it is obvious where this is going before it is
   *  opened - and visible against the address printed on the card above. */
  recipient: string;
  sender: string;
}) {
  const [state, action] = useActionState<EnquiryReplyState, FormData>(
    replyToEnquiry,
    {},
  );
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  /* Cleared only on success, and only after the render that reported it: the
     textarea is uncontrolled, so a failed send keeps the typed reply exactly
     where it was. Keyed on the state object rather than on `sent`, so a second
     successful reply clears the box as well as the first. */
  useEffect(() => {
    if (state.sent) form.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-10 rounded-sm border border-line-strong px-4 py-2 text-ui font-medium transition-colors duration-[--duration-fast] ease-[--ease-out] active:scale-[0.97] hover-fine:border-ink"
        >
          Отговори на {recipient}
        </button>
        {state.sent && (
          <p role="status" className="text-ui-sm text-ink-muted">
            Отговорът е изпратен. Разговорът продължава в Поща.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      ref={form}
      action={action}
      className="mt-4 rounded-sm border border-line-strong bg-paper-sunken p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <label
          htmlFor={`reply-${enquiryId}`}
          className="text-ui font-semibold"
        >
          Отговор до {recipient}
        </label>
        <p className="text-ui-sm text-ink-subtle">от {sender}</p>
      </div>

      <input type="hidden" name="id" value={enquiryId} />

      <textarea
        id={`reply-${enquiryId}`}
        name="body"
        rows={6}
        required
        autoFocus
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-10 rounded-sm px-3 py-2 text-ui text-ink-muted hover-fine:text-ink"
          >
            Затвори
          </button>
          <Submit />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.sent && (
        <p role="status" className="mt-3 text-sm font-medium text-ink-muted">
          Отговорът е изпратен. Разговорът продължава в Поща.
        </p>
      )}
    </form>
  );
}
