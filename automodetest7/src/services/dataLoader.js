import Papa from 'papaparse';

// Use absolute path for reliable loading in production
const DATA_FILE_NAME = 'cascaded_cstr_10modes_1_table.csv';

export async function loadDataFile() {
  // Build paths to try - use absolute path first (most reliable for deployed apps)
  const pathsToTry = [
    `/data/${DATA_FILE_NAME}`,      // Absolute path (works in most deployments)
    `./data/${DATA_FILE_NAME}`,     // Relative from current location
    `data/${DATA_FILE_NAME}`        // Simple relative
  ];

  let response = null;
  let lastError = null;
  let successPath = null;

  for (const path of pathsToTry) {
    try {
      console.log('[DataLoader] Attempting to load data from:', path);
      response = await fetch(path);

      // Log all response headers for debugging
      console.log('[DataLoader] Response status:', response.status);
      console.log('[DataLoader] Response headers:');
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });

      if (response.ok) {
        successPath = path;
        console.log('[DataLoader] Successfully fetched from:', path);
        break;
      } else {
        console.warn('[DataLoader] HTTP error from', path, '- Status:', response.status);
        lastError = new Error(`HTTP ${response.status} from ${path}`);
      }
    } catch (err) {
      console.warn('[DataLoader] Network error from', path, '-', err.message);
      lastError = err;
    }
  }

  if (!response || !response.ok) {
    const errorMsg = `Failed to load data file. Last error: ${lastError?.message || 'Unknown'}`;
    console.error('[DataLoader]', errorMsg);
    throw new Error(errorMsg);
  }

  // Get the CSV text
  let csvText = await response.text();
  console.log('[DataLoader] Received', csvText.length, 'bytes from', successPath);

  // Check content type header
  const contentType = response.headers.get('content-type');
  console.log('[DataLoader] Content-Type header:', contentType);

  // Validate we got actual CSV content
  if (!csvText || csvText.length < 100) {
    throw new Error('Data file appears to be empty or invalid');
  }

  // Check if we got HTML instead of CSV (common error page issue)
  const trimmedText = csvText.trim();
  if (trimmedText.startsWith('<!') || trimmedText.startsWith('<html') || trimmedText.startsWith('<HTML')) {
    console.error('[DataLoader] Received HTML instead of CSV. First 1000 chars:', csvText.substring(0, 1000));
    throw new Error('Server returned HTML error page instead of CSV data');
  }

  // CRITICAL: Check for and remove preview truncation header
  // Some upload tools add lines like:
  //   "⚠️ File truncated for preview (showing first 0.5MB of 5.5MB)"
  //   "────────────────────────────────────────────────────────────"
  // before the actual CSV content
  const lines = csvText.split('\n');
  let headerLineIndex = 0;

  // Find the actual CSV header line (first line with multiple commas that looks like column names)
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    const commaCount = (line.match(/,/g) || []).length;

    // A valid CSV header should have multiple commas and start with a letter or underscore
    // Also check it's not a separator line (────) or warning message
    const startsWithValidChar = /^[a-zA-Z_"]/.test(line);
    const isNotSeparator = !line.startsWith('─') && !line.startsWith('-');
    const isNotWarning = !line.includes('truncated') && !line.includes('preview');

    console.log(`[DataLoader] Line ${i}: commas=${commaCount}, valid=${startsWithValidChar}, notSep=${isNotSeparator}, notWarn=${isNotWarning}, content="${line.substring(0, 50)}..."`);

    if (commaCount >= 5 && startsWithValidChar && isNotSeparator && isNotWarning) {
      headerLineIndex = i;
      console.log(`[DataLoader] Found CSV header at line ${i}`);
      break;
    }
  }

  // If we found a header that's not on the first line, strip the prefix lines
  if (headerLineIndex > 0) {
    console.log(`[DataLoader] Stripping ${headerLineIndex} non-CSV prefix lines`);
    const cleanedLines = lines.slice(headerLineIndex);
    csvText = cleanedLines.join('\n');
    console.log('[DataLoader] Cleaned CSV length:', csvText.length, 'bytes');
  }

  // Re-split after potential cleaning
  const cleanLines = csvText.split('\n');
  const firstLine = cleanLines[0] || '';
  const trimmedFirstLine = firstLine.trim();

  console.log('[DataLoader] Number of lines after cleaning:', cleanLines.length);
  console.log('[DataLoader] Header line:', trimmedFirstLine.substring(0, 150) + '...');
  console.log('[DataLoader] Header comma count:', (trimmedFirstLine.match(/,/g) || []).length);

  // Validate it's now proper CSV
  const hasCommas = trimmedFirstLine.includes(',');
  const hasMultipleLines = cleanLines.length > 1;

  if (!hasCommas) {
    console.error('[DataLoader] Header line does not contain commas:', trimmedFirstLine);
    throw new Error('Data file does not appear to be valid CSV format');
  }

  console.log('[DataLoader] CSV validation passed, parsing...');

  return parseCSV(csvText);
}

function parseCSV(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve({
          data: results.data,
          columns: results.meta.fields || []
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

export function discoverColumns(columns) {
  const spPvPairs = [];
  const outputVariables = [];
  const excludePatterns = ['timestamp', 'operating_regime', '_is_outlier'];

  // Find SP/PV pairs
  const spColumns = columns.filter(col => col.startsWith('SP_'));

  for (const spCol of spColumns) {
    const baseName = spCol.replace('SP_', '');
    const pvCol = columns.find(col => col === baseName);

    if (pvCol) {
      spPvPairs.push({
        baseName,
        spColumn: spCol,
        pvColumn: pvCol,
        description: getColumnDescription(baseName)
      });
    }
  }

  // Find output variables (columns that are not SP/PV pairs, timestamp, or outlier flags)
  const spPvColumnNames = spPvPairs.flatMap(p => [p.spColumn, p.pvColumn]);

  for (const col of columns) {
    const isExcluded = excludePatterns.some(pattern => col.includes(pattern));
    const isSpPv = spPvColumnNames.includes(col);

    if (!isExcluded && !isSpPv) {
      outputVariables.push({
        name: col,
        description: getColumnDescription(col)
      });
    }
  }

  return { spPvPairs, outputVariables };
}

function getColumnDescription(name) {
  const descriptions = {
    'TT_101': 'Temperature Tank 1',
    'TT_102': 'Temperature Tank 2',
    'LT_101': 'Level Tank 1',
    'LT_102': 'Level Tank 2',
    'FT_101': 'Flow Tank 1',
    'FT_102': 'Flow Tank 2',
    'ST_101': 'Stirring Tank 1',
    'ST_102': 'Stirring Tank 2',
    'AT_101': 'Analyzer/Composition',
    'CT_104': 'Controller Output 104',
    'CT_105': 'Controller Output 105',
    'CT_106': 'Controller Output 106',
    'conversion': 'Process Conversion',
    'selectivity': 'Process Selectivity'
  };

  return descriptions[name] || name;
}
