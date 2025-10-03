import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useTripPlanner } from '../context/TripPlannerContext';

const profileId = 'traveler-001';

const IN_PROGRESS_STATUSES = new Set(['planned', 'draft', 'pending_deletion']);

export const TripsScreen: React.FC = () => {
  const { trips, loadTrips, isLoading } = useTripPlanner();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'in-progress' | 'completed'>('in-progress');

  useEffect(() => {
    void loadTrips(profileId).catch(() => undefined);
  }, [loadTrips]);

  const filteredTrips = useMemo(() => {
    if (!trips.length) return [];
    return trips.filter((trip) => {
      const isCompleted = trip.status === 'completed' || trip.status === 'archived';
      if (filter === 'completed') {
        return isCompleted;
      }
      return !isCompleted && IN_PROGRESS_STATUSES.has(trip.status);
    });
  }, [filter, trips]);

  const handleOpenTrip = (tripId: string) => {
    navigate('/voice', { state: { tripId } });
  };

  const renderStatusLabel = (status: string) => {
    if (status === 'completed') return 'Completed';
    if (status === 'planned') return 'Not started';
    if (status === 'draft') return 'Draft';
    if (status === 'pending_deletion') return 'Pending deletion';
    if (status === 'archived') return 'Archived';
    return 'In progress';
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-background-light font-display text-gray-800 dark:bg-background-dark dark:text-gray-200"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your Trips</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Resume an in-progress adventure or revisit completed journeys.
            </p>
          </div>
          <div className="flex gap-2 rounded-full bg-white/10 p-1 text-sm font-medium dark:bg-white/5">
            <button
              type="button"
              onClick={() => setFilter('in-progress')}
              className={`rounded-full px-3 py-1 transition-colors ${
                filter === 'in-progress'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`rounded-full px-3 py-1 transition-colors ${
                filter === 'completed'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {isLoading && !trips.length ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading trips…</p>
          ) : filteredTrips.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {filter === 'completed'
                ? 'No completed trips yet. Finish a journey to see it here.'
                : 'No trips in progress. Plan a new trip to get started.'}
            </p>
          ) : (
            <ul className="space-y-4">
              {filteredTrips.map((trip) => {
                const departureDate = new Date(trip.departureTime);
                const statusLabel = renderStatusLabel(trip.status);
                return (
                  <li
                    key={trip.tripId}
                    className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 shadow-sm ring-1 ring-white/10 backdrop-blur dark:bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-amber-500">
                          {statusLabel}
                        </p>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {trip.origin} → {trip.destination}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenTrip(trip.tripId)}
                        className="rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30"
                      >
                        Open
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Departure{' '}
                        {departureDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>{trip.interestTags.join(', ') || 'No interests set'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="mx-auto flex max-w-4xl justify-around border-t border-gray-200/10 p-2 dark:border-gray-800/20">
          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/discoveries"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">compass_calibration</span>
            <span className="text-xs font-medium">Discoveries</span>
          </NavLink>
          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-full p-2 transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">bookmark</span>
            <span className="text-xs font-medium">Trips</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-medium">Settings</span>
          </NavLink>
        </div>
      </footer>
    </div>
  );
};

export default TripsScreen;
