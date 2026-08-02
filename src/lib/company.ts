/**
 * Company facts.
 *
 * Values wrapped in `[[...]]` are unresolved placeholders. The readiness check
 * scans for that pattern, so nothing half-filled can ship.
 *
 * Received from the client on 2 August 2026: legal name, ЕИК, registered
 * office, phone, email, contact person. Still awaiting: the brand name, which
 * PRODUCT.md records as deliberately undecided, and the map pin (see `mapPin`).
 *
 * Note on ЕИК and VAT: the client supplied "BG204578516", which is the VAT
 * form. Bulgarian VAT numbers are the ЕИК prefixed with BG, so the ЕИК is the
 * digits alone. Worth a one-line confirmation, since a company can be
 * registered without being VAT-registered.
 */

export const UNRESOLVED = /\[\[[A-Z_]+\]\]/;

/** Digits only, E.164 without the plus. The one place the number is written. */
const PHONE_E164 = "359897943424";

/* Address in parts, so the prose line and the PostalAddress in the structured
   data cannot drift apart. "Местност Бедрозов бунар" is a locality name, not a
   street - Bulgarian village addresses often have no street at all. */
const STREET = "местност Бедрозов бунар № 42";
const LOCALITY = "с. Марково";
const REGION = "Пловдив";

export const company = {
  /** Trading name shown to visitors. Placeholder until the brand is chosen. */
  brandName: "[[BRAND]]",

  legalName: "Лидер офис МЛ ЕООД",
  eik: "204578516",
  vatNumber: "BG204578516",
  registeredOffice: `${LOCALITY}, ${STREET}, обл. ${REGION}`,
  correspondenceAddress: `${LOCALITY}, ${STREET}, обл. ${REGION}`,

  /** The same address in parts, for schema.org PostalAddress. */
  streetAddress: STREET,
  addressLocality: LOCALITY,
  addressRegion: REGION,

  /** The owner who answers enquiries personally. */
  contactPerson: "Любомир Младенов",

  phone: "+359 897 943 424",
  phoneHref: `tel:+${PHONE_E164}`,
  email: "vendingskladbg@gmail.com",
  emailHref: "mailto:vendingskladbg@gmail.com",

  /** Same handset as the phone number: one line, three ways to reach it. */
  whatsappHref: `https://wa.me/${PHONE_E164}`,
  viberHref: `viber://chat?number=%2B${PHONE_E164}`,

  /** Confirmed in round 9. Safe to publish. */
  workingHours: "понеделник - петък, 09:00 - 18:00 ч.",
  responsePromise: "Отговаряме до 1 работен час",
  outOfHoursNote:
    "Запитванията извън работно време получават отговор в първия работен ден.",

  /** Confirmed in round 1. Safe to publish. */
  serviceSla: "Реакция при сервизен сигнал до 48 часа, до 24 часа в областните градове",
  coverage: "Доставка и монтаж в цяла България",
} as const;

/**
 * Fields a legal document cannot be published without.
 *
 * Deliberately narrower than "every field": the brand name is still open by
 * design, and it must not keep flagging the privacy notice as unfinished once
 * the trader details are in. Trader identification is what the E-Commerce Act
 * requires; a wordmark is not.
 */
const LEGAL_IDENTITY_FIELDS = [
  "legalName",
  "eik",
  "vatNumber",
  "registeredOffice",
  "correspondenceAddress",
  "phone",
  "email",
] as const;

/** True while any legal page would publish with a gap in the trader details. */
export const hasUnresolvedCompanyFields = (): boolean =>
  LEGAL_IDENTITY_FIELDS.some((field) => UNRESOLVED.test(company[field]));

/** True while the brand name is still a placeholder. Drives the demo banner. */
export const hasUnresolvedBrand = (): boolean => UNRESOLVED.test(company.brandName);

/* -- where we are --------------------------------------------------------- */

/**
 * The pin on the map, and the address printed beside it.
 *
 * Kept apart from `registeredOffice` on purpose. The registered office is a
 * legal fact that belongs on the legal pages; this is an invitation to drive to
 * a warehouse, and the two are only the same address until the day they are
 * not. It is also the reason the map is not simply pointed at the seat of the
 * company: sending a visitor to an accountant's door is worse than no map.
 *
 * Coordinates take priority over the address string, and here they are not a
 * nicety. "Местност Бедрозов бунар" is a locality, not a street: geocoded, it
 * lands in the middle of Марково, 2.8km from the premises, which sit up on the
 * ring road at the northern edge of the village land. An address-only map would
 * have been confidently, quietly wrong.
 *
 * WHERE THE PIN CAME FROM, since it was not sent to us and should be confirmed.
 * The client's existing stationery business, Офис Лидер (mlstore.eu), publishes
 * the same premises with a fuller address - "Околовръстен път 86 / с. Марково,
 * местност Бедрозов бунар 42" - and embeds a Google map of it. These
 * coordinates are that embed's, and four things say it is the same yard:
 *
 *   - the same locality and number as the address the client sent us;
 *   - one of the four mobile numbers listed there IS our contact number;
 *   - the same Monday-Friday 09:00-18:00 hours;
 *   - reverse geocoding the pin returns road 86, matching Околовръстен път 86.
 *
 * Registered under `map-location` in the placeholder registry so it is put in
 * front of the client for a yes, rather than sitting on an inference forever.
 *
 * If the fields go back to null the map renders as a labelled empty bay and
 * nothing is loaded from Google - null rather than a `[[...]]` token, so that a
 * missing map cannot fail the strict readiness gate. A site with no map is a
 * site with no map; a map on the wrong spot sends a lorry to the wrong village.
 */
export const mapPin: {
  lat: number | null;
  lng: number | null;
  /** 15 shows the neighbourhood, 17 the building. 16 reads both. */
  zoom: number;
  /**
   * Printed beside the map, and used as the search term when there are no
   * coordinates. Not the registered office string: it leads with the ring road,
   * because that is the part a driver needs. The legal pages keep the register's
   * wording, which has no road in it at all.
   */
  address: string | null;
  /** Optional line for "the gate is behind the petrol station" sort of thing. */
  directions: string | null;
} = {
  lat: 42.089274,
  lng: 24.699687,
  zoom: 16,
  address: `Околовръстен път 86, ${LOCALITY}, ${STREET}, обл. ${REGION}`,
  /* Nothing invented. Worth asking the client for one line about which gate. */
  directions: null,
};

/** What Google is asked to show, or null while we do not know where we are. */
export function mapQuery(): string | null {
  if (mapPin.lat !== null && mapPin.lng !== null) {
    return `${mapPin.lat},${mapPin.lng}`;
  }
  if (mapPin.address && !UNRESOLVED.test(mapPin.address)) return mapPin.address;
  return null;
}

/** True once there is somewhere to point at. */
export const hasMapLocation = (): boolean => mapQuery() !== null;

/**
 * Deep link into Google Maps proper.
 *
 * Always available when the location is known, with or without an API key, and
 * it is what carries the "how do I get there" job when the embed is not loaded.
 * Opening the real app is better than an embedded map for anyone who actually
 * intends to drive.
 */
export function mapsLink(): string | null {
  const query = mapQuery();
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * The embed URL, or null when the map cannot be shown.
 *
 * Needs a Maps Embed API key. The keyless `output=embed` form works today and
 * is undocumented, which makes it a thing that breaks silently on a page the
 * client will not be watching. Without a key the component degrades to the
 * address and the link above rather than guessing.
 */
export function mapEmbedSrc(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const query = mapQuery();
  if (!key || !query) return null;

  const params = new URLSearchParams({
    key,
    q: query,
    zoom: String(mapPin.zoom),
    language: "bg",
    region: "BG",
  });
  return `https://www.google.com/maps/embed/v1/place?${params}`;
}
