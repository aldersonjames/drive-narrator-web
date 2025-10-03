import React from 'react';
import { NavLink } from 'react-router-dom';

const memories = [
  {
    id: 'memory-1',
    title: 'Journey to the Coast',
    date: 'Aug 12-15, 2023',
    stories: '12 stories discovered',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDr55VsEzkGYJ624KBuPqi9wHigczE_AVFQxm_jd0LxpSbzPxH3EqarVlmI2eCIhNqG2pVUCzuQRHR6S-l6ooeKi-G29Ul9dXdmdriMGbpueyajB_Ucbqb7ALTJgo-j1CXCSkNQfTVuAujbadNPib1TAC8aOwBpjvVkQRHutJoFG0YoL3eoMRjAIHpYSUCCW4H6GCqigCZL_WmuJHGZLDZjtgfd3iHswZC5B9y51gvE7VkKlLQSD8TBh_yCUQz9OuMPt41n3eYjN_k',
  },
  {
    id: 'memory-2',
    title: 'Mountain Escape',
    date: 'Jul 20-23, 2023',
    stories: '8 stories discovered',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4FV1iXgkL5ISDFMQRwZpxTSB2KKzWAVZHbA0ahxkIYaiVwKI22Mwz4MoXTvVOFpydt10xvG_c7ej4IQoViJSTDfAr0AN_Ci4KWEKQtI_-n1ql9tl9OaoNtrrlKwRmHhSXOAK-EmP1LTkOzHy_P48ANvSGyfmZUAP-IJz-k0MZmA10WPM6QLxE9bWS-1A5J8Swq2_6wH5OUISW8IdmlJQSy6isORpYJtThqn1Jl2-0a8Amlq0MXukpYO6QXFatVB-E-8TQRmV2jYs',
  },
  {
    id: 'memory-3',
    title: 'City Exploration',
    date: 'Jun 5-7, 2023',
    stories: '15 stories discovered',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBtK7mY9lBYUgtFx5Ce22E4MQLE4TxIYMenAtkgoWYyn_haldWBi3bEO5O72yvNcNagyNz6Vfd0qNREI2mh4H0hRWi93yIbJ4JkutvZmuWD_1RVM2kyUut8QzIwpQYVF4rr9NrPap1zXq_Dz18m1HLkEC4dvcs-ElHL9jCeV7qRkFVG5X5caoDW9YQF21qA9wL3v_zOjSz0xCsjl8FxGUntDIq3a1wd-d0N7wsDjbLCHLMacjNjr5x0MsW3t5DSxQA0SnJrX9vU_28',
  },
  {
    id: 'memory-4',
    title: 'Desert Adventure',
    date: 'May 1-3, 2023',
    stories: '5 stories discovered',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAluH342gsfzyd3yGKr5W3Yey9Vr4IDRVM9IRQQ3P9jkpEmkM1VUGANWgS1m3TL_-WRNbxqkHRUj4otXlquJQo86NNgg2JeXiTzVX_SoSQ7bLUJq6fg_dtzG0sj2eCG9gLauIU7q7uJYeOfUc2wNd6u9fAtX7uxlESm9FslOE9aJmkq8Qc2UOq3m3eXtA1ZCLgNm0DFUHMqrQh8oKamb11e7GpR56UnMlAuMoZsx3C0mO6Ivf2iS7s2mEqq5AvJi85ZvPatAmFe8us',
  },
];

export const JourneyMemoriesScreen: React.FC = () => {
  return (
    <div
      className="flex min-h-screen flex-col bg-background-light font-display text-gray-800 dark:bg-background-dark dark:text-gray-200"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button
              type="button"
              className="-ml-2 flex h-10 w-10 items-center justify-center text-gray-600 dark:text-gray-300"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Completed Trips</h1>
            <div className="w-8" aria-hidden="true" />
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            A look back at your past adventures.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {memories.map((memory) => (
              <div key={memory.id} className="group flex flex-col gap-3">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  <img
                    src={memory.image}
                    alt={memory.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-0 left-0 p-3 text-white">
                    <p className="font-bold">{memory.title}</p>
                    <p className="text-xs text-gray-300">{memory.date}</p>
                    <p className="mt-1 text-sm text-gray-200">{memory.stories}</p>
                  </div>
                </div>
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
            <span className="material-symbols-outlined">explore</span>
            <span className="text-xs font-medium">Discoveries</span>
          </NavLink>
          <NavLink
            to="/memories"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-full p-2 transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">history</span>
            <span className="text-xs font-medium">Memories</span>
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

export default JourneyMemoriesScreen;
