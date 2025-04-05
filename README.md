# jsonml-html

JSONML-HTML is a JavaScript library that allows you to convert JSONML (JSON Markup Language) into HTML.

This library has been created to render the output of the DevTools console formatters, directly in the browser, in particular for the [immutable.js](https://immutable-js.com/) documentation and playground.

## Origin

It is based upon [jsonml.js](https://github.com/mckamey/jsonml) package, with some differences:

- It does handle the special `object` tag name, which is used in [console formatters to generate child objects](https://firefox-source-docs.mozilla.org/devtools-user/custom_formatters/index.html#generating-child-elements).
- It does not handle IE compatibility anymore.
- It dropped the `raw` function and the `Markup` class, and the specific error handling.
