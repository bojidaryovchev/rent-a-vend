import { z } from "zod";

/**
 * Zod, with Bulgarian messages.
 *
 * Every schema in the project imports `z` from here rather than from `"zod"`.
 * The reason is that Zod's built-in messages are English, and they surface
 * verbatim to the visitor the moment a rule has no explicit message of its own -
 * a `.max(32)` with no second argument printed "Too big: expected string to
 * have <=32 characters" under a Bulgarian field label.
 *
 * Zod ships a `bg` locale, but it translates the template and not the vocabulary:
 * it still renders the internal origin name, so a long string reads "очаква се
 * string да съдържа <=32 символа". These messages are written for the person
 * filling in the form instead - no type names, no comparison operators.
 *
 * The map is a fallback. An explicit message on a rule still wins, which is
 * where the field-specific wording ("Проверете имейл адреса.") lives.
 *
 * Importing `z` from this module is what installs the map, so a schema file that
 * imports `"zod"` directly silently gets English back. There is no import that
 * needs the raw package.
 */

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type":
        // A missing field arrives as a type error against `undefined`, which is
        // the single most common failure and deserves the plainest wording.
        if (issue.input === undefined || issue.input === null) {
          return "Полето е задължително.";
        }
        if (issue.expected === "number" || issue.expected === "int") {
          return "Въведете число.";
        }
        return "Стойността не е попълнена правилно.";

      case "too_big": {
        const max = Number(issue.maximum);
        switch (issue.origin) {
          case "string":
            return `Максимум ${max} ${plural(max, "символ", "символа")}.`;
          case "array":
          case "set":
            return `Максимум ${max} ${plural(max, "елемент", "елемента")}.`;
          case "file":
            return "Файлът е твърде голям.";
          case "date":
            return "Датата е твърде късна.";
          default:
            return `Стойността трябва да е най-много ${max}.`;
        }
      }

      case "too_small": {
        const min = Number(issue.minimum);
        switch (issue.origin) {
          case "string":
            return `Минимум ${min} ${plural(min, "символ", "символа")}.`;
          case "array":
          case "set":
            return `Минимум ${min} ${plural(min, "елемент", "елемента")}.`;
          case "file":
            return "Файлът е твърде малък.";
          case "date":
            return "Датата е твърде ранна.";
          default:
            return `Стойността трябва да е поне ${min}.`;
        }
      }

      case "invalid_format":
        switch (issue.format) {
          case "email":
            return "Проверете имейл адреса.";
          case "url":
            return "Проверете адреса.";
          case "date":
            return "Проверете датата.";
          case "time":
          case "datetime":
            return "Проверете часа.";
          default:
            return "Стойността не е попълнена правилно.";
        }

      case "invalid_value":
        return "Изберете една от възможните стойности.";

      case "not_multiple_of":
        return `Стойността трябва да е кратна на ${issue.divisor}.`;

      case "unrecognized_keys":
        return "Изпратени са полета, които формата не очаква.";

      default:
        return "Проверете стойността.";
    }
  },
});

export { z };
