import { useEffect, useState } from 'react';
import { listProducts } from '../api/productsApi';

export function useProducts(query) {
  const [result, setResult] = useState({ key: null, products: [], error: null });
  const [revision, setRevision] = useState(0);
  const key = `${revision}:${query}`;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const products = await listProducts(query, controller.signal);
        if (!controller.signal.aborted) setResult({ key, products, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, products: [], error });
      }
    }, query ? 220 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key, query]);

  const current = key === result.key;
  return {
    products: current ? result.products : [],
    error: current ? result.error : null,
    loading: !current,
    retry: () => setRevision((value) => value + 1),
  };
}
