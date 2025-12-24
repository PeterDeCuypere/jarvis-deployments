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
  const csvText = await response.text();
  console.log('[DataLoader] Received', csvText.length, 'bytes from', successPath);

  // Validate we got actual CSV content
  if (!csvText || csvText.length < 100) {
    throw new Error('Data file appears to be empty or invalid');
  }

  // Check if it looks like CSV (has header with commas)
  const firstLine = csvText.split('\n')[0];
  if (!firstLine || !firstLine.includes(',')) {
    throw new Error('Data file does not appear to be valid CSV format');
  }

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
