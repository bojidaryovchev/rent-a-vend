import { describe, expect, it } from "vitest";
import {
  CONDITIONS,
  CONDITION_LABEL,
  CONDITION_POINTS,
  CONDITION_SCHEMA_URL,
  CONDITION_STATEMENT,
} from "@/content/taxonomy";
import { modelSchema } from "@/content/schema";
import { MODELS } from "@/content/models";

/**
 * The `new` half of the catalogue has no data behind it yet.
 *
 * Every model falls to the `refurbished` default, so the branch that renders a
 * new machine - its sentence and its `itemCondition` - becomes reachable the
 * moment someone edits one line of a model file, and is exercised by nothing
 * until then. That is the shape of change that ships broken: the build passes,
 * the tests pass, and the first new machine on the site describes itself as
 * rebuilt.
 */

describe("condition", () => {
  it("defaults an unflagged model to refurbished", () => {
    const model = modelSchema.parse({
      id: "x",
      slug: "x",
      name: "X",
      manufacturer: "necta",
      category: "coffee",
    });
    expect(model.condition).toBe("refurbished");
  });

  it("accepts a model flagged new, and rejects anything else", () => {
    const base = {
      id: "x",
      slug: "x",
      name: "X",
      manufacturer: "necta",
      category: "coffee",
    } as const;

    expect(modelSchema.parse({ ...base, condition: "new" }).condition).toBe(
      "new",
    );
    expect(() =>
      modelSchema.parse({ ...base, condition: "рециклирана" }),
    ).toThrow();
  });

  it("gives every catalogued model a known condition", () => {
    for (const model of MODELS) {
      expect(CONDITIONS).toContain(model.condition);
    }
  });

  it("maps each condition to a distinct schema.org URL", () => {
    expect(CONDITION_SCHEMA_URL.new).toBe("https://schema.org/NewCondition");
    expect(CONDITION_SCHEMA_URL.refurbished).toBe(
      "https://schema.org/RefurbishedCondition",
    );
  });

  /* A new machine must not describe itself as rebuilt. */
  it("says something different for new than for refurbished", () => {
    expect(CONDITION_STATEMENT.new).not.toBe(CONDITION_STATEMENT.refurbished);
    expect(CONDITION_LABEL.new).not.toBe(CONDITION_LABEL.refurbished);
    expect(CONDITION_STATEMENT.new).not.toContain("рециклирана");
    expect(CONDITION_STATEMENT.refurbished).toContain("рециклирана");
  });

  /* Both halves keep the promise the readiness claim is actually making. */
  it("promises the workshop check whatever the condition", () => {
    for (const condition of CONDITIONS) {
      expect(CONDITION_STATEMENT[condition]).toContain("проверена");
      expect(CONDITION_POINTS[condition]).toHaveLength(3);
    }
  });
});
