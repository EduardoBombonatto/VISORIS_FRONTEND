export const CLINICAL_ALLOWED_ELEMENTS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'span',
  'div',
  'figure',
  'figcaption',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'sup',
  'sub',
];

export const CLINICAL_ALLOWED_ATTRIBUTES = [
  'class',
  'src',
  'alt',
  'width',
  'height',
  'colspan',
  'rowspan',
  'data-macro',
  'data-report-image',
  'data-src',
  'data-alt',
  'data-caption',
  'data-page-break',
];

const ALLOWED_ELEMENT_SET = new Set(CLINICAL_ALLOWED_ELEMENTS);
const ALLOWED_ATTR_SET = new Set(CLINICAL_ALLOWED_ATTRIBUTES);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;
  if (/^(https?:|blob:)/i.test(trimmed)) return true;
  if (/^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);/i.test(trimmed)) {
    return true;
  }
  return false;
}

function sanitizeNodeTree(root: DocumentFragment | HTMLElement): void {
  const walkerNodes: Node[] = [];
  const children = Array.from(root.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      if (!ALLOWED_ELEMENT_SET.has(tagName)) {
        // Remove elementos proibidos junto com seu conteúdo (alinhado ao Sanitizer API nativo)
        el.remove();
        continue;
      }

      for (const attr of Array.from(el.attributes)) {
        const attrName = attr.name.toLowerCase();
        if (!ALLOWED_ATTR_SET.has(attrName) || attrName.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }
        if ((attrName === 'src' || attrName === 'data-src') && !isSafeUrl(attr.value)) {
          el.removeAttribute(attr.name);
        }
      }

      walkerNodes.push(el);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
    }
  }

  for (const node of walkerNodes) {
    sanitizeNodeTree(node as HTMLElement);
  }
}

type ElementWithSetHTML = HTMLElement & {
  setHTML?: (
    input: string,
    options?: {
      sanitizer?: {
        elements?: string[];
        attributes?: string[];
      };
    },
  ) => void;
};

/**
 * Insere HTML sanitizado em um elemento DOM priorizando a Sanitizer API nativa
 * (`Element.prototype.setHTML`) e utilizando fallback DOM allowlist em navegadores sem suporte.
 */
export function setSafeHtml(container: HTMLElement, html: string): void {
  const target = container as ElementWithSetHTML;

  if (
    typeof Element !== 'undefined' &&
    'setHTML' in Element.prototype &&
    typeof target.setHTML === 'function'
  ) {
    target.setHTML(html, {
      sanitizer: {
        elements: CLINICAL_ALLOWED_ELEMENTS,
        attributes: CLINICAL_ALLOWED_ATTRIBUTES,
      },
    });
    return;
  }

  if (typeof DOMParser !== 'undefined') {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    sanitizeNodeTree(parsed.body);
    container.replaceChildren(...Array.from(parsed.body.childNodes));
    return;
  }

  container.textContent = html;
}
