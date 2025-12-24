import { useState } from 'react';
import { ChevronDown, ChevronRight, Table } from 'lucide-react';
import useAppStore from '../store/appStore';

function DataPreview() {
  const { previewData, columns, totalRows, showDataPreview, setShowDataPreview } = useAppStore();
  const [visibleColumns, setVisibleColumns] = useState(null);

  // Show first 8 columns by default
  const displayColumns = visibleColumns || columns.slice(0, 8);

  if (previewData.length === 0) {
    return null;
  }

  return (
    <div className="card mb-4">
      <button
        onClick={() => setShowDataPreview(!showDataPreview)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-primary" />
          <span className="font-medium">Data Preview</span>
          <span className="text-xs text-muted-foreground">
            (First 100 of {totalRows.toLocaleString()} rows)
          </span>
        </div>
        {showDataPreview ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {showDataPreview && (
        <div className="mt-4">
          {/* Column filter */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Columns:</span>
            <button
              onClick={() => setVisibleColumns(columns.slice(0, 8))}
              className={`text-xs px-2 py-1 rounded ${
                displayColumns.length <= 8 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              First 8
            </button>
            <button
              onClick={() => setVisibleColumns(columns)}
              className={`text-xs px-2 py-1 rounded ${
                displayColumns.length === columns.length ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({columns.length})
            </button>
          </div>

          {/* Scrollable table container */}
          <div className="overflow-auto max-h-[400px] rounded border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  {displayColumns.map(col => (
                    <th key={col} className="whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-muted-foreground text-xs">{idx + 1}</td>
                    {displayColumns.map(col => (
                      <td key={col} className="whitespace-nowrap">
                        {formatValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Showing 100 rows with {displayColumns.length} of {columns.length} columns
          </p>
        </div>
      )}
    </div>
  );
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/50">-</span>;
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(4);
  }
  return String(value);
}

export default DataPreview;
