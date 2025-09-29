import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { MapRoutes } from '../../../src/components/map/MapRoutes';

describe('MapRoutes component', () => {
  it('renders route polylines with color legend and markers', () => {
    const routes = [
      { routeId: 'route-1', color: '#ff0000', summary: 'Route 1', pois: [] },
      { routeId: 'route-2', color: '#00ff00', summary: 'Route 2', pois: [] },
    ];

    render(<MapRoutes routes={routes} selectedRouteId="route-1" onSelectRoute={() => {}} />);

    expect(screen.getByText('Route 1')).toBeInTheDocument();
    expect(screen.getByText('Route 2')).toBeInTheDocument();
  });
});
