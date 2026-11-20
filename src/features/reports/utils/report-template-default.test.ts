import { describe, it, expect } from 'vitest';
import { buildDefaultReportHtml } from './report-template-default';

describe('buildDefaultReportHtml', () => {
  it('gera seções clínicas padrão com indicação, técnica, achados e conclusão', () => {
    const html = buildDefaultReportHtml({});

    expect(html).toContain('<h4>Indicação Clínica</h4>');
    expect(html).toContain('<h4>Técnica</h4>');
    expect(html).toContain('<h4>Achados</h4>');
    expect(html).toContain('<h4>Conclusão</h4>');
    expect(html).toContain('<h4>Recomendações</h4>');
  });

  it('ajusta o título dos achados para exames de endoscopia', () => {
    const html = buildDefaultReportHtml({
      procedureName: 'Endoscopia Respiratória',
    });

    expect(html).toContain('<h4>Achados Endoscópicos</h4>');
  });
});
