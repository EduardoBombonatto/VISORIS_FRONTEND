import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Insere uma quebra de página (nova Folha A4) no documento
       */
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-page-break]',
      },
      {
        tag: 'div.report-page-break',
      },
      {
        tag: 'hr.page-break',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'report-page-break',
        'data-page-break': 'true',
      }),
      ['span', { class: 'report-page-break-label' }, '--- Quebra de Página (Nova Folha A4) ---'],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent([
              {
                type: this.name,
              },
              {
                type: 'paragraph',
              },
            ])
            .focus()
            .run();
        },
    };
  },
});
