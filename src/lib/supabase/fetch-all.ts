import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch all rows from a Supabase table, paginating in chunks of 1000
 * to bypass the default server-side row limit.
 */
export async function fetchAllRows<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  filters?: {
    eq?: [string, string][]
    gte?: [string, string][]
    lte?: [string, string][]
  },
  orderBy?: { column: string; ascending: boolean }
): Promise<T[]> {
  const PAGE_SIZE = 1000
  const allRows: T[] = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase.from(table).select(select)

    if (filters?.eq) {
      for (const [col, val] of filters.eq) {
        query = query.eq(col, val)
      }
    }
    if (filters?.gte) {
      for (const [col, val] of filters.gte) {
        query = query.gte(col, val)
      }
    }
    if (filters?.lte) {
      for (const [col, val] of filters.lte) {
        query = query.lte(col, val)
      }
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending })
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1)

    if (error || !data) break

    allRows.push(...(data as T[]))

    if (data.length < PAGE_SIZE) {
      hasMore = false
    } else {
      from += PAGE_SIZE
    }
  }

  return allRows
}
