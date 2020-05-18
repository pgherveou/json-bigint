"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
const long_1 = __importDefault(require("long"));
// The index of the current character
let at;
// The current character
let ch;
let escapee = {
    '"': '"',
    "\\": "\\",
    "/": "/",
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
};
let text;
// Call error when something is wrong.
function error(m) {
    throw {
        name: "SyntaxError",
        message: m,
        at,
        text,
    };
}
// parse next, If a c parameter is provided, verify that it matches the current character.
function next(c) {
    if (c && c !== ch) {
        error(`Expected '${c}' instead of '${ch}'`);
    }
    // Get the next character. When there are no more characters,
    // return the empty string.
    ch = text.charAt(at);
    at += 1;
    return ch;
}
// Parse a number value.
function number() {
    let number;
    let string = "";
    if (ch === "-") {
        string = "-";
        next("-");
    }
    while (ch >= "0" && ch <= "9") {
        string += ch;
        next();
    }
    if (ch === ".") {
        string += ".";
        while (next() && ch >= "0" && ch <= "9") {
            string += ch;
        }
    }
    if (ch === "e" || ch === "E") {
        string += ch;
        ch = next();
        if (ch === "-" || ch === "+") {
            string += ch;
            next();
        }
        while (ch >= "0" && ch <= "9") {
            string += ch;
            next();
        }
    }
    number = +string;
    if (!isFinite(number)) {
        error("Bad number");
    }
    else {
        //if (number > 9007199254740992 || number < -9007199254740992)
        // Bignumber has stricter check: everything with length > 15 digits disallowed
        if (string.length > 15) {
            return string.includes(".")
                ? new bignumber_js_1.BigNumber(string)
                : long_1.default.fromString(string);
        }
        return number;
    }
}
// Parse a string value.
function string() {
    let hex;
    let i;
    let string = "";
    let uffff;
    // When parsing for string values, we must look for " and \ characters.
    if (ch === '"') {
        while (next()) {
            if (ch === '"') {
                next();
                return string;
            }
            if (ch === "\\") {
                next();
                if (ch === "u") {
                    uffff = 0;
                    for (i = 0; i < 4; i += 1) {
                        hex = parseInt(next(), 16);
                        if (!isFinite(hex)) {
                            break;
                        }
                        uffff = uffff * 16 + hex;
                    }
                    string += String.fromCharCode(uffff);
                }
                else if (typeof escapee[ch] === "string") {
                    string += escapee[ch];
                }
                else {
                    break;
                }
            }
            else {
                string += ch;
            }
        }
    }
    error("Bad string");
}
// Skip whitespace.
function white() {
    while (ch && ch <= " ") {
        next();
    }
    return ch;
}
// parse true, false, or null.
function word() {
    switch (ch) {
        case "t":
            next("t");
            next("r");
            next("u");
            next("e");
            return true;
        case "f":
            next("f");
            next("a");
            next("l");
            next("s");
            next("e");
            return false;
        case "n":
            next("n");
            next("u");
            next("l");
            next("l");
            return null;
    }
    error(`Unexpected '${ch}'`);
}
// Place holder for the value function.
let value;
function array() {
    // Parse an array value.
    const arr = [];
    if (ch === "[") {
        next("[");
        if (white() === "]") {
            next("]");
            return arr; // empty array
        }
        while (ch) {
            arr.push(value());
            if (white() === "]") {
                next("]");
                return arr;
            }
            next(",");
            white();
        }
    }
    error("Bad array");
}
let object = function () {
    // Parse an object value.
    let key;
    let object = {};
    if (ch === "{") {
        next("{");
        if (white() === "}") {
            next("}");
            return object; // empty object
        }
        while (ch) {
            key = string();
            white();
            next(":");
            object[key] = value();
            if (white() === "}") {
                next("}");
                return object;
            }
            next(",");
            white();
        }
    }
    error("Bad object");
};
value = function () {
    // Parse a JSON value. It could be an object, an array, a string, a number,
    // or a word.
    white();
    switch (ch) {
        case "{":
            return object();
        case "[":
            return array();
        case '"':
            return string();
        case "-":
            return number();
        default:
            return ch >= "0" && ch <= "9" ? number() : word();
    }
};
// Return the json_parse function. It will have access to all of the above
// functions and variables.
function parse(source, reviver) {
    let result;
    text = `${source}`;
    at = 0;
    ch = " ";
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }
    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.
    return typeof reviver === "function"
        ? (function walk(holder, key) {
            let v;
            let value = holder[key];
            if (value && typeof value === "object") {
                Object.keys(value).forEach((k) => {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    }
                    else {
                        delete value[k];
                    }
                });
            }
            return reviver.call(holder, key, value);
        })({ "": result }, "")
        : result;
}
exports.parse = parse;
//# sourceMappingURL=parse.js.map