import { Node, mergeAttributes } from '@tiptap/core';

export const MacroTag = Node.create({
  name: 'macroTag',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      label: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-label') || element.textContent?.trim() || '',
        renderHTML: (attributes) => ({
          'data-label': attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.macro-tag',
      },
      {
        tag: 'span[data-macro]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes['data-label'] || HTMLAttributes.label || '';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'macro-tag',
        'data-macro': 'true',
      }),
      label,
    ];
  },
});
