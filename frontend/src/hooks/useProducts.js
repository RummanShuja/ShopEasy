import { useEffect, useState } from 'react';
import { listProducts } from '../api/productsApi';

const PAGE_SIZE = 8;
const EMPTY = { items: [], total: 0, page: -1, hasNext: false, error: null, request: null };

export function useProducts(query) {
  const [result, setResult] = useState(EMPTY);
  const [request, setRequest] = useState({ page: 0 });
  const loading = result.request !== request;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(query);
    params.set('page', String(request.page));
    params.set('size', String(PAGE_SIZE));

    const timer = window.setTimeout(async () => {
      try {
        const page = await listProducts(params.toString(), controller.signal);
        if (controller.signal.aborted) return;
        setResult((previous) => {
          const items = new Map((request.page === 0 ? [] : previous.items).map((product) => [product.id, product]));
          for (const product of page.items) items.set(product.id, product);
          return { ...page, items: [...items.values()], error: null, request };
        });
      } catch (error) {
        if (!controller.signal.aborted) setResult((previous) => ({ ...previous, error, request }));
      }
    }, query && request.page === 0 ? 220 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, request]);

  return {
    products: result.items,
    total: result.total,
    hasNext: result.hasNext,
    error: loading ? null : result.error,
    loading,
    retry: () => setRequest({ page: request.page }),
    loadMore: () => setRequest({ page: result.page + 1 }),
  };
}
