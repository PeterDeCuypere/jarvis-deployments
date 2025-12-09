/**
 * Data parsing service for CSV files
 */

import Papa from 'papaparse';

/**
 * Parse CSV file
 * @param {File} file - CSV file
 * @returns {Promise<{ data: Object[], columns: string[], error: string|null }>}
 */
export function parseCSVFile(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          const errorMessages = results.errors
            .slice(0, 3)
            .map(e => e.message)
            .join('; ');
          resolve({
            data: results.data || [],
            columns: results.meta?.fields || [],
            error: `Parse warnings: ${errorMessages}`
          });
        } else {
          resolve({
            data: results.data,
            columns: results.meta.fields || [],
            error: null
          });
        }
      },
      error: (error) => {
        resolve({
          data: [],
          columns: [],
          error: `Failed to parse CSV: ${error.message}`
        });
      }
    });
  });
}

/**
 * Parse database table file (JSON format)
 * @param {File} file - JSON file
 * @returns {Promise<{ data: Object[], columns: string[], error: string|null }>}
 */
export async function parseJSONFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      return {
        data: [],
        columns: [],
        error: 'JSON file must contain an array of objects'
      };
    }

    if (data.length === 0) {
      return {
        data: [],
        columns: [],
        error: 'JSON file is empty'
      };
    }

    const columns = Object.keys(data[0]);

    return {
      data,
      columns,
      error: null
    };
  } catch (error) {
    return {
      data: [],
      columns: [],
      error: `Failed to parse JSON: ${error.message}`
    };
  }
}

/**
 * Parse data file (CSV or JSON)
 * @param {File} file - File to parse
 * @returns {Promise<{ data: Object[], columns: string[], error: string|null }>}
 */
export async function parseDataFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSVFile(file);
  } else if (extension === 'json') {
    return parseJSONFile(file);
  } else {
    return {
      data: [],
      columns: [],
      error: `Unsupported file format: ${extension}. Please use CSV or JSON.`
    };
  }
}

/**
 * Get data preview (first N rows)
 * @param {Object[]} data - Parsed data
 * @param {number} maxRows - Maximum rows to return
 * @returns {Object[]}
 */
export function getDataPreview(data, maxRows = 100) {
  return data.slice(0, maxRows);
}

/**
 * Get data statistics
 * @param {Object[]} data - Parsed data
 * @param {string[]} columns - Column names
 * @returns {Object}
 */
export function getDataStatistics(data, columns) {
  const stats = {};

  for (const col of columns) {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined);
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));

    stats[col] = {
      count: values.length,
      nullCount: data.length - values.length,
      isNumeric: numericValues.length > values.length * 0.7,
      uniqueCount: new Set(values).size
    };

    if (numericValues.length > 0) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      stats[col].mean = sum / numericValues.length;
      stats[col].min = Math.min(...numericValues);
      stats[col].max = Math.max(...numericValues);
    }
  }

  return stats;
}
