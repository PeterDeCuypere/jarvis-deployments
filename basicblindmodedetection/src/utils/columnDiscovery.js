/**
 * Column Discovery Algorithm for PV/SP Pair Detection
 * Auto-detects SP/PV pairs from column names using pattern matching
 */

/**
 * Discover SP/PV pairs from column names using pattern matching
 * @param {string[]} columns - Array of column names
 * @returns {{ pairs: Array, ambiguousSp: Object, unmatched: string[] }}
 */
export function discoverSpPvPairs(columns) {
  // Patterns for SP columns (case-insensitive)
  const spPatterns = [
    /^SP[_\-\s]?(.+)$/i,           // SP_TT_101, SP-TT_101
    /^(.+)[_\-\s]?SP$/i,           // TT_101_SP, TT_101-SP
    /^setpoint[_\-\s]?(.+)$/i,     // setpoint_TT_101
    /^(.+)[_\-\s]?setpoint$/i,     // TT_101_setpoint
  ];

  // Patterns for PV columns (case-insensitive)
  const pvPatterns = [
    /^PV[_\-\s]?(.+)$/i,           // PV_TT_101
    /^(.+)[_\-\s]?PV$/i,           // TT_101_PV
  ];

  const spCols = {};  // base_name -> sp_column
  const pvCols = {};  // base_name -> pv_column
  const unmatched = [];

  for (const col of columns) {
    let matched = false;

    // Check SP patterns
    for (const pattern of spPatterns) {
      const match = col.match(pattern);
      if (match) {
        const baseName = match[1].replace(/^[_\-\s]+|[_\-\s]+$/g, '').toUpperCase();
        spCols[baseName] = col;
        matched = true;
        break;
      }
    }

    // Check PV patterns
    if (!matched) {
      for (const pattern of pvPatterns) {
        const match = col.match(pattern);
        if (match) {
          const baseName = match[1].replace(/^[_\-\s]+|[_\-\s]+$/g, '').toUpperCase();
          pvCols[baseName] = col;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      unmatched.push(col);
    }
  }

  // Match SP with PV
  const pairs = [];
  const matchedBases = new Set();

  for (const [baseName, spCol] of Object.entries(spCols)) {
    // Look for matching PV
    if (pvCols[baseName]) {
      pairs.push({
        pv: pvCols[baseName],
        sp: spCol,
        baseName: baseName
      });
      matchedBases.add(baseName);
    } else {
      // Look for unmatched column with same base name
      for (let i = 0; i < unmatched.length; i++) {
        const col = unmatched[i];
        const colUpper = col.toUpperCase().replace(/^[_\-\s]+|[_\-\s]+$/g, '');
        if (colUpper === baseName || baseName.includes(colUpper) || colUpper.includes(baseName)) {
          pairs.push({
            pv: col,
            sp: spCol,
            baseName: baseName
          });
          unmatched.splice(i, 1);
          matchedBases.add(baseName);
          break;
        }
      }
    }
  }

  // Any remaining unmatched SP columns need user confirmation
  const ambiguousSp = {};
  for (const [baseName, spCol] of Object.entries(spCols)) {
    if (!matchedBases.has(baseName)) {
      ambiguousSp[baseName] = spCol;
    }
  }

  return { pairs, ambiguousSp, unmatched };
}

/**
 * Get all numeric columns that are NOT part of SP/PV pairs
 * @param {string[]} columns - All column names
 * @param {Array} spPvPairs - Detected SP/PV pairs
 * @param {string} timestampCol - Timestamp column name
 * @returns {string[]} - Output variable column names
 */
export function getOutputVariables(columns, spPvPairs, timestampCol) {
  const spPvCols = new Set();

  for (const pair of spPvPairs) {
    spPvCols.add(pair.pv);
    spPvCols.add(pair.sp);
  }

  const outputVars = [];
  for (const col of columns) {
    if (col === timestampCol) continue;
    if (spPvCols.has(col)) continue;
    // Filter out ground truth columns (simulation artifacts)
    if (col.endsWith('_is_outlier')) continue;
    if (col === 'outlier_regime') continue;
    if (col === 'operating_regime') continue;
    outputVars.push(col);
  }

  return outputVars;
}

/**
 * Detect datetime columns in the dataset
 * @param {Object[]} data - Array of data rows
 * @param {string[]} columns - Column names
 * @returns {string[]} - Columns that appear to be datetime
 */
export function detectDatetimeColumns(data, columns) {
  if (!data || data.length === 0) return [];

  const datetimeColumns = [];
  const sampleSize = Math.min(10, data.length);

  for (const col of columns) {
    let isDatetime = true;
    let validCount = 0;

    for (let i = 0; i < sampleSize && isDatetime; i++) {
      const val = data[i][col];
      if (val === null || val === undefined || val === '') continue;

      // Try parsing as date
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        validCount++;
      } else if (typeof val === 'string' && !isNumericString(val)) {
        // Check common date patterns
        const datePatterns = [
          /^\d{4}-\d{2}-\d{2}/,           // ISO format
          /^\d{2}\/\d{2}\/\d{4}/,         // US format
          /^\d{2}-\d{2}-\d{4}/,           // EU format
          /^\d{1,2}\/\d{1,2}\/\d{2,4}/,   // Short format
        ];
        if (datePatterns.some(p => p.test(val))) {
          validCount++;
        }
      }
    }

    if (validCount >= sampleSize * 0.5) {
      datetimeColumns.push(col);
    }
  }

  return datetimeColumns;
}

/**
 * Check if a string is numeric
 * @param {string} str
 * @returns {boolean}
 */
function isNumericString(str) {
  if (typeof str !== 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

/**
 * Check if a column contains numeric data
 * @param {Object[]} data - Array of data rows
 * @param {string} column - Column name
 * @returns {boolean}
 */
export function isNumericColumn(data, column) {
  if (!data || data.length === 0) return false;

  const sampleSize = Math.min(20, data.length);
  let numericCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const val = data[i][column];
    if (val === null || val === undefined || val === '') continue;
    if (typeof val === 'number' || isNumericString(val)) {
      numericCount++;
    }
  }

  return numericCount >= sampleSize * 0.7;
}
