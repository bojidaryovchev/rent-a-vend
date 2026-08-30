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
import {
  getMailboxStore,
  MAIL_THREAD_STATUSES,
  type MailThreadStatus,
} from "./mailbox-store";
import {
  REPLY_ATTACHMENT_LIMIT,
  sendEnquiryReply,
  sendReply,
  type OutgoingAttachment,
} from "./mailbox-reply";
import { MODELS } from "@/content/models";
import { TERMS, type Term } from "@/engine/rates";
import { termsAreMonotonic } from "@/engine/terms";
import { monthlyByTerm } from "@/engine/catalogue";
import { loadCatalogue } from "./catalogue";
import {
  getModelSettingsStore,
  parsePrice,
  type ModelSettingsInput,
} from "./model-settings-store";

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

export type EnquiryReplyState = { error?: string; sent?: boolean };

/**
 * Answer an enquiry, as info@, from the screen the enquiry is on.
 *
 * The same shape as `replyToThread` and for the same reason: a failed send has
 * to put the typed text back in front of the person who typed it, so this
 * returns state rather than redirecting. Losing a written quote to a transient
 * Resend error is the most annoying failure available here.
 *
 * The attachment accounting is `replyToThread`'s, line for line. It is repeated
 * rather than shared because the two actions differ in what they look the
 * recipient up by and in nothing else, and a helper taking a FormData and
 * returning either files or an error string would be harder to read than the
 * eighteen lines it replaced.
 */
export async function replyToEnquiry(
  _prev: EnquiryReplyState,
  formData: FormData,
): Promise<EnquiryReplyState> {
  if (!(await requireAdmin())) {
    return { error: "Сесията е изтекла. Влезте отново и опитайте пак." };
  }

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Отговорът е празен." };

  /* Read back rather than trusted from the form. The address the reply is sent
     to decides where it goes, and a server action is a public endpoint - taking
     it from a hidden input would let a POST send mail as info@ to anyone. */
  const enquiry = (await getEnquiryStore().list()).find((e) => e.id === id);
  if (!enquiry) return { error: "Запитването не е намерено." };

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

  const result = await sendEnquiryReply(enquiry, body, files);
  if (!result.ok) return { error: result.error };

  /**
   * A first answer moves the lead out of "new" on its own.
   *
   * Not a convenience. The count at the top of the screen is "за обработка",
   * and an enquiry that has been personally answered but still reads as new
   * makes that number lie in the direction that costs a sale - it hides the
   * ones actually waiting among the ones already handled. Only from `new`:
   * past that point the client is tracking the sale himself and it is not this
   * action's business to move it.
   */
  if (enquiry.status === "new") {
    await getEnquiryStore().setStatus(enquiry.id, "in-progress");
  }

  revalidatePath("/admin/zapitvaniya");
  revalidatePath("/admin/poshta");
  return { sent: true };
}

/* -- prices and catalogue visibility --------------------------------------- */

/**
 * Everything a price change has to invalidate.
 *
 * A rent appears on the machine's own page, its category page, the home grid,
 * `/tseni`, the prefilled enquiry form, the sitemap and `llms.txt` - and inside
 * the JSON-LD offer on several of those. Enumerating them would mean this list
 * silently going stale the first time a price lands on a new surface, and the
 * failure mode is a customer being quoted one figure on the card and another on
 * the page.
 *
 * So it revalidates the root layout, which purges every cached route. That is
 * heavy-handed for a static site of ~60 pages and completely appropriate at this
 * frequency: this fires when one person edits one price, not on a request path.
 */
function revalidateCatalogue(): void {
  revalidatePath("/", "layout");
  /* A route handler, not a page - it carries prices and is `force-static`, so
     it needs naming even after the layout purge. */
  revalidatePath("/llms.txt");
  revalidatePath("/admin/tseni");
}

export type PricingState = { error?: string; savedId?: string };

/**
 * Save one machine: five prices, published, position.
 *
 * The whole machine at once rather than a field at a time. The admin form
 * submits all five terms on every save, so a term left blank is an instruction
 * to unprice it - which is how a machine goes back to the derived placeholder
 * without a delete button.
 */
export async function saveModelPricing(
  _prev: PricingState,
  formData: FormData,
): Promise<PricingState> {
  if (!(await requireAdmin())) {
    return { error: "Сесията е изтекла. Влезте отново и опитайте пак." };
  }

  const modelId = String(formData.get("modelId") ?? "");
  if (!MODELS.some((m) => m.id === modelId)) {
    return { error: "Непозната машина." };
  }

  const monthly: Partial<Record<Term, number | null>> = {};
  try {
    for (const term of TERMS) {
      monthly[term] = parsePrice(formData.get(`monthly_${term}`));
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Невалидна цена." };
  }

  /**
   * Refused, not silently corrected.
   *
   * D27 makes "с X% по-ниска месечна вноска" the only permitted phrasing for a
   * longer term, and a curve that rises would put a negative percentage in that
   * sentence. `quote()` floors it at zero as a last defence, but the client
   * should be told he typed something contradictory rather than have the site
   * quietly hide it.
   */
  if (!termsAreMonotonic(monthly)) {
    return {
      error:
        "По-дългият срок не може да е с по-висока месечна вноска. Проверете реда на цените.",
    };
  }

  const input: ModelSettingsInput = {
    monthly,
    published: formData.get("published") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  };

  try {
    await getModelSettingsStore().save(modelId, input);
  } catch (err) {
    console.error("Записът на цената се провали:", err);
    return { error: "Записът не бе успешен. Опитайте пак." };
  }

  revalidateCatalogue();
  return { savedId: modelId };
}

/** Returns one machine to the derived placeholder and republishes it. */
export async function resetModelPricing(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const modelId = String(formData.get("modelId") ?? "");
  if (!MODELS.some((m) => m.id === modelId)) return;

  await getModelSettingsStore().remove(modelId);
  revalidateCatalogue();
}

/**
 * Move one machine up or down within its category.
 *
 * Reordering is expressed as a swap rather than as a typed position, because a
 * position field makes the client responsible for keeping 50 numbers distinct.
 * Every row starts at 0, so the first move has to hand out real positions: the
 * category is renumbered from its current visible order, and only then are the
 * two neighbours exchanged.
 */
export async function moveModel(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const modelId = String(formData.get("modelId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const model = MODELS.find((m) => m.id === modelId);
  if (!model || (direction !== "up" && direction !== "down")) return;

  const catalogue = await loadCatalogue();

  /* The admin lists unpublished machines too, so the order it shows - and the
     order these arrows move things through - is the category's whole roster. */
  const siblings = catalogue.all
    .filter((m) => m.category === model.category)
    .map((m, index) => ({ model: m, index }))
    .sort((a, b) => {
      const byOrder =
        (catalogue.settings.get(a.model.id)?.sortOrder ?? 0) -
        (catalogue.settings.get(b.model.id)?.sortOrder ?? 0);
      return byOrder !== 0 ? byOrder : a.index - b.index;
    })
    .map((entry) => entry.model);

  const at = siblings.findIndex((m) => m.id === modelId);
  const to = direction === "up" ? at - 1 : at + 1;
  if (at === -1 || to < 0 || to >= siblings.length) return;

  [siblings[at], siblings[to]] = [siblings[to], siblings[at]];

  const store = getModelSettingsStore();
  for (const [position, sibling] of siblings.entries()) {
    const existing = catalogue.settings.get(sibling.id);
    await store.save(sibling.id, {
      /* Prices are carried through untouched. Reordering must never be a way to
         lose one, which is the risk in an upsert that writes every column. */
      monthly: existing ? monthlyByTerm(existing) : {},
      published: existing?.published ?? true,
      sortOrder: position,
    });
  }

  revalidateCatalogue();
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
