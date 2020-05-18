import { BigNumber } from "bignumber.js";
import Long from "long";

const escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
let gap: string;
let indent: string;

const noQuoteSym = Symbol();

export function noQuote(val: any) {
  if (typeof val === "object") {
    val[noQuoteSym] = true;
    return val;
  }

  throw new Error("noQuote can only be used with object type");
}

function hasNoQuoteSymbol(val: any) {
  return val && val[noQuoteSym];
}

const meta: Record<string, string> = {
  // table of character substitutions
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
  '"': '\\"',
  "\\": "\\\\",
};

let rep: any;

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.
function quote(string: string) {
  escapable.lastIndex = 0;
  return escapable.test(string)
    ? `"${string.replace(escapable, (a) => {
        const c = meta[a];
        return typeof c === "string"
          ? c
          : `\\u${`0000${a.charCodeAt(0).toString(16)}`.slice(-4)}`;
      })}"`
    : `"${string}"`;
}

function str(key: string | number, holder: any): string {
  // Produce a string from holder[key].

  // The loop counter.
  let i;

  // The member key.
  let k;

  // The member value.
  let v;

  let length;
  let mind = gap;
  let partial;
  let value = holder[key];

  if (
    Long.isLong(value) ||
    BigNumber.isBigNumber(value) ||
    hasNoQuoteSymbol(value)
  ) {
    return value.toString();
  }

  // If the value has a toJSON method, call it to obtain a replacement value.
  if (
    value &&
    typeof value === "object" &&
    typeof value.toJSON === "function"
  ) {
    value = value.toJSON(key);
  }

  // If we were called with a replacer function, then call the replacer to
  // obtain a replacement value.
  if (typeof rep === "function") {
    value = rep.call(holder, key, value);

    if (
      Long.isLong(value) ||
      BigNumber.isBigNumber(value) ||
      hasNoQuoteSymbol(value)
    ) {
      return value.toString();
    }
  }

  // What happens next depends on the value's type.
  switch (typeof value) {
    case "string":
      return quote(value);

    // JSON numbers must be finite. Encode non-finite numbers as null.
    case "number":
      return isFinite(value) ? String(value) : "null";

    case "boolean":
      return String(value);

    // If the type is 'object', we might be dealing with an object or an array or null.
    case "object":
      if (!value) {
        return "null";
      }

      // Make an array to hold the partial results of stringifying this object value.
      gap += indent;
      partial = [];

      // Is the value an array?
      if (Object.prototype.toString.apply(value) === "[object Array]") {
        // The value is an array. Stringify every element. Use null as a placeholder
        // for non-JSON values.

        length = value.length;
        for (i = 0; i < length; i += 1) {
          partial[i] = str(i, value) || "null";
        }

        // Join all of the elements together, separated with commas, and wrap them in
        // brackets.

        v =
          partial.length === 0
            ? "[]"
            : gap
            ? `[\n${gap}${partial.join(`,\n${gap}`)}\n${mind}]`
            : `[${partial.join(",")}]`;
        gap = mind;
        return v;
      }

      // If the replacer is an array, use it to select the members to be stringified.

      if (rep && typeof rep === "object") {
        length = rep.length;
        for (i = 0; i < length; i += 1) {
          if (typeof rep[i] === "string") {
            k = rep[i];
            v = str(k, value);
            if (v) {
              partial.push(quote(k) + (gap ? ": " : ":") + v);
            }
          }
        }
      } else {
        // Otherwise, iterate through all of the keys in the object.

        Object.keys(value).forEach((k) => {
          const v = str(k, value);
          if (v) {
            partial.push(quote(k) + (gap ? ": " : ":") + v);
          }
        });
      }

      // Join all of the member texts together, separated with commas,
      // and wrap them in braces.

      v =
        partial.length === 0
          ? "{}"
          : gap
          ? `{\n${gap}${partial.join(`,\n${gap}`)}\n${mind}}`
          : `{${partial.join(",")}}`;
      gap = mind;
      return v;

    default:
      throw new Error(`Unknown type ${typeof value}`);
  }
}

export function stringify(
  value: any,
  replacer?: any,
  space?: string | number
): string {
  let i: number;
  gap = "";
  indent = "";

  // If the space parameter is a number, make an indent string containing that
  // many spaces.

  if (typeof space === "number") {
    for (i = 0; i < space; i += 1) {
      indent += " ";
    }

    // If the space parameter is a string, it will be used as the indent string.
  } else if (typeof space === "string") {
    indent = space;
  }

  // If there is a replacer, it must be a function or an array.
  // Otherwise, throw an error.
  rep = replacer;
  if (replacer && typeof replacer !== "function" && !Array.isArray(replacer)) {
    throw new Error("JSON.stringify");
  }

  // Make a fake root object containing our value under the key of ''.
  // Return the result of stringifying the value.

  return str("", { "": value });
}
