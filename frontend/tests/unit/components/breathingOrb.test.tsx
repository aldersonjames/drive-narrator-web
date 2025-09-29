import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BreathingOrb } from '../../../src/components/voice/BreathingOrb';

describe('BreathingOrb component', () => {
  it('announces listening and speaking states via aria-live region', async () => {
    const user = userEvent.setup();

    render(<BreathingOrb state="idle" />);

    expect(screen.getByRole('status')).toHaveTextContent(/ready/i);

    await user.click(screen.getByRole('button', { name: /start listening/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/listening/i);

    await user.click(screen.getByRole('button', { name: /start speaking/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/speaking/i);
  });
});
