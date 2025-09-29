import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { TripPlannerPage } from '../../src/pages/TripPlannerPage';

expect.extend(toHaveNoViolations);

describe('TripPlannerPage accessibility', () => {
  it('meets baseline WCAG assertions', async () => {
    const { container } = render(<TripPlannerPage />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
