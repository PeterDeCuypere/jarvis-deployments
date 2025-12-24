import Papa from 'papaparse';

const DATA_FILE_PATH = './data/cascaded_cstr_10modes_1_table.csv';

export async function loadDataFile() {
  try {
    const response = await fetch(DATA_FILE_PATH);

    if (!response.ok) {
      throw new Error(`Failed to load data file: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error loading data file:', error);
    throw error;
  }
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
