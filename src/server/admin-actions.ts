"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ENQUIRY_STATUSES,
  getEnquiryStore,
  type EnquiryStatus,
} from "./enquiry-store";
import { createSession, destroySession, passwordMatches } from "./auth";
import { setUnitStatus } from "./stock-store";
import { UNIT_STATUSES, type UnitStatus } from "@/content/taxonomy";

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
  const unitId = String(formData.get("unitId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!UNIT_STATUSES.includes(status as UnitStatus)) return;

  await setUnitStatus(unitId, status as UnitStatus);
  revalidatePath("/admin");
}

export async function updateEnquiryStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!ENQUIRY_STATUSES.includes(status as EnquiryStatus)) return;

  await getEnquiryStore().setStatus(id, status as EnquiryStatus);
  revalidatePath("/admin/zapitvaniya");
}

export async function updateEnquiryNotes(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "");

  await getEnquiryStore().setNotes(id, notes);
  revalidatePath("/admin/zapitvaniya");
}
