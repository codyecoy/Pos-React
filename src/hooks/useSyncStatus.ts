import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

export function useSyncStatus() {
  const pendingCount = useLiveQuery(async () => db.sync_queue.where('status').equals('pending').count(), [], 0)
  const failedCount = useLiveQuery(async () => db.sync_queue.where('status').equals('failed').count(), [], 0)

  const lastSyncAt = useLiveQuery(async () => {
    const row = await db.settings.get('lastSyncAt')
    if (!row?.value) return null
    const d = new Date(row.value)
    return Number.isNaN(d.getTime()) ? null : d
  }, [], null)

  return { pendingCount, failedCount, lastSyncAt }
}
