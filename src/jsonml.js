/**
 * Attribute name map
 *
 * @private
 * @constant
 * @type {Object.<string>}
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
};

/**
 * Attribute duplicates map
 *
 * @private
 * @constant
 * @type {Object.<string>}
 */
const ATTR_DUP = {
  enctype: "encoding",
  onscroll: "DOMMouseScroll",
  // can add more attributes here as needed
};

/**
 * Attributes to be set via DOM
 *
 * @private
 * @constant
 * @type {Object.<number>}
 */
const ATTR_DOM = {
  autocapitalize: 1,
  autocomplete: 1,
  autocorrect: 1,
  // can add more attributes here as needed
};

/**
 * Boolean attribute map
 *
 * @private
 * @constant
 * @type {Object.<number>}
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
};

/**
 * Leading SGML line ending pattern
 *
 * @private
 * @constant
 * @type {RegExp}
 */
const LEADING = /^[\r\n]+/;

/**
 * Trailing SGML line ending pattern
 *
 * @private
 * @constant
 * @type {RegExp}
 */
const TRAILING = /[\r\n]+$/;

/**
 * @private
 * @const
 * @type {number}
 */
const NUL = 0;

/**
 * @private
 * @const
 * @type {number}
 */
const FUN = 1;

/**
 * @private
 * @const
 * @type {number}
 */
const ARY = 2;

/**
 * @private
 * @const
 * @type {number}
 */
const OBJ = 3;

/**
 * @private
 * @const
 * @type {number}
 */
const VAL = 4;

/**
 * Determines if the value is a function
 *
 * @private
 * @param {*} val the object being tested
 * @return {boolean}
 */
function isFunction(val) {
  return typeof val === "function";
}

/**
 * Determines the type of the value
 *
 * @private
 * @param {*} val the object being tested
 * @return {number}
 */
function getType(val) {
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
 *
 * @private
 * @param {string} tag The element's tag name
 * @return {Node}
 */
function createElement(tag) {
  if (!tag) {
    // create a document fragment to hold multiple-root elements
    if (document.createDocumentFragment) {
      return document.createDocumentFragment();
    }

    tag = "";
  } else if (tag.charAt(0) === "!") {
    return document.createComment(tag === "!" ? "" : tag.substr(1) + " ");
  }

  return document.createElement(tag);
}

/**
 * Appends an attribute to an element
 *
 * @private
 * @param {Node} elem The element
 * @param {Object} attr Attributes object
 * @return {Node}
 */
function addAttributes(elem, attr) {
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

        name = ATTR_MAP[name.toLowerCase()] || name;

        if (name === "style") {
          if (getType(elem.style.cssText) !== NUL) {
            elem.style.cssText = value;
          } else {
            elem.style = value;
          }
        } else if (
          !ATTR_DOM[name.toLowerCase()] &&
          (type !== VAL ||
            name.charAt(0) === "$" ||
            getType(elem[name]) !== NUL ||
            getType(elem[ATTR_DUP[name]]) !== NUL)
        ) {
          // direct setting of existing properties
          elem[name] = value;

          // also set duplicated properties
          name = ATTR_DUP[name];
          if (name) {
            elem[name] = value;
          }
        } else if (ATTR_BOOL[name.toLowerCase()]) {
          if (value) {
            // boolean attributes
            elem.setAttribute(name, name);

            // also set duplicated attributes
            name = ATTR_DUP[name];
            if (name) {
              elem.setAttribute(name, name);
            }
          }
        } else {
          // http://www.quirksmode.org/dom/w3c_core.html#attributes

          // custom and 'data-*' attributes
          elem.setAttribute(name, value);

          // also set duplicated attributes
          name = ATTR_DUP[name];
          if (name) {
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
 *
 * @private
 * @param {Node} elem The parent element
 * @param {Node} child The child
 */
function appendDOM(elem, child) {
  if (child) {
    const tag = (elem.tagName || "").toLowerCase();
    if (elem.nodeType === 8) {
      // comment
      if (child.nodeType === 3) {
        // text node
        elem.nodeValue += child.nodeValue;
      }
    } else if (tag === "table" && elem.tBodies) {
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
      const childTag = child.tagName.toLowerCase(); // child tagName
      if (childTag && childTag !== "tbody" && childTag !== "thead") {
        // insert in last tbody
        let tBody =
          elem.tBodies.length > 0
            ? elem.tBodies[elem.tBodies.length - 1]
            : null;
        if (!tBody) {
          tBody = createElement(childTag === "th" ? "thead" : "tbody");
          elem.appendChild(tBody);
        }
        tBody.appendChild(child);
      } else if (elem.canHaveChildren !== false) {
        elem.appendChild(child);
      }
    } else if (tag === "style" && document.createStyleSheet) {
      // IE requires this interface for styles
      elem.cssText = child;
    } else if (elem.canHaveChildren !== false) {
      elem.appendChild(child);
    } else if (
      tag === "object" &&
      child.tagName &&
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
        if (elem.object) {
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
 *
 * @private
 * @param {Node} node The node
 * @return {boolean}
 */
function isWhitespace(node) {
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
function trimPattern(node, pattern) {
  if (!!node && node.nodeType === 3 && pattern.exec(node.nodeValue)) {
    node.nodeValue = node.nodeValue.replace(pattern, "");
  }
}

/**
 * Removes leading and trailing whitespace nodes
 *
 * @private
 * @param {Node} elem The node
 */
function trimWhitespace(elem) {
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
 * @param {Error} ex
 * @return {Node}
 */
function onError(ex) {
  return document.createTextNode("[" + ex + "]");
}

function handleObject(elem, object) {
  const containerNode = createElement("span");
  let childNode;

  if (typeof object === "string") {
    containerNode.style = `color: #a11`;

    childNode = document.createTextNode(`"${object.trim()}"`);
  } else if (typeof object === "number") {
    containerNode.style = `color: #164`;

    childNode = document.createTextNode(object);
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

/* override this to perform custom error handling during binding */
// exports.onerror = null;

/**
 * also used by JsonML.BST
 * @param {Node} elem
 * @param {*} jml
 * @return {Node}
 */
function patch(elem, jml) {
  for (let i = 1; i < jml.length; i++) {
    if (Array.isArray(jml[i]) || "string" === typeof jml[i]) {
      // append children
      appendDOM(elem, toHTML(jml[i]));
    } else if (
      "object" === typeof jml[i] &&
      jml[i] !== null &&
      elem.nodeType === 1
    ) {
      // add attributes
      const { object, ...rest } = jml[i];

      if ("object" in jml[i]) {
        const { object, ...rest } = jml[i];

        elem = handleObject(elem, object);
        elem = addAttributes(elem, rest);
      } else {
        elem = addAttributes(elem, jml[i]);
      }
    }
  }

  return elem;
}

/**
 * Main builder entry point
 * @param {string|array} jml
 * @param {?function} filter
 * @return {Node}
 */
export function toHTML(jml, filter = undefined) {
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
    return onError(ex);
  }
}
