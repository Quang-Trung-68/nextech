const KEY = 'nextech_recent_searches';
const MAX = 5;

export const getRecentSearches = () =>
  JSON.parse(localStorage.getItem(KEY) || '[]');

export const saveRecentSearch = (term) => {
  if (!term) return;
  const prev = getRecentSearches().filter(t => t !== term);
  localStorage.setItem(KEY, JSON.stringify([term, ...prev].slice(0, MAX)));
};

export const removeRecentSearch = (term) => {
  const updated = getRecentSearches().filter(t => t !== term);
  localStorage.setItem(KEY, JSON.stringify(updated));
};
