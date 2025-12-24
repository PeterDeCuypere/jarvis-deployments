/**
 * Time formatting utilities for converting durations to human-readable format
 */

/**
 * Format milliseconds to smart human-readable format
 * - Under 1 hour: "45m"
 * - Under 1 day: "2h 30m"
 * - 1+ days: "1d 5h 20m"
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration string
 */
export function formatDuration(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return 'N/A';
  }

  // Handle negative or zero
  if (ms <= 0) {
    return '0m';
  }

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const totalDays = Math.floor(ms / (1000 * 60 * 60 * 24));

  const minutes = totalMinutes % 60;
  const hours = totalHours % 24;
  const days = totalDays;

  // Format based on magnitude
  if (days >= 1) {
    // 1+ days: show days, hours, minutes
    const parts = [];
    parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(' ');
  } else if (totalHours >= 1) {
    // Under 1 day: show hours and minutes
    if (minutes > 0) {
      return `${totalHours}h ${minutes}m`;
    }
    return `${totalHours}h`;
  } else {
    // Under 1 hour: show only minutes
    return `${totalMinutes}m`;
  }
}

/**
 * Calculate duration in milliseconds between two timestamps
 * Supports various timestamp formats (ISO string, Unix timestamp, Date object)
 * @param {string|number|Date} startTime - Start timestamp
 * @param {string|number|Date} endTime - End timestamp
 * @returns {number} - Duration in milliseconds
 */
export function calculateDurationMs(startTime, endTime) {
  const start = parseTimestamp(startTime);
  const end = parseTimestamp(endTime);

  if (!start || !end) {
    return null;
  }

  return end.getTime() - start.getTime();
}

/**
 * Parse various timestamp formats to Date object
 * @param {string|number|Date} timestamp - Timestamp in various formats
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export function parseTimestamp(timestamp) {
  if (!timestamp && timestamp !== 0) {
    return null;
  }

  // Already a Date
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }

  // Unix timestamp (number) - could be seconds or milliseconds
  if (typeof timestamp === 'number') {
    // If timestamp is less than 10 billion, assume seconds (Unix)
    // Otherwise assume milliseconds
    const ms = timestamp < 1e10 ? timestamp * 1000 : timestamp;
    const date = new Date(ms);
    return isNaN(date.getTime()) ? null : date;
  }

  // String timestamp
  if (typeof timestamp === 'string') {
    // Try direct Date parsing first
    let date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing as number string
    const numValue = parseFloat(timestamp);
    if (!isNaN(numValue)) {
      const ms = numValue < 1e10 ? numValue * 1000 : numValue;
      date = new Date(ms);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

/**
 * Calculate duration from data array using timestamp column
 * @param {Object[]} data - Array of data rows
 * @param {number} startIdx - Start index
 * @param {number} endIdx - End index
 * @param {string} timestampCol - Name of timestamp column (default: 'timestamp')
 * @returns {number} - Duration in milliseconds
 */
export function calculateSegmentDuration(data, startIdx, endIdx, timestampCol = 'timestamp') {
  if (!data || data.length === 0 || startIdx < 0 || endIdx >= data.length) {
    return null;
  }

  const startTime = data[startIdx]?.[timestampCol];
  const endTime = data[endIdx]?.[timestampCol];

  return calculateDurationMs(startTime, endTime);
}

/**
 * Format duration for display with appropriate precision
 * @param {number} ms - Duration in milliseconds
 * @param {boolean} compact - Use compact format (default: false)
 * @returns {string} - Formatted duration
 */
export function formatDurationCompact(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return 'N/A';
  }

  const totalMinutes = Math.round(ms / (1000 * 60));
  const totalHours = ms / (1000 * 60 * 60);
  const totalDays = ms / (1000 * 60 * 60 * 24);

  if (totalDays >= 1) {
    return `${totalDays.toFixed(1)}d`;
  } else if (totalHours >= 1) {
    return `${totalHours.toFixed(1)}h`;
  } else {
    return `${totalMinutes}m`;
  }
}
