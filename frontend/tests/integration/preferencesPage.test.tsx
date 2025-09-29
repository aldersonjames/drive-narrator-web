import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PreferencesPage } from '../../src/pages/PreferencesPage';

describe('PreferencesPage integration', () => {
  it('allows selecting voices, toggling transcripts, and persists state', async () => {
    const user = userEvent.setup();

    render(<PreferencesPage />);

    await user.selectOptions(screen.getByLabelText(/assistant voice/i), ['assistant-calm']);
    await user.selectOptions(screen.getByLabelText(/narration voice/i), ['narrator-story']);
    await user.click(screen.getByLabelText(/save transcripts/i));

    expect(screen.getByRole('alert')).toHaveTextContent(/saved/);
  });
});
