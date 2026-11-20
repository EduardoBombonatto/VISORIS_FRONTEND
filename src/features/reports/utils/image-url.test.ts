import { describe, expect, it } from 'vitest';
import type { ReportImageResponse } from '@/api/index.schemas';
import { buildSimulatedImageUrl, getNextDisplayOrder, sortImagesByDisplayOrder } from './image-url';
import { MAX_IMAGE_URL_LENGTH } from '../schemas/report-schema';

describe('image-url utilities', () => {
  it('gera uma URL simulada válida com no máximo 1024 caracteres a partir de arquivo local', () => {
    const longFileName = `${'captura_endoscopia_'.repeat(30)}.png`;
    const url = buildSimulatedImageUrl('99887766', longFileName, 1700000000000);

    expect(url).toMatch(/^\/api\/uploads\/99887766-/);
    expect(url.length).toBeLessThanOrEqual(MAX_IMAGE_URL_LENGTH);
  });

  it('ordena imagens de forma crescente pelo displayOrder', () => {
    const unsorted: ReportImageResponse[] = [
      {
        id: '2',
        reportId: '10',
        imageUrl: 'https://example.com/2.jpg',
        caption: 'Segunda',
        displayOrder: 2,
        createdAt: '2026-10-21T10:00:00Z',
      },
      {
        id: '1',
        reportId: '10',
        imageUrl: 'https://example.com/1.jpg',
        caption: 'Primeira',
        displayOrder: 1,
        createdAt: '2026-10-21T10:00:00Z',
      },
      {
        id: '3',
        reportId: '10',
        imageUrl: 'https://example.com/3.jpg',
        caption: 'Terceira',
        displayOrder: 3,
        createdAt: '2026-10-21T10:00:00Z',
      },
    ];

    const sorted = sortImagesByDisplayOrder(unsorted);
    expect(sorted.map((img) => img.id)).toEqual(['1', '2', '3']);
  });

  it('calcula o próximo displayOrder sequencial sugerido', () => {
    expect(getNextDisplayOrder([])).toBe(1);
    expect(
      getNextDisplayOrder([
        {
          id: '1',
          reportId: '10',
          imageUrl: 'https://example.com/1.jpg',
          displayOrder: 3,
          createdAt: '2026-10-21T10:00:00Z',
        },
      ]),
    ).toBe(4);
  });
});
