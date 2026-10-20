/*
 * Nested list numbers
 * Shows parent numbers in front of nested numbered list items in
 * Live Preview and Source mode, e.g. "1." under item 2.2 shows as "2.2.1.".
 *
 * Numbers are worked out from the whole note, not from the lines
 * currently on screen, so they stay correct while scrolling.
 * Reading view is handled by the nested-numbers.css snippet.
 */
const { Plugin } = require("obsidian");
const { ViewPlugin, Decoration } = require("@codemirror/view");
const { RangeSetBuilder } = require("@codemirror/state");

const LIST_ITEM = /^([ \t]*)(?:(\d+)[.)]|[-*+])(?:[ \t]|$)/;
const LEADING_WS = /^[ \t]*/;
const FENCE = /^[ \t]*(```|~~~)/;

function indentWidth(ws, tabSize) {
  let width = 0;
  for (const ch of ws) width += ch === "\t" ? tabSize - (width % tabSize) : 1;
  return width;
}

// Map of line number -> { from, to, text } for every numbered item that has
// numbered parents. from/to cover the typed number ("1."), and text is the
// parents' numbers, e.g. "2.2.".
function computePrefixes(doc, tabSize) {
  const prefixes = new Map();
  let stack = []; // open list items: { indent, num } (num is null for bullets)
  let inCodeBlock = false;

  for (let n = 1; n <= doc.lines; n++) {
    const line = doc.line(n);
    const text = line.text;

    if (FENCE.test(text)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = LIST_ITEM.exec(text);
    if (!match) {
      if (text.trim() === "") continue;
      // Unindented text that isn't a list item ends the list.
      if (indentWidth(LEADING_WS.exec(text)[0], tabSize) === 0) stack = [];
      continue;
    }

    const indent = indentWidth(match[1], tabSize);
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();

    const num = match[2] === undefined ? null : match[2];
    if (num !== null) {
      const parents = [];
      for (let i = stack.length - 1; i >= 0 && stack[i].num !== null; i--) {
        parents.unshift(stack[i].num);
      }
      if (parents.length) {
        const from = line.from + match[1].length;
        prefixes.set(n, { from, to: from + num.length + 1, text: parents.join(".") + "." });
      }
    }
    stack.push({ indent, num });
  }
  return prefixes;
}

const nestedNumbers = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.doc = null;
      this.prefixes = new Map();
      this.decorations = this.build(view);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.build(update.view);
      }
    }
    build(view) {
      const { doc } = view.state;
      if (doc !== this.doc) {
        this.prefixes = computePrefixes(doc, view.state.tabSize);
        this.doc = doc;
      }
      const builder = new RangeSetBuilder();
      for (const { from, to } of view.visibleRanges) {
        const last = doc.lineAt(to).number;
        for (let n = doc.lineAt(from).number; n <= last; n++) {
          const prefix = this.prefixes.get(n);
          if (prefix) {
            builder.add(
              prefix.from,
              prefix.to,
              Decoration.mark({
                class: "nested-list-number",
                attributes: { "data-nested-prefix": prefix.text },
              })
            );
          }
        }
      }
      return builder.finish();
    }
  },
  { decorations: (v) => v.decorations }
);

module.exports = class NestedListNumbers extends Plugin {
  onload() {
    this.registerEditorExtension(nestedNumbers);
  }
};

module.exports.computePrefixes = computePrefixes;
