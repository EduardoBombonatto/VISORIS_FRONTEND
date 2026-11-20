export interface BuildDefaultReportParams {
  procedureName?: string | null;
  patientName?: string | null;
  species?: string | null;
  breed?: string | null;
  gender?: string | null;
  age?: string | null;
  birthDate?: string | null;
  clientName?: string | null;
  solicitante?: string | null;
  scheduledAt?: string | null;
  doctorName?: string | null;
  doctorCrmv?: string | null;
}

export function buildDefaultReportHtml(params: BuildDefaultReportParams = {}): string {
  const isEndoscopy = params.procedureName?.toLowerCase().includes('endoscop') ?? false;
  const achadosTitle = isEndoscopy ? 'Achados Endoscópicos' : 'Achados';

  return `<h4>Indicação Clínica</h4>
<p>[Informações recebidas com a solicitação do exame]</p>

<h4>Técnica</h4>
<p>[Tipo de exame, região avaliada e informações técnicas relevantes]</p>

<h4>${achadosTitle}</h4>
<p>[Descrição organizada dos achados observados]</p>

<h4>Conclusão</h4>
<p>[Síntese coerente com os achados descritos]</p>

<h4>Recomendações</h4>
<p>[Preencher quando aplicável]</p>`;
}
