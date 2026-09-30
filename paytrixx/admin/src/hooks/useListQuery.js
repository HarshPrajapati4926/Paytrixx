import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "../services/api";

/**
 * Server-paginated list hook.
 * GET {url}?page=<1-based>&limit=&...filters  ->  { success, data: [], total }
 */
const useListQuery = (key, url, filters = {}) => {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const clean = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v != null)
  );

  const query = useQuery({
    queryKey: [key, page, limit, clean],
    queryFn: () =>
      api
        .get(url, { params: { page: page + 1, limit, ...clean } })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  return {
    rows: query.data?.data || [],
    total: query.data?.total || 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    page,
    limit,
    setPage,
    setLimit: (l) => {
      setLimit(l);
      setPage(0);
    },
    resetPage: () => setPage(0),
  };
};

export default useListQuery;
