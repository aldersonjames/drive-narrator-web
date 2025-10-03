import React from 'react';

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
    <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-background-light font-serif text-gray-800 dark:bg-background-dark dark:text-gray-200">
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
    </div>
  );
};

export default SettingsScreen;
