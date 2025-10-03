import React from 'react';
import { NavLink } from 'react-router-dom';

const discoveries = [
  {
    id: 'discovery-1',
    type: 'Winery • 18 minutes away',
    title: 'The Secret Winery in Sonoma Hills',
    description: 'This family-owned winery has been hidden behind oak trees since 1947...',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHV9CF5eio40eppiv4YBYD7tteNrvJNs-tsR6vou-_VY85JWUmo3J3nzBHtqhpUM0mqtWf6hx1xnNUnF99CHEnbvmZGyiclzeZ0aAU2dh707KQc3e7VT99I6O_hQywX1-v_kPHARvw6k9yVfwFU1_H5xum0o-L0PdyuDe9X881Kd5sd7NjiIDBPi0L2i7-5GUuk_qwI4sUyWtKsv33m-k97baJsqiEzKSJ1eLZDkngc7Iksclc37IvsGftDwY-ih_H0P2_GETCRXA',
    favorite: false,
  },
  {
    id: 'discovery-2',
    type: 'Historical Site • 30 minutes away',
    title: 'The Ghost Town of Bodie',
    description:
      'Step back in time at this preserved ghost town, once a bustling gold mining hub...',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDeNbevMqUGUiWgpn_H1_U3-emKHRY00BlgxU2E0PYTaulMDR9Syzm3MN8XPyIyltNyxLTp_u5woRR3aOAAp865P0XUf4XoxeoB1M1jIRVj-y70yPE0qtDwbA0a1upkQP5nNleBim96B6UzNYr7-mRfS1WJBgXt7sr-cpYroMuTKckTZIIZiDSzTKwBsgGHhMd38x3MamdDA1STa0QaAM8Sj_lsGrOWuq0SACUN1qGuoM_r2gIbWP-98p8mpWaJWnpEQ4UiClK-UDg',
    favorite: true,
  },
  {
    id: 'discovery-3',
    type: 'Scenic Viewpoint • 45 minutes away',
    title: 'Vista Point Overlooking the Pacific',
    description:
      'Enjoy breathtaking panoramic views of the Pacific Ocean from this scenic viewpoint...',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMA60SD_i5aBTqJErwQVBf8nqOWT-fXhtoXYKZGmlp4zGDmwLQ6P-dGMRa0JzDe-dzAD3Qe83WpuQVvNKYRtlPqEY5UcflxFz9gskaFQPAmzwAlKDpSxNzph17PNepZ5J7UrjXpWQOcqdZW_TZJg556ThLM01zyHlF3m5cMUI2Xx2d27YD5yNLlmxuPJ7D8TWQHsB7heYAIjITuBGt3I0F02a1cr4Rxc6VYODDbb41ePO_-upNO3Qxc8CY6-m1QG8-yYCqQh9oKQU',
    favorite: false,
  },
];

export const DiscoveryScreen: React.FC = () => {
  return (
    <div
      className="flex min-h-screen flex-col bg-background-light font-display text-stone-900 dark:bg-background-dark dark:text-stone-100"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="mx-auto flex max-w-4xl items-center p-4">
          <button type="button" className="text-stone-700 dark:text-stone-300" aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-stone-900 dark:text-stone-100">
            Discoveries
          </h1>
          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl">
          <div className="px-4 pt-2">
            <div
              className="aspect-video w-full rounded-xl bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7Y9zo3v_SjyzQvXLYXEHIbmmKj5eFhc8SeNEHTXS-cih0yFnLNfSTkro7giZjHah-HyrDYMoeYsexzXG_ObnoKLfD5CuyrnGtJj0YNmv4PJY3N97nK93NvV9YgfPFwXY4gYaRMZRrCTwtO8GootCI24sKwmApnPVCafE4kPmSlhjykPqSQh-HQ9UWaW7KQbZKHtyU693CPHTeD5TrrqNTmpxjPdU3H57RPpoIwfuWPKFIUWTJbt5wSSv9oTTmeJsfW2TBp7Dtr_E")',
              }}
            />
          </div>

          <div className="px-4 pb-2 pt-6">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              Here’s what I discovered for you
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 pt-2 pb-4">
            <button
              type="button"
              className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Along your route
            </button>
            <button
              type="button"
              className="whitespace-nowrap rounded-full bg-background-light px-4 py-2 text-sm font-medium text-stone-700 dark:bg-primary/20 dark:text-stone-200"
            >
              By arrival time
            </button>
            <button
              type="button"
              className="whitespace-nowrap rounded-full bg-background-light px-4 py-2 text-sm font-medium text-stone-700 dark:bg-primary/20 dark:text-stone-200"
            >
              Most interesting
            </button>
          </div>

          <div className="space-y-4 p-4">
            {discoveries.map((item) => (
              <div key={item.id} className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{item.type}</p>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {item.title}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors dark:bg-primary/30"
                    >
                      <span className="material-symbols-outlined">play_arrow</span>
                      <span>Play</span>
                    </button>
                    <button
                      type="button"
                      className={`text-sm transition-colors ${item.favorite ? 'text-primary' : 'text-stone-400 dark:text-stone-500'}`}
                      aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <span className="material-symbols-outlined">
                        {item.favorite ? 'favorite' : 'favorite_border'}
                      </span>
                    </button>
                  </div>
                </div>
                <div
                  className="h-28 w-28 shrink-0 rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url("${item.image}")` }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="mx-auto flex max-w-4xl justify-around border-t border-primary/20 p-2">
          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/discoveries"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-full p-2 transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">compass_calibration</span>
            <span className="text-xs font-medium">Discoveries</span>
          </NavLink>
          <NavLink
            to="/memories"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">bookmark_border</span>
            <span className="text-xs font-medium">Memories</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
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

export default DiscoveryScreen;
