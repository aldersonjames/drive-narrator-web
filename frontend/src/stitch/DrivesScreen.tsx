import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppNavigation from '../components/navigation/AppNavigation';
import { useDrivePlanner } from '../context/DrivePlannerContext';

const profileId = 'traveler-001';

const IN_PROGRESS_STATUSES = new Set(['planned', 'draft', 'pending_deletion']);

export const DrivesScreen: React.FC = () => {
  const { drives, loadDrives, isLoading } = useDrivePlanner();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'in-progress' | 'completed'>('in-progress');

  useEffect(() => {
    void loadDrives(profileId).catch(() => undefined);
  }, [loadDrives]);

  const filteredDrives = useMemo(() => {
    if (!drives.length) return [];
    return drives.filter((drive) => {
      const isCompleted = drive.status === 'completed' || drive.status === 'archived';
      if (filter === 'completed') {
        return isCompleted;
      }
      return !isCompleted && IN_PROGRESS_STATUSES.has(drive.status);
    });
  }, [filter, drives]);

  const handleOpenDrive = (driveId: string) => {
    navigate('/voice', { state: { driveId } });
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
      {/* Top Navigation */}
      <AppNavigation position="top" />
      
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-white">Your Drives</h1>
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
          {isLoading && !drives.length ? (
            <p className="text-center text-white/60">Loading drives…</p>
          ) : filteredDrives.length === 0 ? (
            <p className="text-center text-white/60">
              {filter === 'completed'
                ? 'No completed drives yet. Finish a journey to see it here.'
                : 'No drives in progress. Plan a new drive to get started.'}
            </p>
          ) : (
            <ul className="space-y-4">
              {filteredDrives.map((drive) => {
                const departureDate = new Date(drive.departureTime);
                const statusLabel = renderStatusLabel(drive.status);
                return (
                  <li
                    key={drive.driveId}
                    className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 shadow-sm ring-1 ring-white/10 backdrop-blur dark:bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-amber-500">
                          {statusLabel}
                        </p>
                        <h2 className="text-lg font-semibold text-white">
                          {drive.origin} → {drive.destination}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDrive(drive.driveId)}
                        className="rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30"
                      >
                        Open
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-white/60">
                      <span>
                        Departure{' '}
                        {departureDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>{drive.interestTags.join(', ') || 'No interests set'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="sticky bottom-0 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <AppNavigation position="bottom" />
      </footer>
    </div>
  );
};

export default DrivesScreen;
