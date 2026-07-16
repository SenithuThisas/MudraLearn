import { useQuery } from '@tanstack/react-query'
import { getDashboardSigns } from '../services/api'
import type { SignMasteryRow } from '../data/mockDashboard'

const PAGE_SIZE = 100

// SignMasteryTable already does its own client-side search/category filtering
// and "load more" paging over a flat array (it predates server-side paging).
// The backend caps page_size at 100 but the sign catalog has ~380 entries, so
// this hook fetches every page and flattens them into the single array the
// component expects, rather than changing SignMasteryTable to page server-side.
async function fetchAllSigns(): Promise<SignMasteryRow[]> {
  const first = await getDashboardSigns({ page: 1, pageSize: PAGE_SIZE })
  if (first.totalPages <= 1) return first.signs

  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) =>
      getDashboardSigns({ page: i + 2, pageSize: PAGE_SIZE }),
    ),
  )
  return [first, ...rest].flatMap((p) => p.signs)
}

export function useDashboardSigns() {
  return useQuery({
    queryKey: ['dashboard', 'signs'],
    queryFn: fetchAllSigns,
  })
}
