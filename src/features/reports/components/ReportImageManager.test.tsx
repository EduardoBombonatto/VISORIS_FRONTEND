import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReportImageResponse } from '@/api/index.schemas';
import ReportImageManager from './ReportImageManager';

const sampleImages: ReportImageResponse[] = [
  {
    id: 'img-1',
    reportId: 'rep-1',
    imageUrl: 'data:image/jpeg;base64,abc',
    caption: 'Esôfago distal sem alterações',
    displayOrder: 1,
    createdAt: '2026-10-21T10:00:00Z',
  },
  {
    id: 'img-2',
    reportId: 'rep-1',
    imageUrl: 'data:image/jpeg;base64,def',
    caption: 'Pequena hérnia hiatal',
    displayOrder: 2,
    createdAt: '2026-10-21T10:01:00Z',
  },
];

describe('ReportImageManager Component', () => {
  it('exibe a contagem de fotos e renderiza a galeria ordenada por displayOrder sem campos de URL manual', () => {
    const onAddImage = vi.fn().mockResolvedValue(undefined);
    render(
      <ReportImageManager
        appointmentId="101"
        images={[sampleImages[1], sampleImages[0]]}
        onAddImage={onAddImage}
      />,
    );

    expect(screen.getByText('2 fotos')).toBeInTheDocument();
    expect(screen.getByText('Foto 01')).toBeInTheDocument();
    expect(screen.getByText('Foto 02')).toBeInTheDocument();
    expect(screen.queryByLabelText(/url da imagem/i)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Esôfago distal sem alterações')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pequena hérnia hiatal')).toBeInTheDocument();
  });

  it('adiciona fotos em memória imediatamente ao selecionar arquivos na dropzone', async () => {
    const onAddImage = vi.fn().mockResolvedValue(undefined);
    render(<ReportImageManager appointmentId="101" images={[]} onAddImage={onAddImage} />);

    const fileInput = screen.getByLabelText(/selecionar arquivo de imagem/i);
    const file = new File(['dummy-image-bytes'], 'endoscopia-antro.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onAddImage).toHaveBeenCalledTimes(1);
    });

    const addedArg = onAddImage.mock.calls[0][0] as {
      image_url: string;
      display_order: number;
    };
    expect(addedArg.image_url).toBeTruthy();
    expect(addedArg.display_order).toBe(1);
  });

  it('permite editar a legenda inline no card e excluir uma foto da galeria', () => {
    const onAddImage = vi.fn().mockResolvedValue(undefined);
    const onUpdateCaption = vi.fn();
    const onRemoveImage = vi.fn();

    render(
      <ReportImageManager
        appointmentId="101"
        images={sampleImages}
        onAddImage={onAddImage}
        onUpdateImageCaption={onUpdateCaption}
        onRemoveImage={onRemoveImage}
      />,
    );

    const captionInput = screen.getByLabelText('Legenda da Foto 01');
    fireEvent.change(captionInput, {
      target: { value: 'Esôfago com gastrite leve' },
    });
    expect(onUpdateCaption).toHaveBeenCalledWith('img-1', 'Esôfago com gastrite leve');

    const removeBtn = screen.getByRole('button', { name: 'Excluir Foto 01' });
    fireEvent.click(removeBtn);
    expect(onRemoveImage).toHaveBeenCalledWith('img-1');
  });

  it('permite inserir uma foto na Folha A4 com 1 clique ou reordenar a galeria', () => {
    const onAddImage = vi.fn().mockResolvedValue(undefined);
    const onInsertImageToEditor = vi.fn();
    const onReorder = vi.fn();

    render(
      <ReportImageManager
        appointmentId="101"
        images={sampleImages}
        onAddImage={onAddImage}
        onInsertImageToEditor={onInsertImageToEditor}
        onReorderImages={onReorder}
      />,
    );

    const insertButtons = screen.getAllByRole('button', {
      name: /inserir foto .* na folha a4/i,
    });
    fireEvent.click(insertButtons[0]);
    expect(onInsertImageToEditor).toHaveBeenCalledTimes(1);
    expect(onInsertImageToEditor.mock.calls[0][1]).toBe('Foto 01');

    const moveDownButtons = screen.getAllByRole('button', {
      name: /mover foto .* para baixo/i,
    });
    fireEvent.click(moveDownButtons[0]);
    expect(onReorder).toHaveBeenCalledTimes(1);
    const reorderedArg = onReorder.mock.calls[0][0] as ReportImageResponse[];
    expect(reorderedArg[0].id).toBe('img-2');
    expect(reorderedArg[1].id).toBe('img-1');
  });
});
