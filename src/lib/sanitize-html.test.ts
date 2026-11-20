import { describe, expect, it, vi } from 'vitest';
import { escapeHtml, setSafeHtml } from './sanitize-html';

describe('sanitize-html', () => {
  it('escapa caracteres especiais de HTML com escapeHtml', () => {
    expect(escapeHtml('Foto "01" <script>&\'test\'')).toBe(
      'Foto &quot;01&quot; &lt;script&gt;&amp;&#39;test&#39;',
    );
  });

  it('remove scripts, handlers inline e URLs javascript: preservando marcação clínica', () => {
    const container = document.createElement('div');
    const dirty = `
      <h2>Achados Endoscópicos</h2>
      <p onclick="alert(1)">Mucosa íntegra <strong>sem lesões</strong>.</p>
      <script>window.__xss = true;</script>
      <img src="javascript:alert(1)" onerror="alert(2)" alt="malicioso" />
      <figure class="report-figure" data-report-image="true">
        <img src="data:image/png;base64,iVBORw0KGgo=" alt="Foto 01" />
        <figcaption>Esôfago distal</figcaption>
      </figure>
    `;

    setSafeHtml(container, dirty);

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('h2')?.textContent).toBe('Achados Endoscópicos');
    const paragraph = container.querySelector('p');
    expect(paragraph?.getAttribute('onclick')).toBeNull();
    expect(paragraph?.querySelector('strong')?.textContent).toBe('sem lesões');

    const imgs = container.querySelectorAll('img');
    expect(imgs[0]?.getAttribute('src')).toBeNull();
    expect(imgs[0]?.getAttribute('onerror')).toBeNull();
    expect(imgs[1]?.getAttribute('src')).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('usa Element.prototype.setHTML nativo quando disponível no navegador', () => {
    const container = document.createElement('div');
    const setHtmlSpy = vi.fn();
    Object.defineProperty(Element.prototype, 'setHTML', {
      configurable: true,
      writable: true,
      value: setHtmlSpy,
    });

    try {
      setSafeHtml(container, '<p>Laudo seguro</p>');
      expect(setHtmlSpy).toHaveBeenCalledTimes(1);
      expect(setHtmlSpy).toHaveBeenCalledWith(
        '<p>Laudo seguro</p>',
        expect.objectContaining({
          sanitizer: expect.objectContaining({
            elements: expect.arrayContaining(['p', 'figure', 'img']),
            attributes: expect.arrayContaining(['class', 'src', 'alt']),
          }),
        }),
      );
    } finally {
      delete (Element.prototype as unknown as Record<string, unknown>).setHTML;
    }
  });
});
