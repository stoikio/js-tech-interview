import { useSearchParams } from 'react-router';

/** Search text of a list page, kept in the URL (`?q=…`). */
export function useListFilters() {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';

  function setSearch(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  }

  const matches = (...texts: string[]) =>
    texts.join(' ').toLowerCase().includes(search.trim().toLowerCase());

  return { search, setSearch, matches };
}
