import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import useAppStore from '../store/appStore';
import { parseDataFile, getDataPreview } from '../services/dataParser';
import { discoverSpPvPairs, getOutputVariables, detectDatetimeColumns, isNumericColumn } from '../utils/columnDiscovery';

function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [parseError, setParseError] = useState(null);

  const {
    rawData,
    fileName,
    showDataPreview,
    setData,
    setDetectedPairs,
    setDatetimeColumns,
    setOutputVariables,
    toggleDataPreview,
    reset
  } = useAppStore();

  const processFile = useCallback(async (file) => {
    setParseError(null);

    const result = await parseDataFile(file);

    if (result.error && result.data.length === 0) {
      setParseError(result.error);
      return;
    }

    // Store data
    setData(result.data, result.columns, file.name);

    // Detect datetime columns
    const datetimeCols = detectDatetimeColumns(result.data, result.columns);
    setDatetimeColumns(datetimeCols);

    // Discover SP/PV pairs
    const { pairs, ambiguousSp, unmatched } = discoverSpPvPairs(result.columns);
    setDetectedPairs(pairs, ambiguousSp, unmatched);

    // Get output variables (numeric columns not in pairs)
    const outputVars = getOutputVariables(result.columns, pairs, datetimeCols[0] || null)
      .filter(col => isNumericColumn(result.data, col));
    setOutputVariables(outputVars);

    if (result.error) {
      setParseError(result.error);
    }
  }, [setData, setDetectedPairs, setDatetimeColumns, setOutputVariables]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleRemoveFile = useCallback(() => {
    reset();
    setParseError(null);
  }, [reset]);

  const previewData = rawData.length > 0 ? getDataPreview(rawData, 100) : [];

  return (
    <div className="space-y-4">
      {!fileName ? (
        <div
          className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop your data file here</p>
          <p className="text-sm text-muted-foreground">
            Supports CSV and JSON files
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {rawData.length.toLocaleString()} rows
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {parseError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{parseError}</p>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={toggleDataPreview}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <span className="font-medium">Data Preview</span>
            <span className="text-sm text-muted-foreground">
              {showDataPreview ? 'Hide' : 'Show'} first 100 rows
            </span>
          </button>

          {showDataPreview && (
            <div className="overflow-x-auto max-h-80">
              <table className="results-table text-sm">
                <thead className="sticky top-0">
                  <tr>
                    <th className="text-xs">#</th>
                    {Object.keys(previewData[0] || {}).slice(0, 10).map(col => (
                      <th key={col} className="text-xs truncate max-w-[150px]" title={col}>
                        {col}
                      </th>
                    ))}
                    {Object.keys(previewData[0] || {}).length > 10 && (
                      <th className="text-xs">...</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-muted-foreground">{idx + 1}</td>
                      {Object.values(row).slice(0, 10).map((val, colIdx) => (
                        <td key={colIdx} className="truncate max-w-[150px]" title={String(val)}>
                          {typeof val === 'number' ? val.toFixed(2) : String(val ?? '')}
                        </td>
                      ))}
                      {Object.keys(row).length > 10 && (
                        <td className="text-muted-foreground">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
