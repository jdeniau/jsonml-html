/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from "vitest";
import { toHTML } from "./jsonml";

describe("toHTML", () => {
  test("should convert a simple JsonML array to a DOM element", () => {
    const jsonml = ["div", { class: "test-class" }, "Hello, World!"];
    const result = toHTML(jsonml);
    expect(result.tagName).toBe("DIV");
    expect(result.className).toBe("test-class");
    expect(result.textContent).toBe("Hello, World!");
  });

  test("should handle nested JsonML structures", () => {
    const jsonml = [
      "div",
      { class: "parent" },
      ["span", { class: "child" }, "Child Text"],
    ];
    const result = toHTML(jsonml);
    expect(result.tagName).toBe("DIV");
    expect(result.className).toBe("parent");
    expect(result.children.length).toBe(1);
    expect(result.children[0].tagName).toBe("SPAN");
    expect(result.children[0].className).toBe("child");
    expect(result.children[0].textContent).toBe("Child Text");
  });

  test("should return a text node for string input", () => {
    const jsonml = " Just a text node ";
    const result = toHTML(jsonml);
    expect(result.nodeType).toBe(Node.TEXT_NODE);
    expect(result.nodeValue).toBe(" Just a text node ");
  });

  test("should handle value", () => {
    const jsonml = ["span", "Hello, World!"];

    const result = toHTML(jsonml);

    expect(result.nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.tagName).toBe("SPAN");
    expect(result.className).toBe("");
    expect(result.id).toBe("");

    expect(result.childNodes.length).toBe(1);
    expect(result.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(result.childNodes[0].nodeValue).toBe("Hello, World!");
  });

  test("should trim whitespace nodes value", () => {
    const jsonml = ["span", " ", " ", "Hello, World!", " ", " "];

    const result = toHTML(jsonml);

    expect(result.nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.tagName).toBe("SPAN");
    expect(result.className).toBe("");
    expect(result.id).toBe("");

    expect(result.childNodes.length).toBe(1);
    expect(result.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(result.childNodes[0].nodeValue).toBe("Hello, World!");
  });

  test("should handle attributes", () => {
    const jsonml = [
      "span",
      {
        class: "number",
        id: "idea",
        "data-nope": undefined,
        "data-func": () => {},
      },
    ];

    const result = toHTML(jsonml);

    expect(result.nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.tagName).toBe("SPAN");
    expect(result.nodeValue).toBe(null);
    expect(result.className).toBe("number");
    expect(result.id).toBe("idea");
    expect(result.getAttribute("data-nope")).toBe("");
    expect(result.getAttribute("data-func")).toBe(null);
  });

  test("should handle value and attributes", () => {
    const jsonml = ["div", { class: "number", id: "idea" }, "Hello, World!"];

    const result = toHTML(jsonml);

    expect(result.nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.tagName).toBe("DIV");
    expect(result.childNodes.length).toBe(1);
    expect(result.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(result.childNodes[0].nodeValue).toBe("Hello, World!");
    expect(result.className).toBe("number");
    expect(result.id).toBe("idea");
  });

  test("should handle style attributes", () => {
    const jsonml = [
      "span",
      {
        style: "color: red;",
      },
    ];

    const result = toHTML(jsonml);

    expect(result.nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.tagName).toBe("SPAN");
    expect(result.getAttribute("style")).toBe("color: red;");
  });

  //   test.only("should handle boolean attributes", () => {
  //     const jsonml = [
  //       "input",
  //       {
  //         type: "checkbox",
  //         checked: true,
  //         disabled: false,
  //       },
  //     ];

  //     const result = toHTML(jsonml);

  //     expect(result.nodeType).toBe(Node.ELEMENT_NODE);
  //     expect(result.tagName).toBe("INPUT");
  //     expect(result.getAttribute("type")).toBe("checkbox");
  //     expect(result.checked).toBe(true);
  //     expect(result.disabled).toBe(false);
  //   });

  test("eliminate wrapper for single nodes", () => {
    const jsonml = ["", ["div", "Empty tag"]];

    const result = toHTML(jsonml);

    expect(result.nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.tagName).toBe("DIV");
    expect(result.childNodes.length).toBe(1);
    expect(result.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(result.childNodes[0].nodeValue).toBe("Empty tag");
  });

  test("should handle null or undefined input gracefully", () => {
    expect(toHTML(null)).toBeNull();
    expect(toHTML(undefined)).toBeNull();
  });

  test.each([
    { input: 123 },
    { input: true },
    { input: [true] },
    { input: {} },
    { input: [] },
    { input: [123] },
    { input: [123, { class: "test" }] },
  ])("should handle non-jsonml input", ({ input }) => {
    const result = toHTML(input);

    expect(result.nodeType).toBe(Node.TEXT_NODE);
    expect(result.nodeValue).toBe("[SyntaxError: invalid JsonML]");
  });

  test("should handle a list of JsonML trees", () => {
    const jsonml = [
      "",
      ["div", { class: "first" }, "First"],
      ["div", { class: "second" }, "Second"],
    ];
    const result = toHTML(jsonml);
    expect(result.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE);
    expect(result.childNodes.length).toBe(2);
    expect(result.childNodes[0].className).toBe("first");
    expect(result.childNodes[0].textContent).toBe("First");
    expect(result.childNodes[1].className).toBe("second");
    expect(result.childNodes[1].textContent).toBe("Second");
  });

  test("tag can start with a !", () => {
    const jsonml = ["!some comment"];
    const result = toHTML(jsonml);

    expect(result.nodeType).toBe(Node.COMMENT_NODE);
    expect(result.nodeValue).toBe("some comment ");
  });

  test("should handle bool attributes", () => {
    const jsonml = [
      "input",
      {
        autofocus: {},
      },
    ];

    const result = toHTML(jsonml);

    expect(result.nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.tagName).toBe("INPUT");
    // expect(result.select).toBe("");
  });

  test.each([
    [{}, { expectedTextContent: "{}" }],
    [["a", 1], { expectedTextContent: '["a",1]' }],
    [{ a: 1 }, { expectedTextContent: '{"a":1}' }],
    [
      null,
      {
        expectedTextContent: "null",
        expectedStyle: "color: rgb(119, 0, 136);",
      },
    ],
    [
      undefined,
      {
        expectedStyle: "color: rgb(119, 119, 119);",
        expectedTextContent: "undefined",
      },
    ],
    [
      "string",
      {
        expectedStyle: "color: rgb(170, 17, 17);",
        expectedTextContent: '"string"',
      },
    ],
    [
      1,
      {
        expectedStyle: "color: rgb(17, 102, 68);",
        expectedTextContent: "1",
      },
    ],
    [
      (a) => {
        return a;
      },
      {
        expectedTextContent: `(a) => {
        return a;
      }`,
      },
    ],
    [
      Symbol("symbol"),
      {
        expectedTextContent: "Symbol(symbol)",
      },
    ],
  ])(
    "should handle object attribute %s",
    (object, { expectedTextContent, expectedStyle }) => {
      const jsonml = ["div", { object }];
      const result = toHTML(jsonml);

      expect(result.tagName).toBe("DIV");
      expect(result.textContent).toBe(expectedTextContent);

      expect(result.childNodes.length).toBe(1);
      expect(result.childNodes[0].nodeType).toBe(Node.ELEMENT_NODE);
      expect(result.childNodes[0].tagName).toBe("SPAN");
      expect(result.childNodes[0].style.cssText).toBe(expectedStyle ?? "");

      expect(result.getAttribute("object")).toBe(null);
    }
  );

  test("should handle object with a date", () => {
    const object = new Date("2025-01-01");
    const jsonml = ["div", { object }];
    const result = toHTML(jsonml);

    expect(result.tagName).toBe("DIV");
    expect(result.textContent).toBe(`Date: ${object.toString()}`);

    expect(result.childNodes.length).toBe(1);
    expect(result.childNodes[0].nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.childNodes[0].tagName).toBe("SPAN");
    expect(result.childNodes[0].childNodes.length).toBe(2);
    expect(result.childNodes[0].childNodes[0].nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.childNodes[0].childNodes[0].style.cssText).toBe(
      "color: rgb(17, 102, 68);"
    );
    expect(result.childNodes[0].childNodes[0].textContent).toBe("Date: ");
    expect(result.childNodes[0].childNodes[1].nodeType).toBe(Node.ELEMENT_NODE);
    expect(result.childNodes[0].childNodes[1].style.cssText).toBe(
      "color: rgb(170, 17, 17);"
    );
    expect(result.childNodes[0].childNodes[1].textContent).toBe(
      object.toString()
    );

    expect(result.getAttribute("object")).toBe(null);
  });
});
