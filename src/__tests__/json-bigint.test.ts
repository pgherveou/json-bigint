import Long from "long";
import BigNumber from "bignumber.js";
import { parse } from "../parse";
import { stringify, noQuote } from "../stringify";

class MyEnum {
  static one = new MyEnum("one");
  constructor(public value: string) {}

  toString() {
    if (this.value === "one") {
      return "MyEnum.one";
    } else {
      return `"${this.value}"`;
    }
  }
}

const inputWithBigNumber =
  '{"big":9223372036854775807,"bigDecimal":9223372036854775807.1,"small":123}';

it("should parse regular JSON text", () => {
  const jsonInput = require("../../package.json");
  const jsonResult = parse(JSON.stringify(jsonInput));
  expect(jsonResult).toEqual(jsonInput);
});

it("should stringify regular JSON object", () => {
  const jsonInput = require("../../package.json");
  expect(stringify(jsonInput)).toEqual(JSON.stringify(jsonInput));
  expect(stringify(jsonInput, null, 2)).toEqual(
    JSON.stringify(jsonInput, null, 2)
  );
});

it("Should show classic JSON.parse lacks bigint support", () => {
  const obj = JSON.parse(inputWithBigNumber);
  expect(obj.small.toString()).toEqual("123");
  expect(obj.big.toString()).not.toEqual("9223372036854775807");

  const output = JSON.stringify(obj);
  expect(output).not.toEqual(inputWithBigNumber);
});

it("Should show JSON does support bigint parse/stringify roundtrip", () => {
  const obj = parse(inputWithBigNumber);
  expect(obj.small.toString()).toEqual("123");
  expect(obj.big.toString()).toEqual("9223372036854775807");
  expect(obj.big).toBeInstanceOf(Long);
  expect(obj.bigDecimal).toBeInstanceOf(BigNumber);

  const output = stringify(obj);
  expect(output).toEqual(inputWithBigNumber);
});

it("should stringify undefined values", () => {
  const input = { val: undefined };
  expect(stringify(input)).toEqual(`{}`);
});

it("should stringify bigint values", () => {
  const input = { val: BigInt(1) };
  expect(stringify(input)).toEqual(`{"val":1}`);
});

it("should customize stringify when using noQuote", () => {
  const input = {
    foo: noQuote(MyEnum.one),
  };

  expect(stringify(input)).toEqual(`{"foo":MyEnum.one}`);
});

it("should customize stringify when using noQuote with replacer", () => {
  const input = {
    foo: MyEnum.one,
  };

  expect(
    stringify(input, (_: any, val: any) =>
      val instanceof MyEnum ? noQuote(val) : val
    )
  ).toEqual(`{"foo":MyEnum.one}`);
});
