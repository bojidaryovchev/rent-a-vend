"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ENQUIRY_STATUSES,
  getEnquiryStore,
  type EnquiryStatus,
} from "./enquiry-store";
import {
  createSession,
  destroySession,
  isSignedIn,
  passwordMatches,
} from "./auth";
import { setUnitStatus } from "./stock-store";
import {
  getMailboxStore,
  MAIL_THREAD_STATUSES,
  type MailThreadStatus,
} from "./mailbox-store";
import {
  REPLY_ATTACHMENT_LIMIT,
  sendReply,
  type OutgoingAttachment,
} from "./mailbox-reply";
import { UNIT_STATUSES, type UnitStatus } from "@/content/taxonomy";

/**
 * Every action below re-checks the session.
 *
 * The admin layout redirects a signed-out visitor, but that is a rendering
 * decision and a server action is a public endpoint: the id is in the client
 * bundle and can be POSTed to without ever loading the page that draws the
 * button. It matters most for `replyToThread`, which sends mail as info@ - an
 * unguarded one is an open relay wearing our DKIM signature.
 */
async function requireAdmin(): Promise<boolean> {
  return isSignedIn();
}

export type LoginState = { error?: string };

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!passwordMatches(password)) {
    // Deliberately vague, and deliberately slow enough to discourage guessing.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Грешна парола." };
  }

  await createSession();
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/admin/vhod");
}

/**
 * Two taps from a phone in the warehouse.
 *
 * The site's biggest advantage over every competitor is live availability, and
 * it survives only if updating it is faster than not bothering.
 */
export async function updateUnitStatus(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const unitId = String(formData.get("unitId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!UNIT_STATUSES.includes(status as UnitStatus)) return;

  await setUnitStatus(unitId, status as UnitStatus);
  revalidatePath("/admin");
}

export async function updateEnquiryStatus(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!ENQUIRY_STATUSES.includes(status as EnquiryStatus)) return;

  await getEnquiryStore().setStatus(id, status as EnquiryStatus);
  revalidatePath("/admin/zapitvaniya");
}

export async function updateEnquiryNotes(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "");

  await getEnquiryStore().setNotes(id, notes);
  revalidatePath("/admin/zapitvaniya");
}

/* -- the info@ mailbox ----------------------------------------------------- */

export async function updateThreadStatus(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!MAIL_THREAD_STATUSES.includes(status as MailThreadStatus)) return;

  await getMailboxStore().setThreadStatus(id, status as MailThreadStatus);
  revalidatePath("/admin/poshta");
  revalidatePath(`/admin/poshta/${id}`);
}

export type ReplyState = { error?: string; sent?: boolean };

/**
 * Send a reply, as info@, in the customer's existing thread.
 *
 * Returns state rather than redirecting: a failed send has to put the typed
 * text back in front of the person who typed it. Losing a written reply to a
 * transient Resend error would be the most annoying possible failure here.
 */
export async function replyToThread(
  _prev: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  if (!(await requireAdmin())) {
    return { error: "Сесията е изтекла. Влезте отново и опитайте пак." };
  }

  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!threadId) return { error: "Липсва разговор." };
  if (!body) return { error: "Отговорът е празен." };

  const files: OutgoingAttachment[] = [];
  let total = 0;

  for (const entry of formData.getAll("files")) {
    /* An empty file input still submits a zero-byte File, so the size check is
       what tells "no attachment" from "an attachment". */
    if (!(entry instanceof File) || entry.size === 0) continue;

    total += entry.size;
    if (total > REPLY_ATTACHMENT_LIMIT) {
      return {
        error: `Файловете са общо над ${Math.round(REPLY_ATTACHMENT_LIMIT / 1_000_000)} MB. Изпратете ги с връзка за изтегляне.`,
      };
    }

    files.push({
      filename: entry.name,
      contentType: entry.type || "application/octet-stream",
      content: Buffer.from(await entry.arrayBuffer()).toString("base64"),
      size: entry.size,
    });
  }

  const result = await sendReply(threadId, body, files);
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/poshta");
  revalidatePath(`/admin/poshta/${threadId}`);
  return { sent: true };
}
