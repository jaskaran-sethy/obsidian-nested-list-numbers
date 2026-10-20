# Nested list numbers

An Obsidian plugin that shows parent numbers on nested numbered lists in Live Preview and Source mode, so `1.` under item 2.2 reads as `2.2.1.`.

The numbers are worked out from the whole note, not from the lines currently on screen, so they stay correct while scrolling.

## Install

Copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/nested-list-numbers/`, then enable **Nested list numbers** under *Settings → Community plugins*.

### Reading view

The plugin handles editing views only. For the same numbering in Reading view, copy [`snippets/nested-numbers.css`](snippets/nested-numbers.css) into `<vault>/.obsidian/snippets/` and turn it on under *Settings → Appearance → CSS snippets*.

## License

MIT
