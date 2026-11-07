import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NewShowEditor } from '../components/NewShowEditor';

describe('editor click-to-focus', () => {
  it('focuses the textarea when clicking the empty area of the editor box', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NewShowEditor showType="text" onCancel={() => {}} onSave={() => {}} onBackToTypeSelection={() => {}} />
      </MemoryRouter>,
    );
    const textarea = screen.getByRole('textbox');
    const box = textarea.closest('.border-gray-300') as HTMLElement;
    expect(textarea).not.toHaveFocus();

    await user.click(box);

    expect(textarea).toHaveFocus();
  });
});
