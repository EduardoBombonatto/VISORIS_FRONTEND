import { Node, mergeAttributes } from '@tiptap/core';

export const ReportImage = Node.create({
  name: 'reportImage',
  group: 'block',
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-src') ||
          element.querySelector('img')?.getAttribute('src') ||
          '',
        renderHTML: (attributes) => ({
          'data-src': attributes.src,
        }),
      },
      alt: {
        default: 'Foto do Exame',
        parseHTML: (element) =>
          element.getAttribute('data-alt') ||
          element.querySelector('img')?.getAttribute('alt') ||
          'Foto do Exame',
        renderHTML: (attributes) => ({
          'data-alt': attributes.alt,
        }),
      },
      caption: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute('data-caption') ||
          element.querySelector('figcaption')?.textContent?.trim() ||
          '',
        renderHTML: (attributes) => ({
          'data-caption': attributes.caption || '',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-report-image]',
      },
      {
        tag: 'figure.report-figure',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes['data-src'] || HTMLAttributes.src || '';
    const alt = HTMLAttributes['data-alt'] || HTMLAttributes.alt || 'Foto do Exame';
    const caption = HTMLAttributes['data-caption'] || HTMLAttributes.caption || '';

    const captionLabel = caption ? `${alt} — ${caption}` : alt;

    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        class: 'report-figure',
        'data-report-image': 'true',
      }),
      [
        'img',
        {
          src,
          alt: captionLabel,
          class: 'report-figure-img',
        },
      ],
      [
        'figcaption',
        {
          class: 'report-figure-caption',
        },
        captionLabel,
      ],
    ];
  },
});
