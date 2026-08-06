import { redirect } from "next/navigation";

/**
 * There is no stock screen any more (D50).
 *
 * This route was the availability panel - the two-tap status control that the
 * whole live-availability promise rested on. The client does not track machines
 * for the site, so the panel had nothing to edit and the catalogue no longer
 * asks it anything.
 *
 * Kept as a redirect rather than deleted: `/admin` is the address in the
 * client's browser history and on his phone's home screen, and it should land
 * on the screen he actually opens the panel for.
 */
export default function AdminIndexPage() {
  redirect("/admin/zapitvaniya");
}
