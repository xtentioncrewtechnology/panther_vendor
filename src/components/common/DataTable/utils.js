/**
 * Utility functions for DataTable component
 */

// Common acronyms to keep uppercase when formatting column headers
const ACRONYMS = new Set([
  'id', 'ib', 'fm', 'kyc', 'pnl', 'usd', 'usc', 'eur', 'gbp', 'api', 'url', 'ip', 'mt4', 'mt5', 'otp', '2fa'
])

/**
 * Converts a camelCase or snake_case property key into a clean, human-readable Title Case label
 * e.g., 'user_id' -> 'User ID', 'fm_share' -> 'FM Share', 'broker_currency' -> 'Broker Currency'
 * @param {string} key
 * @returns {string}
 */
export function keyToLabel(key) {
  if (!key || typeof key !== 'string') return ''

  return key
    // Split on snake_case, kebab-case, or camelCase boundaries
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase()
      if (ACRONYMS.has(lower)) {
        return lower.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Automatically inspects a data array and discovers columns if no explicit columns are provided
 * @param {Array<Object>} data
 * @param {Array<string>} excludeColumns
 * @returns {Array<Object>}
 */
export function autoDetectColumns(data, excludeColumns = []) {
  if (!Array.isArray(data) || data.length === 0) return []

  const excludeSet = new Set(Array.isArray(excludeColumns) ? excludeColumns : [])
  const keySet = new Set()

  // Collect all unique keys from all rows (to avoid missing keys if some rows have extra fields)
  for (const row of data) {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => {
        if (!excludeSet.has(k)) {
          keySet.add(k)
        }
      })
    }
  }

  return Array.from(keySet).map((key) => ({
    key,
    label: keyToLabel(key),
    type: inferColumnType(key, data),
    sortable: true,
    resizable: true,
  }))
}

/**
 * Guess appropriate column type based on key name or sample data
 * @param {string} key
 * @param {Array<Object>} data
 * @returns {string}
 */
function inferColumnType(key, data) {
  const lowerKey = key.toLowerCase()
  if (lowerKey === 'status' || lowerKey.endsWith('_status')) return 'badge'
  if (lowerKey.includes('date') || lowerKey.endsWith('_at')) return 'datetime'
  if (lowerKey.includes('amount') || lowerKey.includes('balance') || lowerKey.includes('deposit') || lowerKey.includes('withdrawal') || lowerKey.includes('fee')) return 'currency'
  if (lowerKey.includes('percent') || lowerKey.includes('share') || lowerKey.includes('rate')) return 'percentage'
  if (lowerKey.startsWith('is_') || lowerKey.startsWith('has_')) return 'boolean'
  if (lowerKey === 'email' || lowerKey.endsWith('_email') || lowerKey === 'url' || lowerKey.endsWith('_url')) return 'text'

  // Inspect first non-null value
  for (const row of data) {
    const val = row?.[key]
    if (val !== null && val !== undefined) {
      if (typeof val === 'boolean') return 'boolean'
      if (typeof val === 'number') return 'number'
      break
    }
  }

  return 'text'
}

/**
 * Format a value based on column definition
 * @param {*} value
 * @param {Object} column
 * @param {Object} row
 * @returns {string}
 */
export function formatCellValue(value, column = {}, row = {}) {
  // If custom formatter provided, use it
  if (typeof column.formatter === 'function') {
    return column.formatter(value, row)
  }

  // Handle null, undefined, and empty strings safely (preserves 0 and false)
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const type = column.type || 'text'

  switch (type) {
    case 'number': {
      const num = Number(value)
      if (isNaN(num)) return String(value)
      const decimals = column.decimals !== undefined ? column.decimals : 2
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    }

    case 'currency': {
      const num = Number(value)
      if (isNaN(num)) return String(value)
      const symbol = column.currencySymbol || '$'
      const decimals = column.decimals !== undefined ? column.decimals : 2
      const formatted = Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      return num < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`
    }

    case 'percentage': {
      const num = Number(value)
      if (isNaN(num)) return String(value)
      const decimals = column.decimals !== undefined ? column.decimals : 0
      return `${num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}%`
    }

    case 'date': {
      try {
        const d = new Date(value)
        if (isNaN(d.getTime())) return String(value)
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      } catch {
        return String(value)
      }
    }

    case 'datetime': {
      try {
        const d = new Date(value)
        if (isNaN(d.getTime())) return String(value)
        const datePart = d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        const timePart = d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        return `${datePart} ${timePart}`
      } catch {
        return String(value)
      }
    }

    case 'boolean': {
      return value ? 'Yes' : 'No'
    }

    default:
      return String(value)
  }
}

/**
 * Storage helpers for column settings (widths, visibility)
 */
const STORAGE_PREFIX = 'pc_datatable_'

export function loadTableSettings(tableKey) {
  if (!tableKey || typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tableKey}`)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.warn('Failed to load table settings from localStorage:', e)
    return null
  }
}

export function saveTableSettings(tableKey, settings) {
  if (!tableKey || typeof window === 'undefined') return
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tableKey}`, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save table settings to localStorage:', e)
  }
}

export function clearTableSettings(tableKey) {
  if (!tableKey || typeof window === 'undefined') return
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${tableKey}`)
  } catch (e) {
    console.warn('Failed to clear table settings from localStorage:', e)
  }
}
