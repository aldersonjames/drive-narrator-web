import React from 'react';
import { NavLink } from 'react-router-dom';

const settingsSections = {
  account: [
    { label: 'Email', value: 'sophia.clark@email.com' },
    { label: 'Change Password' },
    { label: 'Profile Picture' },
  ],
  notifications: [
    { label: 'New Discovery Alerts', toggle: true },
    { label: 'Story Reminders', toggle: false },
    { label: 'Weekly Highlights', toggle: true },
  ],
  voice: [
    { label: 'Narrator Voice', value: 'Harbor Breeze (calm & reflective)' },
    { label: 'Assistant Voice', value: 'Northstar (crisp & present)' },
    { label: 'Playback Speed', value: 'Normal (1x)' },
  ],
  privacy: [
    { label: 'Data Usage' },
    { label: 'Location Permissions' },
    { label: 'Delete History' },
    { label: 'Version', value: '1.2.3' },
  ],
};

export const SettingsScreen: React.FC = () => {
  return (
    <div
      className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-background-light font-serif text-gray-800 dark:bg-background-dark dark:text-gray-200"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <div className="flex-grow">
        <header className="sticky top-0 z-10 flex items-center bg-background-light/80 p-4 pb-2 backdrop-blur-sm dark:bg-background-dark/80">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 dark:text-gray-300"
            aria-label="Go back"
          >
            <svg
              fill="currentColor"
              height="24"
              viewBox="0 0 256 256"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
            </svg>
          </button>
          <h1 className="flex-1 pr-10 text-center text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Settings
          </h1>
        </header>

        <main className="divide-y divide-gray-200/5 dark:divide-gray-800/10">
          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">ACCOUNT</h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-zinc-800">
              {settingsSections.account.map((item, index) => (
                <React.Fragment key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </span>
                      {item.value ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.value}
                        </span>
                      ) : null}
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400 dark:text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
                    </svg>
                  </button>
                  {index !== settingsSections.account.length - 1 ? (
                    <hr className="ml-4 border-t border-gray-200/10 dark:border-gray-700" />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              NOTIFICATIONS
            </h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-zinc-800">
              {settingsSections.notifications.map((item, index) => (
                <React.Fragment key={item.label}>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                    <label
                      className="relative inline-flex cursor-pointer items-center"
                      aria-label={item.label}
                    >
                      <input
                        type="checkbox"
                        defaultChecked={item.toggle}
                        className="peer sr-only"
                      />
                      <span className="sr-only">{item.label}</span>
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                    </label>
                  </div>
                  {index !== settingsSections.notifications.length - 1 ? (
                    <hr className="ml-4 border-t border-gray-200/10 dark:border-gray-700" />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              VOICE &amp; NARRATION
            </h2>
            <div className="mt-2 space-y-4">
              <div className="rounded-2xl bg-teal-900/60 p-4 text-white">
                <p className="text-sm uppercase tracking-wide text-amber-500">Narrator voice</p>
                <h3 className="mt-2 text-xl font-semibold">Harbor Breeze</h3>
                <p className="text-sm text-white/80">
                  Calm &amp; reflective — perfect for scenic storytelling.
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white"
                >
                  Preview voice
                </button>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 dark:bg-zinc-800/60">
                <p className="text-sm text-gray-500 dark:text-gray-400">Assistant voice</p>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Northstar</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Crisp &amp; present — for timely updates.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">PRIVACY</h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-zinc-800">
              {settingsSections.privacy.map((item, index) => (
                <React.Fragment key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-4 py-3"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                    {item.value ? (
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {item.value}
                      </span>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400 dark:text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
                      </svg>
                    )}
                  </button>
                  {index !== settingsSections.privacy.length - 1 ? (
                    <hr className="ml-4 border-t border-gray-200/10 dark:border-gray-700" />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </section>
        </main>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200/10 bg-background-light/90 pb-safe-bottom backdrop-blur-lg dark:border-gray-800/20 dark:bg-background-dark/90">
        <nav className="flex items-center justify-around px-2 pt-2">
          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M218.83,103.77l-80-75.48a16,16,0,0,0-21.66,0l-80,75.48A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77Z" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/discoveries"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm44.42-143.16-64,32a8.05,8.05,0,0,0-3.58,3.58l-32,64A8,8,0,0,0,80,184a8.1,8.1,0,0,0,3.58-.84l64-32a8.05,8.05,0,0,0,3.58-3.58l32-64a8,8,0,0,0-10.74-10.74ZM138,138,97.89,158.11,118,118l40.15-20.07Z" />
            </svg>
            <span className="text-xs font-medium">Discoveries</span>
          </NavLink>
          <NavLink
            to="/memories"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,16V161.57l-51.77-32.35a8,8,0,0,0-8.48,0L72,161.56V48ZM132.23,177.22a8,8,0,0,0-8.48,0L72,209.57V180.43l56-35,56,35v29.14Z" />
            </svg>
            <span className="text-xs font-medium">Memories</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                isActive
                  ? 'rounded-full bg-amber-500/10 text-amber-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M216,130.16q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </NavLink>
        </nav>
      </footer>
    </div>
  );
};

export default SettingsScreen;
