import { formatTime } from '../format';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState, Modal, StatusBadge } from './ui';
import { SyntheticScene } from './SyntheticScene';
import { translations } from '../i18n';
const t = (key: keyof typeof translations.en) => translations.en[key];
describe('operator states', () => {
  it('uses words as well as color for status', () => {
    render(<StatusBadge status="offline" t={t} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
  it('offers recovery from an error', async () => {
    const retry = vi.fn();
    render(
      <EmptyState
        title="No cameras"
        description="Try another filter"
        action={<button onClick={retry}>Retry</button>}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it('labels unavailable synthetic media honestly', () => {
    render(
      <SyntheticScene
        unavailable
        label="Synthetic preview"
        unavailableLabel="Preview unavailable"
      />,
    );
    expect(screen.getByText('Preview unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
  it('identifies generated scenes as illustrations', () => {
    render(<SyntheticScene label="Synthetic preview" unavailableLabel="Unavailable" />);
    expect(screen.getByRole('img', { name: 'Synthetic preview' })).toBeInTheDocument();
  });
  it('treats naive backend timestamps as UTC', () => {
    expect(formatTime('2026-11-02T10:30:00', 'en')).toBe('10:30 UTC');
    expect(formatTime(null, 'en')).toBe('—');
  });
  it('provides a named dismissible dialog', async () => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn();
    const close = vi.fn();
    render(
      <Modal title="Camera details" close={close} t={t}>
        <p>Details</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Camera details' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(close).toHaveBeenCalled();
  });
});
