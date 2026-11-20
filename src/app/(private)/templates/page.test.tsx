import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TemplatesPage from './page';

vi.mock('@/features/templates/components/TemplateWorkspace', () => ({
  default: () => <div data-testid="mock-template-workspace">Template Workspace Mock</div>,
}));

describe('TemplatesPage', () => {
  it('renderiza o TemplateWorkspace', () => {
    render(<TemplatesPage />);
    expect(screen.getByTestId('mock-template-workspace')).toBeInTheDocument();
  });
});
