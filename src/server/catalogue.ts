import "server-only";
import { cache } from "react";
import { buildCatalogue, type Catalogue } from "@/engine/catalogue";
import { getModelSettingsStore } from "./model-settings-store";

/**
 * Reads the client's settings and hands back a catalogue.
 *
 * WHY `cache()` AND NOT `use cache`. The `use cache` directive is the Next 16
 * replacement for `unstable_cache`, but it requires `cacheComponents: true`,
 * which changes the rendering model for every route in the app - not something
 * to switch on as a side effect of adding a price table. React's `cache()`
 * dedupes within a single render, which is all this needs: the pages are
 * prerendered, and `src/server/admin-actions.ts` revalidates explicitly on every
 * save, so nothing is served stale.
 *
 * A FAILED READ IS NOT A FAILED BUILD. Around 60 pages are prerendered, so this
 * runs during deploys; a database that blinks mid-build must not take the deploy
 * with it. The catch falls back to an empty settings table, which means derived
 * placeholder prices and a fully published catalogue - the site the client had
 * before this feature existed, rather than a broken one. `catalogue.ok` carries
 * the failure so the admin can say so out loud instead of showing the client a
 * screen of prices that are not his.
 */
export const loadCatalogue = cache(async (): Promise<Catalogue> => {
  try {
    return buildCatalogue(await getModelSettingsStore().list(), true);
  } catch (err) {
    console.error(
      "Настройките на каталога не можаха да се прочетат - показват се временни цени:",
      err,
    );
    return buildCatalogue([], false);
  }
});
