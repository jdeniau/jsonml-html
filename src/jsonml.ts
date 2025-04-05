/**
 * Attribute name map
 */
const ATTR_MAP = {
  accesskey: "accessKey",
  bgcolor: "bgColor",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  checked: "defaultChecked",
  class: "className",
  colspan: "colSpan",
  contenteditable: "contentEditable",
  defaultchecked: "defaultChecked",
  for: "htmlFor",
  formnovalidate: "formNoValidate",
  hidefocus: "hideFocus",
  ismap: "isMap",
  maxlength: "maxLength",
  novalidate: "noValidate",
  readonly: "readOnly",
  rowspan: "rowSpan",
  spellcheck: "spellCheck",
  tabindex: "tabIndex",
  usemap: "useMap",
  willvalidate: "willValidate",
  // can add more attributes here as needed
} as const;

/**
 * Attribute duplicates map
 */
const ATTR_DUP = {
  enctype: "encoding",
  onscroll: "DOMMouseScroll",
  // can add more attributes here as needed
} as const;

/**
 * Attributes to be set via DOM
 */
const ATTR_DOM = {
  autocapitalize: 1,
  autocomplete: 1,
  autocorrect: 1,
  // can add more attributes here as needed
} as const;

/**
 * Boolean attribute map
 */
const ATTR_BOOL = {
  async: 1,
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  defer: 1,
  disabled: 1,
  formnovalidate: 1,
  hidden: 1,
  indeterminate: 1,
  ismap: 1,
  multiple: 1,
  novalidate: 1,
  readonly: 1,
  required: 1,
  spellcheck: 1,
  willvalidate: 1,
  // can add more attributes here as needed
} as const;

/**
 * Leading SGML line ending pattern
 */
const LEADING = /^[\r\n]+/;

/**
 * Trailing SGML line ending pattern
 */
const TRAILING = /[\r\n]+$/;

const NUL = 0;
const FUN = 1;
const ARY = 2;
const OBJ = 3;
const VAL = 4;

/**
 * Determines if the value is a function
 */
function isFunction(val: unknown): val is Function {
  return typeof val === "function";
}

function isHTMLElement(elem: unknown): elem is HTMLElement {
  return !!elem && typeof (elem as HTMLElement).tagName === "string";
}

/**
 * Determines the type of the value
 */
function getType(val: unknown): number {
  switch (typeof val) {
    case "object":
      return !val
        ? NUL
        : Array.isArray(val)
        ? ARY
        : val instanceof Date
        ? VAL
        : OBJ;
    case "function":
      return FUN;
    case "undefined":
      return NUL;
    default:
      return VAL;
  }
}

/**
 * Creates a DOM element
 */
function createElement(tag: ""): DocumentFragment;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement | DocumentFragment {
  if (!tag) {
    // create a document fragment to hold multiple-root elements
    if (document.createDocumentFragment) {
      return document.createDocumentFragment();
    }

    tag = "";
  } else if (tag.charAt(0) === "!") {
    // @ts-expect-error handle that
    return document.createComment(tag === "!" ? "" : tag.substr(1) + " ");
  }

  return document.createElement(tag);
}

/**
 * Appends an attribute to an element
 */
function addAttributes<E extends HTMLElement>(
  elem: E,
  attr: Record<string, unknown>
): E {
  // for each attributeName
  for (let name in attr) {
    if (attr.hasOwnProperty(name)) {
      // attributeValue
      let value = attr[name],
        type = getType(value);

      if (name) {
        if (type === NUL) {
          value = "";
          type = VAL;
        }

        // @ts-expect-error handle that
        name = ATTR_MAP[name.toLowerCase()] || name;

        if (name === "style") {
          if (getType(elem.style.cssText) !== NUL) {
            // @ts-expect-error handle that
            elem.style.cssText = value;
          } else {
            // @ts-expect-error handle that
            elem.style = value;
          }
        } else if (
          // @ts-expect-error handle that
          !ATTR_DOM[name.toLowerCase()] &&
          (type !== VAL ||
            name.charAt(0) === "$" ||
            // @ts-expect-error handle that
            getType(elem[name]) !== NUL ||
            // @ts-expect-error handle that
            getType(elem[ATTR_DUP[name]]) !== NUL)
        ) {
          // direct setting of existing properties
          // @ts-expect-error handle that
          elem[name] = value;

          // also set duplicated properties
          // @ts-expect-error handle that
          name = ATTR_DUP[name];
          if (name) {
            // @ts-expect-error handle that
            elem[name] = value;
          }
          // @ts-expect-error handle that
        } else if (ATTR_BOOL[name.toLowerCase()]) {
          if (value) {
            // boolean attributes
            elem.setAttribute(name, name);

            // also set duplicated attributes
            // @ts-expect-error handle that
            name = ATTR_DUP[name];
            if (name) {
              elem.setAttribute(name, name);
            }
          }
        } else {
          // http://www.quirksmode.org/dom/w3c_core.html#attributes

          // custom and 'data-*' attributes
          // @ts-expect-error handle that
          elem.setAttribute(name, value);

          // also set duplicated attributes
          // @ts-expect-error handle that
          name = ATTR_DUP[name];
          if (name) {
            // @ts-expect-error handle that
            elem.setAttribute(name, value);
          }
        }
      }
    }
  }
  return elem;
}

/**
 * Appends a child to an element
 */
function appendDOM(elem: HTMLElement | DocumentFragment, child: Node | null) {
  if (child) {
    // @ts-expect-error handle that
    const tag = (elem.tagName || "").toLowerCase();
    if (elem.nodeType === 8) {
      // comment
      if (child.nodeType === 3) {
        // text node
        // @ts-expect-error handle that
        elem.nodeValue += child.nodeValue;
      }
      // @ts-expect-error handle that
    } else if (tag === "table" && elem.tBodies) {
      // @ts-expect-error handle that
      if (!child.tagName) {
        // must unwrap documentFragment for tables
        if (child.nodeType === 11) {
          while (child.firstChild) {
            appendDOM(elem, child.removeChild(child.firstChild));
          }
        }
        return;
      }

      // in IE must explicitly nest TRs in TBODY
      // @ts-expect-error handle that
      const childTag = child.tagName.toLowerCase(); // child tagName
      if (childTag && childTag !== "tbody" && childTag !== "thead") {
        // insert in last tbody
        let tBody =
          // @ts-expect-error handle that
          elem.tBodies.length > 0
            ? // @ts-expect-error handle that
              elem.tBodies[elem.tBodies.length - 1]
            : null;
        if (!tBody) {
          tBody = createElement(childTag === "th" ? "thead" : "tbody");
          elem.appendChild(tBody);
        }
        tBody.appendChild(child);
        // @ts-expect-error handle that
      } else if (elem.canHaveChildren !== false) {
        elem.appendChild(child);
      }
      // @ts-expect-error handle that
    } else if (tag === "style" && document.createStyleSheet) {
      // IE requires this interface for styles
      // @ts-expect-error handle that
      elem.cssText = child;
      // @ts-expect-error handle that
    } else if (elem.canHaveChildren !== false) {
      elem.appendChild(child);
    } else if (
      tag === "object" &&
      // @ts-expect-error handle that
      child.tagName &&
      // @ts-expect-error handle that
      child.tagName.toLowerCase() === "param"
    ) {
      // IE-only path
      try {
        elem.appendChild(child);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (ex1) {
        /* empty */
      }
      try {
        // @ts-expect-error handle that
        if (elem.object) {
          // @ts-expect-error handle that
          elem.object[child.name] = child.value;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (ex2) {
        /* empty */
      }
    }
  }
}

/**
 * Tests a node for whitespace
 */
function isWhitespace(node: Node | null): node is Node {
  return (
    !!node &&
    node.nodeType === 3 &&
    (!node.nodeValue || !/\S/.exec(node.nodeValue))
  );
}

/**
 * Trims whitespace pattern from the text node
 *
 * @private
 * @param {Node} node The node
 */
function trimPattern(node: Node | null, pattern: RegExp): void {
  if (
    !!node &&
    node.nodeType === 3 &&
    node.nodeValue &&
    pattern.exec(node.nodeValue)
  ) {
    node.nodeValue = node.nodeValue?.replace(pattern, "") ?? "";
  }
}

/**
 * Removes leading and trailing whitespace nodes
 */
function trimWhitespace(elem: HTMLElement | DocumentFragment): void {
  if (elem) {
    while (isWhitespace(elem.firstChild)) {
      // trim leading whitespace text nodes
      elem.removeChild(elem.firstChild);
    }
    // trim leading whitespace text
    trimPattern(elem.firstChild, LEADING);
    while (isWhitespace(elem.lastChild)) {
      // trim trailing whitespace text nodes
      elem.removeChild(elem.lastChild);
    }
    // trim trailing whitespace text
    trimPattern(elem.lastChild, TRAILING);
  }
}

/**
 * Default error handler
 */
function onError(ex: Error): Text {
  return document.createTextNode("[" + ex + "]");
}

function handleObject<E extends HTMLElement | DocumentFragment>(
  elem: E,
  object: unknown
): E {
  const containerNode = createElement("span");
  let childNode;

  if (typeof object === "string") {
    containerNode.style = `color: #a11`;

    childNode = document.createTextNode(`"${object.trim()}"`);
  } else if (typeof object === "number") {
    containerNode.style = `color: #164`;

    childNode = document.createTextNode(String(object));
  } else if (object instanceof Date) {
    childNode = createElement("");
    const dateNode = createElement("span");
    dateNode.appendChild(document.createTextNode("Date: "));
    dateNode.style = `color: #164`;

    childNode.appendChild(dateNode);

    const valueNode = createElement("span");
    valueNode.appendChild(document.createTextNode(object.toString()));
    valueNode.style = `color: #a11`;

    childNode.appendChild(valueNode);
  } else if (object === null) {
    containerNode.style = `color: #708`;
    childNode = document.createTextNode("null");
  } else if (object === undefined) {
    containerNode.style = `color: #777777`;
    childNode = document.createTextNode("undefined");
  } else if (typeof object === "object") {
    childNode = document.createTextNode(JSON.stringify(object));
  } else if (typeof object === "function") {
    childNode = document.createTextNode(object.toString());
  } else if (typeof object === "symbol") {
    childNode = document.createTextNode(object.toString());
  }

  if (containerNode && childNode) {
    containerNode.appendChild(childNode);
    elem.appendChild(containerNode);
  }

  return elem;
}

function patch<E extends HTMLElement | DocumentFragment>(
  elem: E,
  jml: Array<unknown>
): E {
  for (let i = 1; i < jml.length; i++) {
    const item = jml[i];

    if (Array.isArray(item) || "string" === typeof item) {
      // append children
      appendDOM(elem, toHTML(item));
    } else if (
      "object" === typeof item &&
      item !== null &&
      isHTMLElement(elem)
      // elem.nodeType === 1
    ) {
      // add attributes
      if ("object" in item) {
        const { object, ...rest } = item;

        elem = addAttributes(elem, rest);
        elem = handleObject(elem, object);
      } else {
        // @ts-expect-error handle that
        elem = addAttributes(elem, item);
      }
    }
  }

  return elem;
}

/**
 * Main builder entry point
 */
export function toHTML(jml: "" | [], filter?: Function | undefined): null;
export function toHTML(
  jml: string | Array<unknown>,
  filter?: Function | undefined
): Node;
export function toHTML(
  jml: string | Array<unknown>,
  filter: Function | undefined = undefined
): Node | null {
  try {
    if (!jml) {
      return null;
    }
    if ("string" === typeof jml) {
      return document.createTextNode(jml);
    }

    if (!Array.isArray(jml) || "string" !== typeof jml[0]) {
      throw new SyntaxError("invalid JsonML");
    }

    const tagName = jml[0]; // tagName
    if (!tagName) {
      // correctly handle a list of JsonML trees
      // create a document fragment to hold elements
      const frag = createElement("");
      for (let i = 1; i < jml.length; i++) {
        // @ts-expect-error handle that
        appendDOM(frag, toHTML(jml[i], filter));
      }

      // trim extraneous whitespace
      trimWhitespace(frag);

      // eliminate wrapper for single nodes
      if (frag.childNodes.length === 1) {
        return frag.firstChild;
      }
      return frag;
    }

    const elem = patch(createElement(tagName), jml);

    // trim extraneous whitespace
    trimWhitespace(elem);
    return elem && isFunction(filter) ? filter(elem) : elem;
  } catch (ex) {
    // handle error with complete context
    return onError(ex instanceof Error ? ex : new Error("Unknown error"));
  }
}
