import { describe, expect, it } from "vitest";
import {
  extractAddresses,
  hasAddresses,
  isAddressedToDomain,
  isSentFromDomain,
} from "./recipients";

/**
 * The four sites share one mail account, and its webhook fires every site's
 * endpoint for mail to any of the four domains. These decide which mail is
 * this site's; the rest must never reach its admin.
 */

const SHOP = "shop.example";

describe("isAddressedToDomain", () => {
  it("accepts a plain recipient at the domain", () => {
    expect(isAddressedToDomain([["info@shop.example"]], SHOP)).toBe(true);
  });

  it("rejects mail for another domain", () => {
    expect(isAddressedToDomain([["info@other.example"]], SHOP)).toBe(false);
  });

  it("reads the address out of a display-name form", () => {
    expect(isAddressedToDomain([['"Магазин" <Info@Shop.Example>']], SHOP)).toBe(
      true,
    );
  });

  it("ignores case in the domain", () => {
    expect(isAddressedToDomain([["INFO@SHOP.EXAMPLE"]], "Shop.Example")).toBe(
      true,
    );
  });

  it("looks at cc, bcc and received_for as well as to", () => {
    const other = ["x@other.example"];
    expect(
      isAddressedToDomain(
        [other, ["a@b.example"], ["info@shop.example"]],
        SHOP,
      ),
    ).toBe(true);
    expect(
      isAddressedToDomain(
        [other, null, undefined, ["info@shop.example"]],
        SHOP,
      ),
    ).toBe(true);
    expect(isAddressedToDomain([other, [], []], SHOP)).toBe(false);
  });

  /* A display name is the sender's to write. It must not be able to make mail
     for somebody else look like ours. */
  it("is not fooled by our address in the display name", () => {
    expect(
      isAddressedToDomain([['"info@shop.example" <x@other.example>']], SHOP),
    ).toBe(false);
  });

  it("does not match a lookalike or a subdomain", () => {
    expect(isAddressedToDomain([["a@shop.example.evil.test"]], SHOP)).toBe(
      false,
    );
    expect(isAddressedToDomain([["a@evilshop.example"]], SHOP)).toBe(false);
    expect(isAddressedToDomain([["a@mail.shop.example"]], SHOP)).toBe(false);
  });

  it("tolerates a trailing dot in the domain", () => {
    expect(isAddressedToDomain([["info@shop.example."]], SHOP)).toBe(true);
  });

  it("finds ours in a comma-joined header value with a quoted comma", () => {
    expect(
      isAddressedToDomain(
        [['"Doe, John" <j@other.example>, info@shop.example']],
        SHOP,
      ),
    ).toBe(true);
  });

  it("is false for nothing at all, and for an empty domain", () => {
    expect(isAddressedToDomain([], SHOP)).toBe(false);
    expect(isAddressedToDomain([[""]], SHOP)).toBe(false);
    expect(isAddressedToDomain([["info@shop.example"]], "")).toBe(false);
  });
});

describe("extractAddresses / hasAddresses", () => {
  it("lowercases and strips names", () => {
    expect(extractAddresses('"A B" <A@B.Example>')).toEqual(["a@b.example"]);
  });

  it("returns nothing for text that is not an address", () => {
    expect(extractAddresses("undisclosed-recipients:;")).toEqual([]);
    expect(hasAddresses([[""], null, []])).toBe(false);
    expect(hasAddresses([["a@b.example"]])).toBe(true);
  });
});

describe("isSentFromDomain", () => {
  it("is true for our own sender and false for a lookalike", () => {
    expect(isSentFromDomain("Shop <info@shop.example>", SHOP)).toBe(true);
    expect(isSentFromDomain("a@shop.example.evil.test", SHOP)).toBe(false);
  });
});
