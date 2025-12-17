import { useState, useEffect, Component, useMemo } from 'react';
import { Database, FileText, X, RefreshCw, Search, Loader2, Table2, Link2, ArrowRight, BarChart3, Columns3, Rows3, Key, Info, Building2, HelpCircle, Zap, Activity, Users, Package, Calendar, TrendingUp, ChevronRight, Lightbulb, Target, Clock, Gauge, DollarSign, Wrench, CheckCircle2, AlertTriangle, ArrowUpRight, ChevronDown, ChevronUp, LayoutDashboard, Settings, Upload, Filter, Calculator, Box, Layers, PieChart, ArrowLeft } from 'lucide-react';
import DatabaseUpload from './components/DatabaseUpload';
import databaseService from './services/databaseService';

// Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-hmi-bg p-4">
          <div className="bg-hmi-surface rounded-lg p-8 max-w-lg text-center border border-hmi-alarm/30">
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <pre className="text-left bg-black/30 rounded p-3 mb-4 text-xs text-hmi-alarm overflow-auto max-h-32">
              {this.state.error?.message}
            </pre>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-hmi-normal hover:bg-hmi-normal/80 rounded text-white">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Format number utility
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toLocaleString() || '0';
};

// Data Sources Panel - Reusable component for showing data transparency
// Shows exactly what real data, synthetic data, and unavailable data is used in each analysis
function DataSourcesPanel({ realData = [], syntheticData = [], unavailableData = [], defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasAnyData = realData.length > 0 || syntheticData.length > 0 || unavailableData.length > 0;
  if (!hasAnyData) return null;

  return (
    <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-hmi-border/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-hmi-info" />
          <span className="font-semibold text-hmi-text">Data Sources</span>
          <div className="flex items-center gap-2 text-xs">
            {realData.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-hmi-good/20 text-hmi-good border border-hmi-good/30">
                {realData.length} Real
              </span>
            )}
            {syntheticData.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                {syntheticData.length} Synthetic
              </span>
            )}
            {unavailableData.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-hmi-muted/20 text-hmi-muted border border-hmi-border">
                {unavailableData.length} N/A
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-hmi-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-hmi-muted" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-hmi-border pt-3">
          <div className="grid grid-cols-3 gap-4">
            {/* Real Data */}
            {realData.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-hmi-good mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Real Data
                </h4>
                <ul className="space-y-1.5">
                  {realData.map((item, idx) => (
                    <li key={idx} className="text-sm text-hmi-text flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-hmi-good flex-shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Synthetic Data */}
            {syntheticData.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-hmi-highlight mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                  <Calculator className="w-3.5 h-3.5" />
                  Synthetic / Estimated
                </h4>
                <ul className="space-y-1.5">
                  {syntheticData.map((item, idx) => (
                    <li key={idx} className="text-sm text-hmi-muted flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-hmi-highlight flex-shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unavailable Data */}
            {unavailableData.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-hmi-muted mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                  <X className="w-3.5 h-3.5" />
                  Not Available
                </h4>
                <ul className="space-y-1.5">
                  {unavailableData.map((item, idx) => (
                    <li key={idx} className="text-sm text-hmi-muted/70 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-hmi-muted/50 flex-shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Navigation Bar Component
function NavigationBar({ currentView, onNavigate, fileName, onClose }) {
  const navItems = [
    { id: 'analysis', label: 'Overview', icon: LayoutDashboard },
    { id: 'optimizations', label: 'Optimization', icon: Lightbulb },
    { id: 'viewer', label: 'Data Explorer', icon: Table2 },
  ];

  return (
    <header className="h-16 bg-hmi-surface border-b border-hmi-border flex items-center justify-between px-4">
      {/* Left: Facilis Logo */}
      <div className="flex items-center gap-6">
        <img src="./WhiteTextIconBlackBackground.png" alt="Facilis" className="h-10 w-auto" />

        {/* Navigation Tabs */}
        <nav className="flex items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg mx-1 ${
                  isActive
                    ? 'bg-hmi-normal/20 text-hmi-normal'
                    : 'text-hmi-muted hover:text-hmi-text hover:bg-hmi-border/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: File info and SureBeam Logo */}
      <div className="flex items-center gap-4">
        {/* File indicator */}
        {fileName && (
          <div className="flex items-center gap-2 text-sm bg-hmi-bg rounded px-3 py-1.5 border border-hmi-border">
            <FileText className="w-4 h-4 text-hmi-muted" />
            <span className="text-hmi-text">{fileName}</span>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-hmi-border rounded transition-colors"
          title="Close database"
        >
          <X className="w-5 h-5 text-hmi-muted" />
        </button>

        {/* SureBeam Logo */}
        <div className="h-8 w-px bg-hmi-border" />
        <img src="./surebeam-logo.jpg" alt="SureBeam" className="h-10 w-auto rounded" />
      </div>
    </header>
  );
}

// Table List Sidebar with row counts in names
function TableList({ tables, tablesMetadata, selected, onSelect }) {
  const [filter, setFilter] = useState('');

  const filteredTables = tables.filter(t =>
    t.toLowerCase().includes(filter.toLowerCase())
  );

  const getMetadata = (tableName) => {
    return tablesMetadata?.find(m => m.tableName === tableName);
  };

  return (
    <div className="w-72 bg-hmi-surface border-r border-hmi-border flex flex-col">
      <div className="p-4 border-b border-hmi-border">
        <h2 className="text-slate-300 font-semibold">Tables</h2>
        <p className="text-xs text-hmi-muted mt-1">{tables.length} tables</p>
      </div>
      <div className="p-2 border-b border-hmi-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-hmi-muted" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter tables..."
            className="w-full pl-8 pr-3 py-1.5 bg-hmi-bg border border-hmi-border rounded text-sm placeholder:text-hmi-muted"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredTables.map(table => {
          const meta = getMetadata(table);
          return (
            <button
              key={table}
              onClick={() => onSelect(table)}
              className={`w-full text-left px-4 py-3 hover:bg-hmi-border/50 transition-colors border-b border-hmi-border/30 ${
                selected === table ? 'bg-hmi-normal/10 border-l-2 border-l-hmi-normal' : ''
              }`}
            >
              <div className={`font-medium text-sm ${selected === table ? 'text-hmi-normal' : 'text-hmi-text'}`}>
                {table}
                {meta && (
                  <span className="ml-2 text-hmi-muted font-normal">
                    ({formatNumber(meta.rowCount)})
                  </span>
                )}
              </div>
              {meta && (
                <div className="flex items-center gap-3 mt-1.5 text-xs text-hmi-muted">
                  <span className="flex items-center gap-1" title="Columns">
                    <Columns3 className="w-3 h-3" />
                    {meta.columnCount} cols
                  </span>
                  {meta.primaryKeys.length > 0 && (
                    <span className="flex items-center gap-1 text-hmi-highlight" title={`PK: ${meta.primaryKeys.join(', ')}`}>
                      <Key className="w-3 h-3" />
                      {meta.primaryKeys.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
        {filteredTables.length === 0 && (
          <div className="p-4 text-hmi-muted text-sm">No tables match filter</div>
        )}
      </div>
    </div>
  );
}

// Data Grid
function DataGrid({ table, data, columns, pagination, onPageChange, onSort, sortBy, sortDir, loading }) {
  if (!table) {
    return (
      <div className="flex-1 flex items-center justify-center text-hmi-muted">
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Select a table to view data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-hmi-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-hmi-text">{table}</h2>
          <p className="text-xs text-hmi-muted">
            {pagination.total?.toLocaleString() || 0} rows
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="px-3 py-1 bg-hmi-border rounded disabled:opacity-50 hover:bg-hmi-border/70"
          >
            Prev
          </button>
          <span className="text-hmi-muted">
            Page {pagination.page || 1} of {pagination.totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="px-3 py-1 bg-hmi-border rounded disabled:opacity-50 hover:bg-hmi-border/70"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-hmi-bg/80 z-10">
            <div className="text-center">
              <Loader2 className="w-10 h-10 mx-auto mb-3 text-slate-400 animate-spin" />
              <p className="text-hmi-muted">Loading data...</p>
            </div>
          </div>
        ) : null}
        {data.length === 0 && !loading ? (
          <div className="p-8 text-center text-hmi-muted">No data in this table</div>
        ) : data.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-hmi-surface sticky top-0">
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    onClick={() => onSort(col)}
                    className="px-3 py-2 text-left text-hmi-muted font-medium border-b border-hmi-border cursor-pointer hover:text-slate-300"
                  >
                    {col}
                    {sortBy === col && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-hmi-border/30">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 border-b border-hmi-border/50 max-w-xs truncate">
                      {row[col] === null ? (
                        <span className="text-hmi-muted italic">NULL</span>
                      ) : typeof row[col] === 'object' ? (
                        JSON.stringify(row[col])
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

// Schema Panel
function SchemaPanel({ schema, stats, loading }) {
  if (loading) {
    return (
      <div className="w-80 bg-hmi-surface border-l border-hmi-border flex flex-col">
        <div className="p-4 border-b border-hmi-border">
          <h2 className="text-slate-300 font-semibold">Schema</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-slate-400 animate-spin" />
            <p className="text-sm text-hmi-muted">Loading schema...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!schema) return null;

  return (
    <div className="w-80 bg-hmi-surface border-l border-hmi-border flex flex-col">
      <div className="p-4 border-b border-hmi-border">
        <h2 className="text-slate-300 font-semibold">Schema</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {schema.columns.map(col => (
            <div key={col.name} className="p-3 bg-hmi-bg rounded border border-hmi-border">
              <div className="flex items-center gap-2">
                <span className="font-medium text-hmi-text">{col.name}</span>
                {col.primaryKey && (
                  <span className="text-xs px-1.5 py-0.5 bg-hmi-highlight/20 text-hmi-highlight rounded">PK</span>
                )}
              </div>
              <div className="text-xs text-hmi-muted mt-1">
                {col.type} {col.notnull ? '- NOT NULL' : ''}
              </div>
              {stats && stats[col.name] && (
                <div className="text-xs text-hmi-muted mt-2 space-y-1">
                  {stats[col.name].type === 'numeric' ? (
                    <>
                      <div>Min: {stats[col.name].min}</div>
                      <div>Max: {stats[col.name].max}</div>
                      <div>Avg: {stats[col.name].avg?.toFixed(2)}</div>
                    </>
                  ) : (
                    <>
                      <div>Distinct: {stats[col.name].distinctValues}</div>
                      <div>Nulls: {stats[col.name].nullCount}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// SQL Query Panel
function QueryPanel() {
  const [sql, setSql] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = databaseService.executeQuery(sql);
      setResult(res);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-hmi-surface border-t border-hmi-border">
      <div className="p-4 border-b border-hmi-border flex gap-4">
        <textarea
          value={sql}
          onChange={e => setSql(e.target.value)}
          placeholder="Enter SQL query (SELECT only)..."
          className="flex-1 bg-hmi-bg border border-hmi-border rounded px-3 py-2 text-sm font-mono resize-none h-20"
        />
        <button
          onClick={handleExecute}
          disabled={loading || !sql.trim()}
          className="px-6 bg-hmi-normal hover:bg-hmi-normal/80 rounded font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : 'Execute'}
        </button>
      </div>
      {error && (
        <div className="p-4 bg-hmi-alarm/10 text-hmi-alarm text-sm">{error}</div>
      )}
      {result && (
        <div className="max-h-64 overflow-auto">
          <div className="p-2 text-xs text-hmi-muted">
            {result.rowCount} rows in {result.duration}ms
          </div>
          <table className="w-full text-sm">
            <thead className="bg-hmi-bg sticky top-0">
              <tr>
                {result.columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left text-hmi-muted font-medium border-b border-hmi-border">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.slice(0, 100).map((row, i) => (
                <tr key={i} className="hover:bg-hmi-border/30">
                  {result.columns.map(col => (
                    <td key={col} className="px-3 py-2 border-b border-hmi-border/50 max-w-xs truncate">
                      {row[col] === null ? <span className="text-hmi-muted italic">NULL</span> : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Simple Bar Chart Component - HP-HMI compliant with muted accent colors
function SimpleBarChart({ data, labelKey, valueKey, maxBars = 10, color = 'normal' }) {
  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map(d => d[valueKey]));

  // Color variants for bars
  const colorClasses = {
    normal: 'bg-hmi-normal',
    process: 'bg-hmi-process',
    info: 'bg-hmi-info',
    accent: 'bg-hmi-accent',
    highlight: 'bg-hmi-highlight',
    good: 'bg-hmi-good'
  };

  return (
    <div className="space-y-2">
      {displayData.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-24 text-xs text-hmi-muted truncate text-right" title={String(item[labelKey])}>
            {item[labelKey]}
          </div>
          <div className="flex-1 h-6 bg-hmi-border/30 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-500 ${colorClasses[color] || colorClasses.normal}`}
              style={{
                width: `${(item[valueKey] / maxValue) * 100}%`
              }}
            />
          </div>
          <div className="w-16 text-xs text-hmi-text text-right">
            {formatNumber(item[valueKey])}
          </div>
        </div>
      ))}
    </div>
  );
}

// SureBeam Static Analysis Page
function SureBeamAnalysis({ fileName, summary, surebeamStats, onNavigate, onClose }) {
  // Flow diagram data - HP-HMI compliant: muted colors for visual hierarchy
  // Colors indicate data flow stages, NOT status (no red for normal operations)
  const flowData = [
    { label: 'Customers', count: surebeamStats?.customerCount || 455, icon: Users, color: 'bg-hmi-info' },
    { label: 'SPSA Configs', count: surebeamStats?.spsaCount || 1379, icon: Package, color: 'bg-hmi-accent' },
    { label: 'PCN Jobs', count: surebeamStats?.pcnCount || 34032, icon: Activity, color: 'bg-hmi-normal' },
    { label: 'PCN Lots', count: surebeamStats?.lotCount || 34034, icon: Package, color: 'bg-hmi-process' },
    { label: 'Processing Records', count: surebeamStats?.processingCount || 58772, icon: Zap, color: 'bg-hmi-good' },
  ];

  return (
    <div className="h-screen flex flex-col bg-hmi-bg">
      {/* Navigation Bar */}
      <NavigationBar currentView="analysis" onNavigate={onNavigate} fileName={fileName} onClose={onClose} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">

          {/* System Overview */}
          <div className="mb-8 bg-gradient-to-br from-hmi-surface to-hmi-bg rounded-xl border border-hmi-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-hmi-text mb-2">SureBeam Middle East</h2>
                <p className="text-hmi-muted max-w-2xl">
                  Industrial e-beam (electron beam) irradiation processing facility. This database tracks the processing
                  of products through two Linear Accelerators (Pit and Tower) for sterilization and irradiation -
                  primarily food products (dates, chicken, biscuits) and medical supplies.
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-200">{formatNumber(summary.totalRows)}</div>
                <div className="text-sm text-hmi-muted">Total Records</div>
              </div>
            </div>

            {/* Key Stats Row */}
            <div className="grid grid-cols-5 gap-4 mt-6">
              <div className="bg-hmi-bg/50 rounded-lg p-4 border border-hmi-border">
                <div className="flex items-center gap-2 text-hmi-muted text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Operating Since
                </div>
                <div className="text-xl font-bold text-hmi-text">{surebeamStats?.yearRange?.min || 2011}</div>
              </div>
              <div className="bg-hmi-bg/50 rounded-lg p-4 border border-hmi-border">
                <div className="flex items-center gap-2 text-hmi-muted text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Years of Data
                </div>
                <div className="text-xl font-bold text-hmi-text">{surebeamStats?.yearRange ? surebeamStats.yearRange.max - surebeamStats.yearRange.min + 1 : 14}+</div>
              </div>
              <div className="bg-hmi-bg/50 rounded-lg p-4 border border-hmi-border">
                <div className="flex items-center gap-2 text-hmi-muted text-xs mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  Device Readings
                </div>
                <div className="text-xl font-bold text-hmi-text">{formatNumber(surebeamStats?.deviceLogCount || 6643054)}</div>
              </div>
              <div className="bg-hmi-bg/50 rounded-lg p-4 border border-hmi-border">
                <div className="flex items-center gap-2 text-hmi-muted text-xs mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  Accelerators
                </div>
                <div className="text-xl font-bold text-hmi-text">2</div>
                <div className="text-xs text-hmi-muted">Pit & Tower</div>
              </div>
              <div className="bg-hmi-bg/50 rounded-lg p-4 border border-hmi-border">
                <div className="flex items-center gap-2 text-hmi-muted text-xs mb-1">
                  <Table2 className="w-3.5 h-3.5" />
                  Database Tables
                </div>
                <div className="text-xl font-bold text-hmi-text">{summary.tableCount}</div>
              </div>
            </div>
          </div>

          {/* Business Flow Diagram */}
          <div className="mb-8 bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="font-semibold text-hmi-text flex items-center gap-2">
                <Link2 className="w-4 h-4 text-hmi-info" />
                Core Business Flow
              </h2>
              <p className="text-xs text-hmi-muted mt-1">How data flows through the SureBeam processing system</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                {flowData.map((item, idx) => (
                  <div key={item.label} className="flex items-center">
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm font-medium text-hmi-text">{item.label}</div>
                      <div className="text-lg font-bold text-slate-200">{formatNumber(item.count)}</div>
                    </div>
                    {idx < flowData.length - 1 && (
                      <div className="mx-4 flex items-center">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-hmi-border to-hmi-muted"></div>
                        <ChevronRight className="w-5 h-5 text-hmi-muted -ml-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Flow Description */}
              <div className="mt-6 pt-4 border-t border-hmi-border grid grid-cols-5 gap-4 text-xs text-hmi-muted">
                <div>Each customer has multiple product configurations (SPSAs)</div>
                <div>SPSA defines dose limits, load dimensions, dosimeter settings</div>
                <div>PCN tracks individual processing jobs with dates, cartons, carriers</div>
                <div>Each PCN contains one or more lots for tracking</div>
                <div>Per-lot device parameters: speeds, beam currents, doses</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Processing by Year Chart */}
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h2 className="font-semibold text-hmi-text flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-hmi-normal" />
                  Processing Volume by Year
                </h2>
              </div>
              <div className="p-4">
                {surebeamStats?.pcnByYear && surebeamStats.pcnByYear.length > 0 ? (
                  <SimpleBarChart
                    data={surebeamStats.pcnByYear}
                    labelKey="year"
                    valueKey="count"
                    color="normal"
                  />
                ) : (
                  <div className="text-center py-8 text-hmi-muted">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Processing statistics will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Customers Chart */}
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h2 className="font-semibold text-hmi-text flex items-center gap-2">
                  <Users className="w-4 h-4 text-hmi-info" />
                  Top Customers by Processing Jobs
                </h2>
              </div>
              <div className="p-4">
                {surebeamStats?.topCustomers && surebeamStats.topCustomers.length > 0 ? (
                  <SimpleBarChart
                    data={surebeamStats.topCustomers}
                    labelKey="name"
                    valueKey="count"
                    color="info"
                  />
                ) : (
                  <div className="text-center py-8 text-hmi-muted">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Customer statistics will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tables Overview */}
          <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden mb-8">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="font-semibold text-hmi-text flex items-center gap-2">
                <Table2 className="w-4 h-4 text-hmi-accent" />
                Database Tables
              </h2>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-hmi-bg sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-hmi-muted font-medium">Table</th>
                    <th className="text-right px-4 py-2 text-hmi-muted font-medium">Rows</th>
                    <th className="text-right px-4 py-2 text-hmi-muted font-medium">Columns</th>
                    <th className="text-left px-4 py-2 text-hmi-muted font-medium">Primary Key</th>
                    <th className="text-left px-4 py-2 text-hmi-muted font-medium">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.tables.map(table => {
                    // Categorize tables
                    let category = 'Reference';
                    const name = table.tableName.toLowerCase();
                    if (['pcn', 'pcn_lot', 'pcn_lot_processing'].some(t => name.includes(t))) category = 'Core Processing';
                    else if (['device_log', 'data_log'].some(t => name.includes(t))) category = 'Monitoring';
                    else if (['customer', 'spsa', 'user'].some(t => name.includes(t))) category = 'Configuration';
                    else if (['beam_device', 'fault', 'equipment'].some(t => name.includes(t))) category = 'Equipment';

                    return (
                      <tr key={table.tableName} className="hover:bg-hmi-border/30 border-b border-hmi-border/30">
                        <td className="px-4 py-2 text-hmi-text font-medium">{table.tableName}</td>
                        <td className="px-4 py-2 text-right text-hmi-muted">{formatNumber(table.rowCount)}</td>
                        <td className="px-4 py-2 text-right text-hmi-muted">{table.columnCount}</td>
                        <td className="px-4 py-2">
                          {table.primaryKeys.length > 0 ? (
                            <span className="text-xs px-2 py-0.5 bg-hmi-highlight/20 text-hmi-highlight rounded">
                              {table.primaryKeys.join(', ')}
                            </span>
                          ) : (
                            <span className="text-hmi-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            category === 'Core Processing' ? 'bg-hmi-normal/20 text-hmi-normal' :
                            category === 'Monitoring' ? 'bg-hmi-process/20 text-hmi-process' :
                            category === 'Configuration' ? 'bg-hmi-accent/20 text-hmi-accent' :
                            category === 'Equipment' ? 'bg-hmi-info/20 text-hmi-info' :
                            'bg-hmi-border text-hmi-muted'
                          }`}>
                            {category}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Domain Terms */}
          <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden mb-8">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="font-semibold text-hmi-text flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-hmi-process" />
                E-Beam Processing Terminology
              </h2>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              {[
                { term: 'PCN', desc: 'Process Control Number - unique identifier for each processing job' },
                { term: 'SPSA', desc: 'Sterilization Process Setup Agreement - product configuration defining dose limits' },
                { term: 'kGy', desc: 'kiloGray - unit of absorbed radiation dose' },
                { term: 'MeV', desc: 'Mega electron Volt - beam energy measurement' },
                { term: 'LINAC', desc: 'Linear Accelerator - the electron beam source' },
                { term: 'Dosimeter', desc: 'Device to measure absorbed radiation dose' },
                { term: 'Beam Current', desc: 'Electron flow rate in milliamps (mA)' },
                { term: 'Conveyor Speed', desc: 'Product movement speed through beam (m/min)' },
                { term: 'SAL', desc: 'Sterility Assurance Level - probability of non-sterile unit' },
              ].map(item => (
                <div key={item.term} className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                  <div className="font-mono font-bold text-hmi-process text-sm">{item.term}</div>
                  <div className="text-xs text-hmi-muted mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Optimization Opportunities Page
function OptimizationOpportunities({ fileName, surebeamStats, onNavigate, onClose }) {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Data-driven opportunities based on actual database analysis
  const opportunities = [
    {
      id: 'throughput',
      title: 'Throughput & Capacity Optimization',
      icon: Gauge,
      impact: 'High',
      difficulty: 'Medium',
      implementable: 'Partial',
      description: 'Maximize accelerator utilization and reduce changeover time between SPSA configurations.',
      tables: ['PCN', 'PCN_Lot', 'PCN_Lot_Processing'],
      dataAvailable: [
        { item: 'Processing timestamps (start/end)', status: 'available', detail: '33,737 PCNs with start dates, 33,732 with end dates' },
        { item: 'Conveyor speed per lot', status: 'available', detail: '58,720 records with speed data (0-10 range, avg 17.4)' },
        { item: 'Beam current utilization', status: 'available', detail: 'Avg 1,338 mA (Pit) and 1,193 mA (Tower)' },
        { item: 'Accelerator assignment (Pit vs Tower)', status: 'available', detail: '29,365 Pit + 29,355 Tower processing records' },
        { item: 'Cartons/carriers processed per job', status: 'available', detail: 'Number_Of_Cartons_Processed in PCN table' }
      ],
      dataMissing: [
        { item: 'Actual changeover time between jobs', status: 'missing', detail: 'Gap between PCN end and next start not explicitly tracked' },
        { item: 'Equipment idle time logs', status: 'missing', detail: 'No explicit idle state tracking in Device_Log' },
        { item: 'Planned vs actual schedule data', status: 'missing', detail: 'No scheduling/planning table exists' }
      ],
      whatIfAvailable: 'With changeover time data, could identify which SPSA transitions cause longest delays and optimize scheduling to minimize setup changes.',
      metrics: [
        { label: 'PCN Jobs', value: formatNumber(surebeamStats?.pcnCount || 34032) },
        { label: 'Years of Data', value: '14+' },
        { label: 'Accelerators', value: '2 (Pit, Tower)' }
      ]
    },
    {
      id: 'dose',
      title: 'Dose Optimization & Quality',
      icon: Target,
      impact: 'High',
      difficulty: 'Low',
      implementable: 'Limited',
      description: 'Tighten dose delivery to target ranges to reduce energy waste and improve throughput.',
      tables: ['SPSA', 'PCN_Lot_Processing', 'PCN'],
      dataAvailable: [
        { item: 'Target dose ranges per SPSA', status: 'available', detail: '160 SPSAs have Dosimeter_Minimum_Dose and Dosimeter_Maximum_Dose defined (0.8-36 kGy)' },
        { item: 'Dose margin analysis', status: 'available', detail: 'Margins range from 0.7 kGy (tight) to 17 kGy (wide); 7 SPSAs have <5 kGy margin' },
        { item: 'Calculated dose limits per PCN', status: 'available', detail: '7,812 PCNs with Calculated_Dose_High_Limit and Calculated_Dose_Low_Limit' },
        { item: 'Processing parameters (speed, current)', status: 'available', detail: 'Process_Speed and Avg_Beam_Current recorded per lot' }
      ],
      dataMissing: [
        { item: 'ACTUAL DELIVERED DOSE MEASUREMENTS', status: 'critical', detail: 'Calculated_Dose_First/Last in PCN_Lot_Processing: 0 records with data! No dosimetry readings recorded.' },
        { item: 'Dosimeter readings table', status: 'missing', detail: 'No Dosimetry table exists in the database' },
        { item: 'Over-dose/under-dose events', status: 'missing', detail: 'Cannot determine if products received correct dose without actual measurements' },
        { item: 'Reprocessing records', status: 'missing', detail: 'No data on products that failed dose requirements and needed reprocessing' }
      ],
      whatIfAvailable: 'WITH ACTUAL DOSE MEASUREMENTS: Could analyze over-dosing patterns (energy waste), identify products consistently exceeding minimum dose by large margins, and tighten process parameters. Currently can only analyze theoretical limits, not actual delivery.',
      metrics: [
        { label: 'SPSAs with Limits', value: '160' },
        { label: 'Tight Margin SPSAs', value: '7 (<5 kGy margin)' },
        { label: 'Data Gap', value: '0 actual dose readings' }
      ]
    },
    {
      id: 'customer',
      title: 'Customer & Product Mix Optimization',
      icon: Users,
      impact: 'Medium',
      difficulty: 'Low',
      implementable: 'Yes',
      description: 'Optimize scheduling based on customer volume and product similarity for batch processing.',
      tables: ['Customer', 'SPSA', 'PCN'],
      dataAvailable: [
        { item: 'Customer processing volume', status: 'available', detail: 'Top: SUPREME (5,898 PCNs), Nakheel Al Watan (2,426), UNIMED (1,366)' },
        { item: 'SPSA configurations per customer', status: 'available', detail: '1,379 SPSAs across 455 customers; avg 3 SPSAs per customer' },
        { item: 'Product type categorization', status: 'available', detail: 'SPSA_Product_Type_Name field available' },
        { item: 'Dose requirements by product', status: 'available', detail: 'Can group SPSAs by similar dose ranges (e.g., dates: 1-6 kGy, medical: 25-36 kGy)' },
        { item: 'Processing dates and frequency', status: 'available', detail: 'Full date history from 2009-2023' }
      ],
      dataMissing: [
        { item: 'Revenue/pricing per customer', status: 'missing', detail: 'Price_Per_Pound, Case_Price fields mostly empty in SPSA' },
        { item: 'Customer priority/SLA data', status: 'missing', detail: 'No service level or priority classification' },
        { item: 'Product profitability', status: 'missing', detail: 'Cannot determine which products/customers are most profitable' }
      ],
      whatIfAvailable: 'With pricing data, could prioritize high-value customers during peak capacity and identify unprofitable product lines.',
      metrics: [
        { label: 'Customers', value: formatNumber(surebeamStats?.customerCount || 455) },
        { label: 'Top Customer PCNs', value: '5,898 (SUPREME)' },
        { label: 'Avg SPSA/Customer', value: '3.0' }
      ]
    },
    {
      id: 'maintenance',
      title: 'Equipment Reliability & Predictive Maintenance',
      icon: Wrench,
      impact: 'High',
      difficulty: 'High',
      implementable: 'Partial',
      description: 'Use device log data to predict maintenance needs and reduce unplanned downtime.',
      tables: ['Device_Log', 'Beam_Device', 'Fault', 'Fault_Log'],
      dataAvailable: [
        { item: 'Device operational data', status: 'available', detail: '6.6M+ Device_Log entries with timestamp, device ID, element values' },
        { item: 'Fault definitions', status: 'available', detail: 'Fault table contains fault type definitions and descriptions' },
        { item: 'Beam device inventory', status: 'available', detail: '2 beam devices: Pit Linear Accelerator (B11), Tower Linear Accelerator (B12)' },
        { item: 'RF power readings', status: 'available', detail: 'Avg_RF_Forward_Power recorded in processing records' },
        { item: 'Beam current trends', status: 'available', detail: 'Avg_Beam_Current_First/Last/High/Low per processing record' }
      ],
      dataMissing: [
        { item: 'Actual maintenance events', status: 'missing', detail: 'No maintenance log or work order table' },
        { item: 'Downtime records', status: 'missing', detail: 'No explicit downtime tracking - must infer from gaps' },
        { item: 'Component failure history', status: 'missing', detail: 'Cannot correlate sensor readings with actual failures' },
        { item: 'Fault occurrence timestamps', status: 'partial', detail: 'Fault_Log exists but linkage to production impact unclear' }
      ],
      whatIfAvailable: 'With maintenance event records, could correlate sensor trends with actual failures to build predictive models. Currently can only detect anomalies without knowing if they led to failures.',
      metrics: [
        { label: 'Device Readings', value: formatNumber(surebeamStats?.deviceLogCount || 6643054) },
        { label: 'Fault Types', value: 'Defined in Fault table' },
        { label: 'Beam Devices', value: '2' }
      ]
    },
    {
      id: 'parameters',
      title: 'Process Parameter Optimization',
      icon: Activity,
      impact: 'Medium',
      difficulty: 'Medium',
      implementable: 'Partial',
      description: 'Analyze historical parameters to recommend optimal settings for products.',
      tables: ['PCN_Lot_Processing', 'SPSA', 'Process_Table'],
      dataAvailable: [
        { item: 'Conveyor speed settings', status: 'available', detail: 'Process_Speed_First/Last/High/Low for each processing record' },
        { item: 'Beam current settings', status: 'available', detail: 'Avg_Beam_Current values recorded per lot' },
        { item: 'Number of passes', status: 'available', detail: 'Num_Passes in PCN table (typically 1-2)' },
        { item: 'Scan width and magnet settings', status: 'available', detail: 'Scan_Magnet_Current/Frequency recorded' },
        { item: 'Process table configurations', status: 'available', detail: 'Inside/Outside Process Table assignments' }
      ],
      dataMissing: [
        { item: 'Outcome success/failure per run', status: 'critical', detail: 'No actual dose measurement to verify if parameters achieved target dose' },
        { item: 'Parameter adjustment history', status: 'missing', detail: 'Cannot see why parameters were changed between runs' },
        { item: 'Quality feedback loop', status: 'missing', detail: 'No linkage between parameters used and product quality results' }
      ],
      whatIfAvailable: 'WITH ACTUAL DOSE OUTCOMES: Could correlate parameter combinations with dose accuracy to recommend optimal settings. Currently can only see what was used, not whether it worked.',
      metrics: [
        { label: 'Processing Records', value: formatNumber(surebeamStats?.processingCount || 58772) },
        { label: 'Speed Range', value: '0-10 (avg 17.4)' },
        { label: 'SPSAs', value: formatNumber(surebeamStats?.spsaCount || 1379) }
      ]
    },
    {
      id: 'energy',
      title: 'Energy Cost Reduction',
      icon: DollarSign,
      impact: 'Medium',
      difficulty: 'Medium',
      implementable: 'Partial',
      description: 'Optimize energy consumption by analyzing power usage patterns.',
      tables: ['Device_Log', 'PCN_Lot_Processing', 'PCN'],
      dataAvailable: [
        { item: 'RF forward power readings', status: 'available', detail: 'Avg_RF_Forward_Power per processing record' },
        { item: 'Beam current (proxy for power)', status: 'available', detail: 'Current draw correlates with energy consumption' },
        { item: 'Processing timestamps', status: 'available', detail: 'Can analyze time-of-day patterns for peak/off-peak scheduling' },
        { item: 'Processing duration', status: 'available', detail: 'Start/end times allow duration calculation' }
      ],
      dataMissing: [
        { item: 'Actual kWh consumption', status: 'missing', detail: 'No direct power meter readings in database' },
        { item: 'Electricity cost/rate data', status: 'missing', detail: 'No pricing tiers or time-of-use rates stored' },
        { item: 'Idle power consumption', status: 'missing', detail: 'Cannot measure standby vs active power draw' },
        { item: 'Energy per unit processed', status: 'missing', detail: 'Cannot calculate kWh per kg or per carton' }
      ],
      whatIfAvailable: 'With kWh metering data, could calculate actual cost per job, identify inefficient runs, and quantify savings from scheduling optimization.',
      metrics: [
        { label: 'Device Log Entries', value: formatNumber(surebeamStats?.deviceLogCount || 6643054) },
        { label: 'Operating Years', value: '14+' },
        { label: 'Power Data', value: 'RF/Current only' }
      ]
    }
  ];

  // HP-HMI compliant: use muted accent colors for visual hierarchy
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'High': return 'text-hmi-good bg-hmi-good/20';
      case 'Medium': return 'text-hmi-info bg-hmi-info/20';
      default: return 'text-hmi-muted bg-hmi-border/50';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Low': return 'text-hmi-process bg-hmi-process/20';
      case 'Medium': return 'text-hmi-highlight bg-hmi-highlight/20';
      case 'High': return 'text-hmi-accent bg-hmi-accent/20';
      default: return 'text-hmi-muted bg-hmi-border';
    }
  };

  const getImplementableColor = (status) => {
    switch (status) {
      case 'Yes': return 'text-hmi-good bg-hmi-good/20 border-hmi-good/30';
      case 'Partial': return 'text-hmi-highlight bg-hmi-highlight/20 border-hmi-highlight/30';
      case 'Limited': return 'text-hmi-muted bg-hmi-muted/20 border-hmi-muted/30';
      default: return 'text-hmi-muted bg-hmi-border border-hmi-border';
    }
  };

  const getDataStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="w-4 h-4 text-hmi-good flex-shrink-0" />;
      case 'partial': return <AlertTriangle className="w-4 h-4 text-hmi-highlight flex-shrink-0" />;
      case 'missing': return <X className="w-4 h-4 text-hmi-muted flex-shrink-0" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-hmi-alarm flex-shrink-0" />;
      default: return <Info className="w-4 h-4 text-hmi-muted flex-shrink-0" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-hmi-bg">
      {/* Navigation Bar */}
      <NavigationBar currentView="optimizations" onNavigate={onNavigate} fileName={fileName} onClose={onClose} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-hmi-highlight/20 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-hmi-highlight" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-hmi-text">Optimization Opportunities</h2>
                <p className="text-hmi-muted">Data-driven insights to improve operational efficiency</p>
              </div>
            </div>
          </div>

          {/* Priority Matrix Summary */}
          <div className="mb-8 bg-hmi-surface rounded-xl border border-hmi-border p-4">
            <h3 className="font-semibold text-hmi-text mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-hmi-good" />
              Priority Matrix - Data Availability Assessment
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hmi-border">
                    <th className="text-left px-3 py-2 text-hmi-muted font-medium">Opportunity</th>
                    <th className="text-center px-3 py-2 text-hmi-muted font-medium">Impact</th>
                    <th className="text-center px-3 py-2 text-hmi-muted font-medium">Difficulty</th>
                    <th className="text-center px-3 py-2 text-hmi-muted font-medium">Data Status</th>
                    <th className="text-left px-3 py-2 text-hmi-muted font-medium">Key Tables</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map(opp => (
                    <tr key={opp.id} className="border-b border-hmi-border/30 hover:bg-hmi-border/20">
                      <td className="px-3 py-2 text-hmi-text">{opp.title}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getImpactColor(opp.impact)}`}>
                          {opp.impact}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(opp.difficulty)}`}>
                          {opp.difficulty}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getImplementableColor(opp.implementable)}`}>
                          {opp.implementable === 'Yes' ? 'Ready' : opp.implementable === 'Partial' ? 'Partial' : 'Limited'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-hmi-muted text-xs">{opp.tables.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-6 text-xs text-hmi-muted">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-hmi-good/20 text-hmi-good border border-hmi-good/30">Ready</span>
                <span>All required data available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">Partial</span>
                <span>Some data missing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-hmi-muted/20 text-hmi-muted border border-hmi-muted/30">Limited</span>
                <span>Significant data missing</span>
              </div>
            </div>
          </div>

          {/* Opportunity Cards - Simplified (data details shown in matrix above and detail pages) */}
          <div className="space-y-4">
            {opportunities.map(opp => {
              const Icon = opp.icon;
              const hasDetailPage = ['dose', 'throughput', 'customer', 'maintenance', 'energy', 'parameters'].includes(opp.id);

              return (
                <div key={opp.id} className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
                  {/* Card Content */}
                  <div className="p-4 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-hmi-info/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-hmi-info" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-hmi-text mb-1">{opp.title}</h3>
                      <p className="text-sm text-hmi-muted mb-3">{opp.description}</p>

                      {/* Key Metrics Row */}
                      <div className="flex items-center gap-4">
                        {opp.metrics.map((metric, idx) => (
                          <div key={idx} className="bg-hmi-bg/50 rounded px-3 py-1.5 border border-hmi-border">
                            <span className="text-xs text-hmi-muted">{metric.label}: </span>
                            <span className="text-sm font-medium text-hmi-text">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    {hasDetailPage && (
                      <button
                        onClick={() => onNavigate(`${opp.id}-optimization`)}
                        className="px-4 py-2 bg-hmi-info hover:bg-hmi-info/80 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 flex-shrink-0"
                      >
                        View Analysis
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

// Synthetic Dose Data Generator - for demo purposes when actual measurements are missing
const generateSyntheticDoseData = (spsaDetails, yearlyTrends) => {
  // Generate realistic synthetic dose measurements based on SPSA target ranges
  const syntheticMeasurements = [];
  const baseDate = new Date('2023-01-01');

  // For each SPSA, generate synthetic measurement data
  (spsaDetails || []).slice(0, 50).forEach((spsa, idx) => {
    const minDose = spsa.dose_min || 5;
    const maxDose = spsa.dose_max || 15;
    const targetDose = (minDose + maxDose) / 2;
    const margin = maxDose - minDose;

    // Generate 20-50 measurements per SPSA
    const measurementCount = Math.floor(Math.random() * 30) + 20;

    for (let i = 0; i < measurementCount; i++) {
      // Simulate real-world dose delivery patterns
      // Most doses cluster near target with some variation
      const variation = (Math.random() - 0.5) * margin * 0.8;
      const actualDose = targetDose + variation;
      const deviation = ((actualDose - minDose) / (maxDose - minDose)) * 100;

      syntheticMeasurements.push({
        spsa_id: spsa.spsa_id,
        customer: spsa.customer_name || `Customer ${idx + 1}`,
        target_dose: targetDose,
        actual_dose: Math.round(actualDose * 100) / 100,
        min_dose: minDose,
        max_dose: maxDose,
        deviation_percent: Math.round(deviation * 10) / 10,
        in_spec: actualDose >= minDose && actualDose <= maxDose,
        over_target: actualDose > targetDose,
        date: new Date(baseDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  });

  // Calculate synthetic statistics
  const inSpecCount = syntheticMeasurements.filter(m => m.in_spec).length;
  const overDoseCount = syntheticMeasurements.filter(m => m.actual_dose > m.target_dose * 1.1).length;
  const underDoseCount = syntheticMeasurements.filter(m => m.actual_dose < m.target_dose * 0.95).length;
  const avgDeviation = syntheticMeasurements.reduce((sum, m) => sum + Math.abs(m.actual_dose - m.target_dose), 0) / syntheticMeasurements.length;

  // Generate over-dose pattern analysis
  const overDosePatterns = [];
  const customerGroups = {};
  syntheticMeasurements.forEach(m => {
    if (!customerGroups[m.customer]) {
      customerGroups[m.customer] = { overDose: 0, total: 0, avgExcess: 0, totalExcess: 0 };
    }
    customerGroups[m.customer].total++;
    if (m.actual_dose > m.target_dose) {
      customerGroups[m.customer].overDose++;
      customerGroups[m.customer].totalExcess += (m.actual_dose - m.target_dose);
    }
  });

  Object.entries(customerGroups).forEach(([customer, data]) => {
    if (data.overDose > data.total * 0.3) { // More than 30% over-dosed
      overDosePatterns.push({
        customer,
        overDoseRate: Math.round((data.overDose / data.total) * 100),
        avgExcess: Math.round((data.totalExcess / data.overDose) * 100) / 100,
        totalJobs: data.total,
        potentialSavings: Math.round(data.totalExcess * 2.5) // $2.5 per kGy excess
      });
    }
  });

  // Generate energy waste analysis
  const totalExcessEnergy = syntheticMeasurements
    .filter(m => m.actual_dose > m.target_dose)
    .reduce((sum, m) => sum + (m.actual_dose - m.target_dose), 0);

  return {
    measurements: syntheticMeasurements,
    stats: {
      totalMeasurements: syntheticMeasurements.length,
      inSpecRate: Math.round((inSpecCount / syntheticMeasurements.length) * 100),
      overDoseRate: Math.round((overDoseCount / syntheticMeasurements.length) * 100),
      underDoseRate: Math.round((underDoseCount / syntheticMeasurements.length) * 100),
      avgDeviation: Math.round(avgDeviation * 100) / 100,
      totalExcessEnergy: Math.round(totalExcessEnergy * 100) / 100
    },
    overDosePatterns: overDosePatterns.sort((a, b) => b.potentialSavings - a.potentialSavings).slice(0, 10),
    reprocessingRisk: syntheticMeasurements.filter(m => !m.in_spec).length,
    energyWaste: {
      kGyWasted: Math.round(totalExcessEnergy),
      estimatedCost: Math.round(totalExcessEnergy * 12), // ~$12 per kGy of energy
      percentWasted: Math.round((totalExcessEnergy / syntheticMeasurements.reduce((s, m) => s + m.actual_dose, 0)) * 100)
    }
  };
};

// Dose Optimization & Quality Analysis Page
function DoseOptimization({ fileName, surebeamStats, onNavigate, onClose }) {
  const [loading, setLoading] = useState(true);
  const [doseData, setDoseData] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [filters, setFilters] = useState({
    yearStart: '',
    yearEnd: '',
    customer: '',
    accelerator: '',
    packingType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSyntheticData, setShowSyntheticData] = useState(true); // Show synthetic data by default for demo
  const [syntheticData, setSyntheticData] = useState(null);
  const [savingsInputs, setSavingsInputs] = useState({
    energyCostPerKwh: 0.12,
    annualProcessingJobs: surebeamStats?.pcnCount || 34000,
    avgEnergyPerJob: 50 // kWh estimate
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    const data = databaseService.getDoseOptimizationData(filters);
    setDoseData(data);

    const options = databaseService.getDoseFilterOptions();
    setFilterOptions(options);

    // Generate synthetic dose measurement data for demo
    if (data?.spsaDetails?.length > 0) {
      const synthetic = generateSyntheticDoseData(data.spsaDetails, data.yearlyTrends);
      setSyntheticData(synthetic);
    }

    // Set default year range if available
    if (options?.years?.length > 0 && !filters.yearStart) {
      setFilters(prev => ({
        ...prev,
        yearStart: options.years[0],
        yearEnd: options.years[options.years.length - 1]
      }));
    }

    setLoading(false);
  };

  const applyFilters = () => {
    loadData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      yearStart: filterOptions?.years?.[0] || '',
      yearEnd: filterOptions?.years?.[filterOptions?.years?.length - 1] || '',
      customer: '',
      accelerator: '',
      packingType: ''
    });
    loadData();
  };

  // Calculate savings estimate based on user inputs
  const calculatedSavings = useMemo(() => {
    if (!doseData?.savingsEstimate) return null;

    const { optimizationPotential, estimatedEnergySavingsPercent } = doseData.savingsEstimate;
    const { energyCostPerKwh, annualProcessingJobs, avgEnergyPerJob } = savingsInputs;

    const annualEnergyCost = annualProcessingJobs * avgEnergyPerJob * energyCostPerKwh;
    const potentialSavings = annualEnergyCost * (estimatedEnergySavingsPercent / 100);

    return {
      annualEnergyCost,
      potentialSavings,
      savingsPercent: estimatedEnergySavingsPercent,
      optimizableSPSAs: Math.round(annualProcessingJobs * (optimizationPotential / 100))
    };
  }, [doseData, savingsInputs]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-hmi-bg">
        <NavigationBar currentView="dose-optimization" onNavigate={onNavigate} fileName={fileName} onClose={onClose} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-hmi-normal animate-spin" />
            <p className="text-hmi-muted">Analyzing dose optimization data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-hmi-bg">
      {/* Navigation Bar */}
      <NavigationBar currentView="dose-optimization" onNavigate={onNavigate} fileName={fileName} onClose={onClose} />

      {/* Sub-navigation */}
      <div className="bg-hmi-surface border-b border-hmi-border px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
            <Target className="w-4 h-4 text-hmi-good" />
            Dose Optimization & Quality
          </h3>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            showFilters ? 'bg-hmi-normal/20 text-hmi-normal' : 'bg-hmi-border/50 text-hmi-muted hover:text-hmi-text'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filters.customer || filters.accelerator) && (
            <span className="w-2 h-2 rounded-full bg-hmi-normal" />
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-hmi-surface border-b border-hmi-border px-6 py-4">
          <div className="max-w-5xl mx-auto grid grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-hmi-muted mb-1">Year Start</label>
              <select
                value={filters.yearStart}
                onChange={(e) => setFilters(prev => ({ ...prev, yearStart: e.target.value }))}
                className="w-full bg-hmi-bg border border-hmi-border rounded px-2 py-1.5 text-sm text-hmi-text"
              >
                <option value="">All</option>
                {filterOptions?.years?.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-hmi-muted mb-1">Year End</label>
              <select
                value={filters.yearEnd}
                onChange={(e) => setFilters(prev => ({ ...prev, yearEnd: e.target.value }))}
                className="w-full bg-hmi-bg border border-hmi-border rounded px-2 py-1.5 text-sm text-hmi-text"
              >
                <option value="">All</option>
                {filterOptions?.years?.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-hmi-muted mb-1">Customer</label>
              <select
                value={filters.customer}
                onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
                className="w-full bg-hmi-bg border border-hmi-border rounded px-2 py-1.5 text-sm text-hmi-text"
              >
                <option value="">All Customers</option>
                {filterOptions?.customers?.map(cust => (
                  <option key={cust} value={cust}>{cust}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-hmi-muted mb-1">Accelerator</label>
              <select
                value={filters.accelerator}
                onChange={(e) => setFilters(prev => ({ ...prev, accelerator: e.target.value }))}
                className="w-full bg-hmi-bg border border-hmi-border rounded px-2 py-1.5 text-sm text-hmi-text"
              >
                <option value="">All</option>
                {filterOptions?.accelerators?.map(accel => (
                  <option key={accel} value={accel}>{accel}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-1.5 bg-hmi-normal hover:bg-hmi-normal/80 rounded text-sm text-white transition-colors"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 bg-hmi-border hover:bg-hmi-border/70 rounded text-sm text-hmi-muted transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">

          {/* Data Sources Panel - Single source of truth for data transparency */}
          <DataSourcesPanel
            realData={[
              'SPSA configurations (dose ranges)',
              'Processing timestamps & durations',
              'Accelerator utilization data',
              'Customer & product assignments',
              'Conveyor speed settings'
            ]}
            syntheticData={showSyntheticData ? [
              'Dose measurements (simulated)',
              'Over-dose patterns (calculated)',
              'Energy waste estimates',
              'Savings projections'
            ] : []}
            unavailableData={[
              'Actual dosimeter readings',
              'Real-time dose measurements',
              'Reprocessing records'
            ]}
            defaultExpanded={false}
          />

          {/* Synthetic Data Analysis Section */}
          {showSyntheticData && syntheticData && (
            <div className="mb-8 space-y-6">
              {/* Synthetic Data Stats Cards */}
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                  <div className="flex items-center gap-2 text-hmi-highlight text-xs mb-1">
                    <Activity className="w-4 h-4" />
                    Synthetic Measurements
                  </div>
                  <div className="text-xl font-bold text-hmi-text">
                    {formatNumber(syntheticData.stats.totalMeasurements)}
                  </div>
                  <div className="text-xs text-hmi-muted mt-1">Generated for demo</div>
                </div>
                <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                  <div className="flex items-center gap-2 text-hmi-good text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    In-Spec Rate
                  </div>
                  <div className="text-xl font-bold text-hmi-good">
                    {syntheticData.stats.inSpecRate}%
                  </div>
                  <div className="text-xs text-hmi-muted mt-1">Within tolerance</div>
                </div>
                <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                  <div className="flex items-center gap-2 text-hmi-highlight text-xs mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Over-Dose Rate
                  </div>
                  <div className="text-xl font-bold text-hmi-highlight">
                    {syntheticData.stats.overDoseRate}%
                  </div>
                  <div className="text-xs text-hmi-muted mt-1">Above target by 10%+</div>
                </div>
                <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                  <div className="flex items-center gap-2 text-hmi-warning text-xs mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Reprocessing Risk
                  </div>
                  <div className="text-xl font-bold text-hmi-warning">
                    {syntheticData.reprocessingRisk}
                  </div>
                  <div className="text-xs text-hmi-muted mt-1">Out of spec</div>
                </div>
                <div className="bg-hmi-good/10 rounded-lg p-3 border border-hmi-good/30">
                  <div className="flex items-center gap-2 text-hmi-good text-xs mb-1">
                    <DollarSign className="w-4 h-4" />
                    Energy Waste
                  </div>
                  <div className="text-xl font-bold text-hmi-good">
                    ${formatNumber(syntheticData.energyWaste.estimatedCost)}
                  </div>
                  <div className="text-xs text-hmi-muted mt-1">{syntheticData.energyWaste.percentWasted}% wasted</div>
                </div>
              </div>

              {/* Over-Dose Patterns Table */}
              <div className="bg-hmi-bg/30 rounded-lg border border-hmi-border overflow-hidden">
                <div className="p-3 border-b border-hmi-border bg-hmi-bg/50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-hmi-highlight" />
                      Over-Dose Pattern Analysis
                      <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">SYNTHETIC</span>
                    </h4>
                    <p className="text-xs text-hmi-muted mt-1">Customers with highest over-dosing rates (simulated data)</p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-64">
                  {syntheticData.overDosePatterns.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-hmi-surface">
                        <tr className="border-b border-hmi-border">
                          <th className="text-left px-3 py-2 text-hmi-muted font-medium">Customer</th>
                          <th className="text-right px-3 py-2 text-hmi-muted font-medium">Jobs</th>
                          <th className="text-right px-3 py-2 text-hmi-muted font-medium">Over-Dose Rate</th>
                          <th className="text-right px-3 py-2 text-hmi-muted font-medium">Avg Excess (kGy)</th>
                          <th className="text-right px-3 py-2 text-hmi-muted font-medium">Est. Savings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syntheticData.overDosePatterns.map((pattern, idx) => (
                          <tr key={idx} className="border-b border-hmi-border/30 hover:bg-hmi-border/20">
                            <td className="px-3 py-2 text-hmi-text font-medium">{pattern.customer}</td>
                            <td className="px-3 py-2 text-right text-hmi-muted">{pattern.totalJobs}</td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-hmi-highlight font-medium">{pattern.overDoseRate}%</span>
                            </td>
                            <td className="px-3 py-2 text-right text-hmi-muted">{pattern.avgExcess} kGy</td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-hmi-good font-medium">${pattern.potentialSavings}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-hmi-muted">
                      No significant over-dose patterns detected in synthetic data
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Divider between synthetic and real data */}
          {showSyntheticData && syntheticData && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-hmi-border" />
              <span className="text-xs text-hmi-muted uppercase tracking-wider">Real Database Analysis (Available Data)</span>
              <div className="flex-1 h-px bg-hmi-border" />
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-hmi-surface rounded-xl border border-hmi-border p-4">
              <div className="flex items-center gap-2 text-hmi-muted text-xs mb-2">
                <Package className="w-4 h-4" />
                Total SPSA Configs
              </div>
              <div className="text-2xl font-bold text-hmi-text">
                {formatNumber(doseData?.spsaDetails?.length || surebeamStats?.spsaCount || 0)}
              </div>
            </div>
            <div className="bg-hmi-surface rounded-xl border border-hmi-border p-4">
              <div className="flex items-center gap-2 text-hmi-muted text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-hmi-highlight" />
                Wide Margin (Potential Over-dose)
              </div>
              <div className="text-2xl font-bold text-hmi-highlight">
                {doseData?.overUnderDose?.over || 0}
                <span className="text-sm font-normal text-hmi-muted ml-2">
                  ({doseData?.overUnderDose?.total > 0
                    ? ((doseData.overUnderDose.over / doseData.overUnderDose.total) * 100).toFixed(1)
                    : 0}%)
                </span>
              </div>
            </div>
            <div className="bg-hmi-surface rounded-xl border border-hmi-border p-4">
              <div className="flex items-center gap-2 text-hmi-muted text-xs mb-2">
                <CheckCircle2 className="w-4 h-4 text-hmi-good" />
                Optimal Range
              </div>
              <div className="text-2xl font-bold text-hmi-good">
                {doseData?.overUnderDose?.optimal || 0}
                <span className="text-sm font-normal text-hmi-muted ml-2">
                  ({doseData?.overUnderDose?.total > 0
                    ? ((doseData.overUnderDose.optimal / doseData.overUnderDose.total) * 100).toFixed(1)
                    : 0}%)
                </span>
              </div>
            </div>
            <div className="bg-hmi-surface rounded-xl border border-hmi-border p-4">
              <div className="flex items-center gap-2 text-hmi-muted text-xs mb-2">
                <Target className="w-4 h-4 text-hmi-info" />
                Tight Margin (Risk of Under-dose)
              </div>
              <div className="text-2xl font-bold text-hmi-info">
                {doseData?.overUnderDose?.under || 0}
                <span className="text-sm font-normal text-hmi-muted ml-2">
                  ({doseData?.overUnderDose?.total > 0
                    ? ((doseData.overUnderDose.under / doseData.overUnderDose.total) * 100).toFixed(1)
                    : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Dose Distribution Histogram */}
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-hmi-normal" />
                  Dose Distribution by Target Range (kGy)
                </h3>
                <p className="text-xs text-hmi-muted mt-1">SPSAs grouped by target dose midpoint</p>
              </div>
              <div className="p-4">
                {doseData?.doseDistribution?.length > 0 ? (
                  <div className="space-y-2">
                    {doseData.doseDistribution.map((bucket, idx) => {
                      const maxCount = Math.max(...doseData.doseDistribution.map(b => b.count));
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-hmi-muted text-right font-mono">
                            {bucket.range} kGy
                          </div>
                          <div className="flex-1 h-6 bg-hmi-border/30 rounded overflow-hidden relative">
                            <div
                              className="h-full bg-hmi-normal rounded transition-all duration-500"
                              style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                            />
                            <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                              {bucket.count > maxCount * 0.1 ? bucket.count : ''}
                            </span>
                          </div>
                          <div className="w-12 text-xs text-hmi-text text-right">{bucket.count}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-hmi-muted opacity-50" />
                    <p className="text-hmi-muted font-medium">No Dose Distribution Data</p>
                    <p className="text-xs text-hmi-muted mt-2 max-w-md mx-auto">
                      SPSA dose specifications (Dosimeter_Minimum_Dose / Dosimeter_Maximum_Dose)
                      not found or all values are NULL. Dose distribution analysis requires
                      dose limits to be defined for products.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Over/Under Dose Breakdown */}
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-hmi-process" />
                  Dose Margin Analysis
                </h3>
                <p className="text-xs text-hmi-muted mt-1">SPSAs categorized by dose range margin</p>
              </div>
              <div className="p-4">
                {doseData?.overUnderDose?.total > 0 ? (
                  <div className="space-y-4">
                    {/* Visual breakdown bars */}
                    <div className="h-8 rounded-lg overflow-hidden flex">
                      <div
                        className="bg-hmi-highlight flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${(doseData.overUnderDose.over / doseData.overUnderDose.total) * 100}%` }}
                      >
                        {doseData.overUnderDose.over > doseData.overUnderDose.total * 0.1 && 'Wide'}
                      </div>
                      <div
                        className="bg-hmi-good flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${(doseData.overUnderDose.optimal / doseData.overUnderDose.total) * 100}%` }}
                      >
                        {doseData.overUnderDose.optimal > doseData.overUnderDose.total * 0.1 && 'Optimal'}
                      </div>
                      <div
                        className="bg-hmi-info flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${(doseData.overUnderDose.under / doseData.overUnderDose.total) * 100}%` }}
                      >
                        {doseData.overUnderDose.under > doseData.overUnderDose.total * 0.1 && 'Tight'}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded bg-hmi-highlight" />
                          <span className="text-xs text-hmi-muted">Wide Margin (&gt;30%)</span>
                        </div>
                        <div className="text-lg font-bold text-hmi-highlight">{doseData.overUnderDose.over}</div>
                        <p className="text-xs text-hmi-muted mt-1">Potential energy waste</p>
                      </div>
                      <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded bg-hmi-good" />
                          <span className="text-xs text-hmi-muted">Optimal (10-30%)</span>
                        </div>
                        <div className="text-lg font-bold text-hmi-good">{doseData.overUnderDose.optimal}</div>
                        <p className="text-xs text-hmi-muted mt-1">Well-controlled</p>
                      </div>
                      <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded bg-hmi-info" />
                          <span className="text-xs text-hmi-muted">Tight (&lt;10%)</span>
                        </div>
                        <div className="text-lg font-bold text-hmi-info">{doseData.overUnderDose.under}</div>
                        <p className="text-xs text-hmi-muted mt-1">Under-dose risk</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="w-8 h-8 mx-auto mb-2 text-hmi-muted opacity-50" />
                    <p className="text-hmi-muted font-medium">No Margin Analysis Data</p>
                    <p className="text-xs text-hmi-muted mt-2 max-w-md mx-auto">
                      Margin analysis requires SPSA products with both minimum and maximum
                      dose specifications. Check that Dosimeter_Minimum_Dose and
                      Dosimeter_Maximum_Dose columns have non-null values.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Heatmap */}
          <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden mb-6">
            <div className="p-4 border-b border-hmi-border">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Users className="w-4 h-4 text-hmi-info" />
                Customer Dose Margin Analysis
              </h3>
              <p className="text-xs text-hmi-muted mt-1">Customers sorted by average dose margin percentage (higher = more potential for optimization)</p>
            </div>
            <div className="p-4">
              {doseData?.customerHeatmap?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-hmi-border">
                        <th className="text-left px-3 py-2 text-hmi-muted font-medium">Customer</th>
                        <th className="text-right px-3 py-2 text-hmi-muted font-medium">SPSAs</th>
                        <th className="text-right px-3 py-2 text-hmi-muted font-medium">Avg Min (kGy)</th>
                        <th className="text-right px-3 py-2 text-hmi-muted font-medium">Avg Max (kGy)</th>
                        <th className="text-right px-3 py-2 text-hmi-muted font-medium">Avg Range</th>
                        <th className="text-right px-3 py-2 text-hmi-muted font-medium">Margin %</th>
                        <th className="px-3 py-2 text-hmi-muted font-medium">Optimization Potential</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doseData.customerHeatmap.slice(0, 15).map((customer, idx) => {
                        const maxMargin = Math.max(...doseData.customerHeatmap.map(c => c.marginPercent));
                        const marginLevel = customer.marginPercent > 30 ? 'high' : customer.marginPercent > 15 ? 'medium' : 'low';
                        return (
                          <tr key={idx} className="border-b border-hmi-border/30 hover:bg-hmi-border/20">
                            <td className="px-3 py-2 text-hmi-text font-medium truncate max-w-[200px]" title={customer.customer}>
                              {customer.customer}
                            </td>
                            <td className="px-3 py-2 text-right text-hmi-muted">{customer.count}</td>
                            <td className="px-3 py-2 text-right text-hmi-muted">{customer.minDoseAvg.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right text-hmi-muted">{customer.maxDoseAvg.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right text-hmi-muted">{customer.avgRange.toFixed(1)}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={`font-medium ${
                                marginLevel === 'high' ? 'text-hmi-highlight' :
                                marginLevel === 'medium' ? 'text-hmi-process' : 'text-hmi-good'
                              }`}>
                                {customer.marginPercent.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="w-full h-4 bg-hmi-border/30 rounded overflow-hidden">
                                <div
                                  className={`h-full rounded transition-all ${
                                    marginLevel === 'high' ? 'bg-hmi-highlight' :
                                    marginLevel === 'medium' ? 'bg-hmi-process' : 'bg-hmi-good'
                                  }`}
                                  style={{ width: `${(customer.marginPercent / maxMargin) * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-hmi-muted">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No customer data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Processing Trends */}
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-hmi-process" />
                  Processing Volume Trend
                </h3>
                <p className="text-xs text-hmi-muted mt-1">Annual PCN jobs processed</p>
              </div>
              <div className="p-4">
                {doseData?.yearlyTrends?.length > 0 ? (
                  <div className="space-y-2">
                    {doseData.yearlyTrends.map((year, idx) => {
                      const maxCount = Math.max(...doseData.yearlyTrends.map(y => y.pcn_count));
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-12 text-xs text-hmi-muted text-right font-mono">{year.year}</div>
                          <div className="flex-1 h-5 bg-hmi-border/30 rounded overflow-hidden">
                            <div
                              className="h-full bg-hmi-process rounded transition-all duration-500"
                              style={{ width: `${(year.pcn_count / maxCount) * 100}%` }}
                            />
                          </div>
                          <div className="w-16 text-xs text-hmi-text text-right">{formatNumber(year.pcn_count)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-hmi-muted">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No trend data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Packing Impact Analysis */}
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                  <Box className="w-4 h-4 text-hmi-accent" />
                  Packing Configuration Impact
                </h3>
                <p className="text-xs text-hmi-muted mt-1">Dose requirements by product depth/density</p>
              </div>
              <div className="p-4">
                {doseData?.packingAnalysis?.length > 0 ? (
                  <div className="space-y-3">
                    {doseData.packingAnalysis.map((packing, idx) => (
                      <div key={idx} className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-hmi-text">{packing.packing}</span>
                          <span className="text-xs text-hmi-muted">{packing.count} SPSAs</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-hmi-muted">Min:</span>
                            <span className="ml-1 text-hmi-text font-mono">{packing.avgDoseMin.toFixed(1)} kGy</span>
                          </div>
                          <div>
                            <span className="text-hmi-muted">Max:</span>
                            <span className="ml-1 text-hmi-text font-mono">{packing.avgDoseMax.toFixed(1)} kGy</span>
                          </div>
                          <div>
                            <span className="text-hmi-muted">Range:</span>
                            <span className="ml-1 text-hmi-process font-mono">{packing.avgRange.toFixed(1)} kGy</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-hmi-muted">
                    <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No packing data available</p>
                    <p className="text-xs mt-1">Packing depth/density columns not found in SPSA table</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Savings Calculator */}
          <div className="bg-gradient-to-br from-hmi-surface to-hmi-bg rounded-xl border border-hmi-border overflow-hidden mb-6">
            <div className="p-4 border-b border-hmi-border">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Calculator className="w-4 h-4 text-hmi-good" />
                Energy Savings Calculator
              </h3>
              <p className="text-xs text-hmi-muted mt-1">Estimate potential savings from dose optimization</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-6">
                {/* Input Parameters */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-hmi-text">Input Parameters</h4>
                  <div>
                    <label className="block text-xs text-hmi-muted mb-1">Energy Cost ($/kWh)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={savingsInputs.energyCostPerKwh}
                      onChange={(e) => setSavingsInputs(prev => ({ ...prev, energyCostPerKwh: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-hmi-bg border border-hmi-border rounded px-3 py-2 text-sm text-hmi-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-hmi-muted mb-1">Annual Processing Jobs</label>
                    <input
                      type="number"
                      value={savingsInputs.annualProcessingJobs}
                      onChange={(e) => setSavingsInputs(prev => ({ ...prev, annualProcessingJobs: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-hmi-bg border border-hmi-border rounded px-3 py-2 text-sm text-hmi-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-hmi-muted mb-1">Avg Energy per Job (kWh)</label>
                    <input
                      type="number"
                      value={savingsInputs.avgEnergyPerJob}
                      onChange={(e) => setSavingsInputs(prev => ({ ...prev, avgEnergyPerJob: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-hmi-bg border border-hmi-border rounded px-3 py-2 text-sm text-hmi-text"
                    />
                  </div>
                </div>

                {/* Analysis Data */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-hmi-text">
                    Analysis Data
                  </h4>
                  {doseData?.savingsEstimate ? (
                    <>
                      <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                        <div className="text-xs text-hmi-muted">Current Avg Margin</div>
                        <div className="text-xl font-bold text-hmi-highlight">
                          {doseData.savingsEstimate.currentAvgMargin?.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                        <div className="text-xs text-hmi-muted">Optimization Potential</div>
                        <div className="text-xl font-bold text-hmi-process">
                          {doseData.savingsEstimate.optimizationPotential?.toFixed(1)}%
                        </div>
                        <div className="text-xs text-hmi-muted mt-1">
                          {doseData.savingsEstimate.spsasWithWideMargin || 0} SPSAs with wide margins
                        </div>
                      </div>
                      {doseData.savingsEstimate.note && (
                        <div className="bg-hmi-highlight/10 rounded-lg p-3 border border-hmi-highlight/30">
                          <div className="text-xs text-hmi-highlight">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {doseData.savingsEstimate.note}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-hmi-border/30 rounded-lg p-4 border border-hmi-border">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-hmi-muted flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-hmi-muted">Dose Data Not Available</div>
                          <div className="text-xs text-hmi-muted/70 mt-1">
                            SPSA dose specifications not in database. See Data Sources panel for details.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estimated Savings */}
                <div className="col-span-2 space-y-4">
                  <h4 className="text-sm font-semibold text-hmi-text">Estimated Annual Savings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-hmi-bg/50 rounded-lg p-4 border border-hmi-border">
                      <div className="text-xs text-hmi-muted mb-1">Current Annual Energy Cost</div>
                      <div className="text-2xl font-bold text-hmi-text">
                        ${calculatedSavings?.annualEnergyCost?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                      </div>
                    </div>
                    <div className="bg-hmi-good/10 rounded-lg p-4 border border-hmi-good/30">
                      <div className="text-xs text-hmi-good mb-1">Potential Annual Savings</div>
                      <div className="text-2xl font-bold text-hmi-good">
                        ${calculatedSavings?.potentialSavings?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                      </div>
                      <div className="text-xs text-hmi-muted mt-1">
                        ({calculatedSavings?.savingsPercent?.toFixed(1) || 0}% reduction)
                      </div>
                    </div>
                  </div>
                  <div className="bg-hmi-bg/30 rounded-lg p-4 border border-hmi-border">
                    <h5 className="text-xs font-semibold text-hmi-muted mb-2">OPTIMIZATION RECOMMENDATIONS</h5>
                    <ul className="space-y-2 text-sm text-hmi-muted">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-hmi-good flex-shrink-0 mt-0.5" />
                        Review {calculatedSavings?.optimizableSPSAs || 0} SPSAs with wide dose margins
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-hmi-good flex-shrink-0 mt-0.5" />
                        Tighten conveyor speed control for high-volume products
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-hmi-good flex-shrink-0 mt-0.5" />
                        Implement real-time dose monitoring for continuous optimization
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accelerator Comparison */}
          {doseData?.acceleratorComparison?.length > 0 && (
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                  <Zap className="w-4 h-4 text-hmi-normal" />
                  Accelerator Utilization
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-4">
                  {doseData.acceleratorComparison.map((accel, idx) => (
                    <div key={idx} className="bg-hmi-bg/50 rounded-lg p-4 border border-hmi-border">
                      <div className="text-sm font-medium text-hmi-text mb-1">{accel.accelerator}</div>
                      <div className="text-2xl font-bold text-hmi-normal">{formatNumber(accel.count)}</div>
                      <div className="text-xs text-hmi-muted">processing jobs</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dose Optimization Recommendations */}
          <div className="bg-gradient-to-br from-hmi-good/10 to-hmi-surface rounded-xl border border-hmi-good/30 overflow-hidden">
            <div className="p-4 border-b border-hmi-good/30">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-hmi-good" />
                Dose Optimization Recommendations
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-hmi-good" />
                    Available with Current Data
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Identify SPSAs with wide dose margins for tightening
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Analyze customer dose requirements by product type
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Review packing configuration impact on dose delivery
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Compare accelerator efficiency for dose optimization
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-muted flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Data Collection Suggestions
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Actual dosimetry readings</strong> - to verify dose delivery accuracy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Quality rejection data</strong> - to correlate dose margins with product quality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Reprocessing records</strong> - to identify dose-related reprocessing costs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Product density measurements</strong> - to optimize dose-depth calculations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Synthetic Throughput Data Generator - for demo purposes when changeover/idle time data is missing
const generateSyntheticThroughputData = (realData) => {
  // Generate realistic synthetic changeover and idle time data
  const syntheticChangeovers = [];
  const syntheticIdlePeriods = [];
  const syntheticScheduleGaps = [];

  // Simulate changeover times between SPSA configurations
  const spsaTypes = ['Medical Devices', 'Dates', 'Spices', 'Cosmetics', 'Food Products', 'Pharmaceuticals'];
  const accelerators = ['Pit Linear Accelerator', 'Tower Linear Accelerator'];

  // Generate changeover analysis
  for (let i = 0; i < 50; i++) {
    const fromSPSA = spsaTypes[Math.floor(Math.random() * spsaTypes.length)];
    let toSPSA = spsaTypes[Math.floor(Math.random() * spsaTypes.length)];
    while (toSPSA === fromSPSA) {
      toSPSA = spsaTypes[Math.floor(Math.random() * spsaTypes.length)];
    }

    // Changeover time depends on similarity of products
    const baseTime = 15; // minutes
    const complexityFactor = Math.random() * 45; // 0-45 additional minutes
    const changeoverTime = Math.round(baseTime + complexityFactor);

    syntheticChangeovers.push({
      from_spsa: fromSPSA,
      to_spsa: toSPSA,
      accelerator: accelerators[Math.floor(Math.random() * accelerators.length)],
      changeover_minutes: changeoverTime,
      occurrences: Math.floor(Math.random() * 100) + 10,
      could_optimize: changeoverTime > 30
    });
  }

  // Generate idle period analysis
  const idleReasons = ['Maintenance', 'Shift Change', 'No Orders', 'Setup', 'Quality Check', 'Unknown'];
  for (let hour = 0; hour < 24; hour++) {
    const isWorkingHour = hour >= 6 && hour < 22;
    const baseIdlePercent = isWorkingHour ? 5 + Math.random() * 15 : 60 + Math.random() * 30;

    syntheticIdlePeriods.push({
      hour: hour,
      hour_label: `${hour.toString().padStart(2, '0')}:00`,
      idle_percent: Math.round(baseIdlePercent),
      primary_reason: idleReasons[Math.floor(Math.random() * idleReasons.length)],
      avg_idle_minutes: Math.round(baseIdlePercent * 0.6)
    });
  }

  // Generate schedule gap analysis (gaps between planned and actual)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  days.forEach((day, idx) => {
    const isWeekend = idx >= 5;
    const plannedJobs = isWeekend ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 40) + 30;
    const variability = isWeekend ? 0.3 : 0.15;
    const actualJobs = Math.round(plannedJobs * (1 - variability + Math.random() * variability * 2));

    syntheticScheduleGaps.push({
      day: day,
      planned_jobs: plannedJobs,
      actual_jobs: actualJobs,
      gap_percent: Math.round(((plannedJobs - actualJobs) / plannedJobs) * 100),
      avg_delay_minutes: Math.round(Math.random() * 30)
    });
  });

  // Calculate summary statistics
  const avgChangeoverTime = syntheticChangeovers.reduce((sum, c) => sum + c.changeover_minutes, 0) / syntheticChangeovers.length;
  const optimizableChangeovers = syntheticChangeovers.filter(c => c.could_optimize).length;
  const totalChangeoverTime = syntheticChangeovers.reduce((sum, c) => sum + (c.changeover_minutes * c.occurrences), 0);
  const potentialSavingsMinutes = syntheticChangeovers
    .filter(c => c.could_optimize)
    .reduce((sum, c) => sum + ((c.changeover_minutes - 20) * c.occurrences), 0);

  return {
    changeovers: syntheticChangeovers.sort((a, b) => b.changeover_minutes - a.changeover_minutes),
    idlePeriods: syntheticIdlePeriods,
    scheduleGaps: syntheticScheduleGaps,
    stats: {
      avgChangeoverMinutes: Math.round(avgChangeoverTime),
      totalChangeoverHours: Math.round(totalChangeoverTime / 60),
      optimizableChangeovers: optimizableChangeovers,
      potentialSavingsHours: Math.round(potentialSavingsMinutes / 60),
      avgIdlePercent: Math.round(syntheticIdlePeriods.reduce((sum, p) => sum + p.idle_percent, 0) / syntheticIdlePeriods.length),
      peakIdleHour: syntheticIdlePeriods.reduce((max, p) => p.idle_percent > max.idle_percent ? p : max, syntheticIdlePeriods[0]).hour_label
    }
  };
};

// Throughput & Capacity Optimization Analysis Page
function ThroughputOptimization({ fileName, surebeamStats, onNavigate, onClose }) {
  const [loading, setLoading] = useState(true);
  const [throughputData, setThroughputData] = useState(null);
  const [showSyntheticData, setShowSyntheticData] = useState(true);
  const [syntheticData, setSyntheticData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    const data = databaseService.getThroughputOptimizationData();
    setThroughputData(data);

    // Generate synthetic data for missing changeover/idle time analysis
    const synthetic = generateSyntheticThroughputData(data);
    setSyntheticData(synthetic);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-hmi-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-hmi-normal animate-spin" />
          <p className="text-hmi-muted">Analyzing throughput and capacity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-hmi-bg overflow-auto">
      {/* Navigation Bar */}
      <NavigationBar
        fileName={fileName}
        currentView="throughput-optimization"
        onNavigate={onNavigate}
        onClose={onClose}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-hmi-info/20 flex items-center justify-center">
                <Gauge className="w-6 h-6 text-hmi-info" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-hmi-text">Throughput & Capacity Optimization</h1>
                <p className="text-hmi-muted">Analyze accelerator utilization and identify scheduling optimization opportunities</p>
              </div>
            </div>
          </div>

          {/* Data Sources Panel */}
          <DataSourcesPanel
            realData={[
              'PCN job records (34K+ jobs)',
              'Accelerator utilization data',
              'Conveyor speed distributions',
              'Daily/weekly throughput patterns',
              'Customer processing volumes'
            ]}
            syntheticData={showSyntheticData ? [
              'Changeover time estimates',
              'Idle period analysis',
              'Schedule gap projections',
              'Optimization savings estimates'
            ] : []}
            unavailableData={[
              'Actual changeover timestamps',
              'Machine idle/downtime logs',
              'Production schedule records'
            ]}
            defaultExpanded={false}
          />

          {/* Key Metrics Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-hmi-surface rounded-xl border border-hmi-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-hmi-info" />
                <span className="text-xs text-hmi-muted">Total PCN Jobs</span>
              </div>
              <div className="text-2xl font-bold text-hmi-text">
                {formatNumber(throughputData?.processingStats?.totalPCNs || surebeamStats?.pcnCount || 0)}
              </div>
              <div className="text-xs text-hmi-muted mt-1">14+ years of data</div>
            </div>

            <div className="bg-hmi-surface rounded-xl border border-hmi-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-hmi-normal" />
                <span className="text-xs text-hmi-muted">Accelerators</span>
              </div>
              <div className="text-2xl font-bold text-hmi-text">
                {throughputData?.acceleratorUtilization?.length || 2}
              </div>
              <div className="text-xs text-hmi-muted mt-1">Pit & Tower</div>
            </div>

            <div className="bg-hmi-surface rounded-xl border border-hmi-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-hmi-good" />
                <span className="text-xs text-hmi-muted">Peak Daily Capacity</span>
              </div>
              <div className="text-2xl font-bold text-hmi-text">
                {throughputData?.processingStats?.peakCapacity || 0}
              </div>
              <div className="text-xs text-hmi-muted mt-1">Jobs per day (historical max)</div>
            </div>

            <div className="bg-hmi-surface rounded-xl border border-hmi-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-hmi-process" />
                <span className="text-xs text-hmi-muted">Avg Utilization</span>
              </div>
              <div className="text-2xl font-bold text-hmi-text">
                {throughputData?.processingStats?.utilizationPercent || 0}%
              </div>
              <div className="text-xs text-hmi-muted mt-1">vs peak capacity</div>
            </div>
          </div>

          {/* Accelerator Utilization */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                  <Zap className="w-4 h-4 text-hmi-normal" />
                  Accelerator Utilization
                </h3>
                <p className="text-xs text-hmi-muted mt-1">Processing jobs by accelerator</p>
              </div>
              <div className="p-4">
                {throughputData?.acceleratorUtilization?.length > 0 ? (
                  <div className="space-y-4">
                    {throughputData.acceleratorUtilization.map((accel, idx) => {
                      const maxJobs = Math.max(...throughputData.acceleratorUtilization.map(a => a.job_count));
                      const percent = (accel.job_count / maxJobs) * 100;
                      return (
                        <div key={idx} className="bg-hmi-bg/50 rounded-lg p-4 border border-hmi-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-hmi-text">{accel.accelerator}</span>
                            <span className="text-lg font-bold text-hmi-normal">{formatNumber(accel.job_count)}</span>
                          </div>
                          <div className="h-3 bg-hmi-border/30 rounded overflow-hidden mb-2">
                            <div
                              className="h-full bg-hmi-normal rounded transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-4 text-xs text-hmi-muted">
                            {accel.avg_speed && (
                              <span>Avg Speed: {accel.avg_speed.toFixed(1)}</span>
                            )}
                            {accel.avg_current && (
                              <span>Avg Current: {Math.round(accel.avg_current)} mA</span>
                            )}
                            <span>Lots: {formatNumber(accel.unique_lots)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-hmi-muted opacity-50" />
                    <p className="text-hmi-muted">No accelerator data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Speed Distribution */}
            <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden">
              <div className="p-4 border-b border-hmi-border">
                <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-hmi-process" />
                  Conveyor Speed Distribution
                </h3>
                <p className="text-xs text-hmi-muted mt-1">Processing jobs by speed setting</p>
              </div>
              <div className="p-4">
                {throughputData?.speedDistribution?.length > 0 ? (
                  <div className="space-y-2">
                    {throughputData.speedDistribution.map((bucket, idx) => {
                      const maxCount = Math.max(...throughputData.speedDistribution.map(b => b.count));
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-16 text-xs text-hmi-muted text-right font-mono">
                            {bucket.speed_range}
                          </div>
                          <div className="flex-1 h-6 bg-hmi-border/30 rounded overflow-hidden relative">
                            <div
                              className="h-full bg-hmi-process rounded transition-all"
                              style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                            />
                            <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                              {bucket.count > maxCount * 0.1 ? formatNumber(bucket.count) : ''}
                            </span>
                          </div>
                          <div className="w-16 text-xs text-hmi-text text-right">{formatNumber(bucket.count)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gauge className="w-8 h-8 mx-auto mb-2 text-hmi-muted opacity-50" />
                    <p className="text-hmi-muted">No speed distribution data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Daily Throughput Pattern */}
          <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden mb-6">
            <div className="p-4 border-b border-hmi-border">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-hmi-info" />
                Daily Throughput Pattern
              </h3>
              <p className="text-xs text-hmi-muted mt-1">Average processing volume by day of week</p>
            </div>
            <div className="p-4">
              {throughputData?.dailyThroughput?.length > 0 ? (
                <div className="grid grid-cols-7 gap-4">
                  {throughputData.dailyThroughput.map((day, idx) => {
                    const maxAvg = Math.max(...throughputData.dailyThroughput.map(d => d.avg_daily));
                    const height = (day.avg_daily / maxAvg) * 100;
                    const isWeekend = day.day_of_week === 'Saturday' || day.day_of_week === 'Sunday';
                    return (
                      <div key={idx} className="text-center">
                        <div className="h-32 flex items-end justify-center mb-2">
                          <div
                            className={`w-full max-w-[40px] rounded-t transition-all ${isWeekend ? 'bg-hmi-muted/30' : 'bg-hmi-info'}`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium text-hmi-text">{day.day_of_week?.slice(0, 3)}</div>
                        <div className="text-sm font-bold text-hmi-info">{day.avg_daily}</div>
                        <div className="text-xs text-hmi-muted">avg/day</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-hmi-muted opacity-50" />
                  <p className="text-hmi-muted">No daily pattern data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Throughput */}
          <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden mb-6">
            <div className="p-4 border-b border-hmi-border">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Users className="w-4 h-4 text-hmi-good" />
                Top Customers by Volume
              </h3>
              <p className="text-xs text-hmi-muted mt-1">Customers with highest processing volume</p>
            </div>
            <div className="p-4">
              {throughputData?.customerThroughput?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-hmi-border">
                        <th className="text-left px-3 py-2 text-hmi-muted font-medium">Customer</th>
                        <th className="text-right px-3 py-2 text-hmi-muted font-medium">PCN Jobs</th>
                        {throughputData.customerThroughput[0]?.total_cartons !== undefined && (
                          <th className="text-right px-3 py-2 text-hmi-muted font-medium">Total Cartons</th>
                        )}
                        <th className="px-3 py-2 text-hmi-muted font-medium">Volume Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {throughputData.customerThroughput.slice(0, 10).map((cust, idx) => {
                        const maxJobs = throughputData.customerThroughput[0]?.pcn_count || 1;
                        return (
                          <tr key={idx} className="border-b border-hmi-border/30 hover:bg-hmi-border/20">
                            <td className="px-3 py-2 text-hmi-text font-medium truncate max-w-[200px]" title={cust.customer}>
                              {cust.customer}
                            </td>
                            <td className="px-3 py-2 text-right text-hmi-text font-mono">{formatNumber(cust.pcn_count)}</td>
                            {cust.total_cartons !== undefined && (
                              <td className="px-3 py-2 text-right text-hmi-muted font-mono">{formatNumber(cust.total_cartons)}</td>
                            )}
                            <td className="px-3 py-2">
                              <div className="w-full h-4 bg-hmi-border/30 rounded overflow-hidden">
                                <div
                                  className="h-full bg-hmi-good rounded transition-all"
                                  style={{ width: `${(cust.pcn_count / maxJobs) * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 text-hmi-muted opacity-50" />
                  <p className="text-hmi-muted">No customer throughput data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Synthetic Data Section - Changeover Analysis */}
          {syntheticData && (
          <div className={`rounded-xl border overflow-hidden mb-6 ${
            showSyntheticData
              ? 'bg-gradient-to-br from-hmi-highlight/10 to-hmi-surface border-hmi-highlight/30'
              : 'bg-hmi-surface border-hmi-border'
          }`}>
            <div className={`p-4 border-b ${showSyntheticData ? 'border-hmi-highlight/30' : 'border-hmi-border'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${showSyntheticData ? 'text-hmi-highlight' : 'text-hmi-muted'}`} />
                    Changeover Time Analysis
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      showSyntheticData
                        ? 'bg-hmi-highlight/20 text-hmi-highlight border-hmi-highlight/30'
                        : 'bg-hmi-border text-hmi-muted border-hmi-border'
                    }`}>
                      SYNTHETIC DATA
                    </span>
                  </h3>
                  <p className="text-xs text-hmi-muted mt-1">
                    {showSyntheticData
                      ? 'Simulated changeover times between SPSA configurations (actual changeover tracking not available in database)'
                      : 'Synthetic data hidden. Showing only real database results.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSyntheticData(!showSyntheticData)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showSyntheticData
                      ? 'bg-hmi-highlight text-white hover:bg-hmi-highlight/80'
                      : 'bg-hmi-normal text-white hover:bg-hmi-normal/80'
                  }`}
                >
                  {showSyntheticData ? 'Hide Synthetic Data' : 'Show Synthetic Data'}
                </button>
              </div>
            </div>

            {showSyntheticData && (
              <div className="p-4">
                {/* Synthetic Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                    <div className="text-xs text-hmi-muted mb-1">Avg Changeover Time</div>
                    <div className="text-xl font-bold text-hmi-highlight">{syntheticData.stats.avgChangeoverMinutes} min</div>
                  </div>
                  <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                    <div className="text-xs text-hmi-muted mb-1">Total Changeover (Annual)</div>
                    <div className="text-xl font-bold text-hmi-text">{formatNumber(syntheticData.stats.totalChangeoverHours)} hrs</div>
                  </div>
                  <div className="bg-hmi-bg/50 rounded-lg p-3 border border-hmi-border">
                    <div className="text-xs text-hmi-muted mb-1">Optimizable Transitions</div>
                    <div className="text-xl font-bold text-hmi-warning">{syntheticData.stats.optimizableChangeovers}</div>
                  </div>
                  <div className="bg-hmi-good/10 rounded-lg p-3 border border-hmi-good/30">
                    <div className="text-xs text-hmi-good mb-1">Potential Savings</div>
                    <div className="text-xl font-bold text-hmi-good">{formatNumber(syntheticData.stats.potentialSavingsHours)} hrs/yr</div>
                  </div>
                </div>

                {/* Changeover Table */}
                <div className="bg-hmi-bg/30 rounded-lg border border-hmi-border overflow-hidden">
                  <div className="p-3 border-b border-hmi-border bg-hmi-bg/50">
                    <h4 className="text-sm font-semibold text-hmi-text">Longest Changeover Transitions (Simulated)</h4>
                  </div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-hmi-surface">
                        <tr className="border-b border-hmi-border">
                          <th className="text-left px-3 py-2 text-hmi-muted font-medium">From Product Type</th>
                          <th className="text-left px-3 py-2 text-hmi-muted font-medium">To Product Type</th>
                          <th className="text-left px-3 py-2 text-hmi-muted font-medium">Accelerator</th>
                          <th className="text-right px-3 py-2 text-hmi-muted font-medium">Time (min)</th>
                          <th className="text-right px-3 py-2 text-hmi-muted font-medium">Occurrences</th>
                          <th className="text-center px-3 py-2 text-hmi-muted font-medium">Optimize?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syntheticData.changeovers.slice(0, 15).map((change, idx) => (
                          <tr key={idx} className="border-b border-hmi-border/30 hover:bg-hmi-border/20">
                            <td className="px-3 py-2 text-hmi-text">{change.from_spsa}</td>
                            <td className="px-3 py-2 text-hmi-text">{change.to_spsa}</td>
                            <td className="px-3 py-2 text-hmi-muted text-xs">{change.accelerator}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={`font-mono font-medium ${change.changeover_minutes > 40 ? 'text-hmi-warning' : change.changeover_minutes > 25 ? 'text-hmi-highlight' : 'text-hmi-text'}`}>
                                {change.changeover_minutes}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-hmi-muted">{change.occurrences}</td>
                            <td className="px-3 py-2 text-center">
                              {change.could_optimize ? (
                                <span className="px-2 py-0.5 rounded text-xs bg-hmi-warning/20 text-hmi-warning">Yes</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-xs bg-hmi-good/20 text-hmi-good">OK</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
          )}

          {/* Hourly Idle Analysis (Synthetic) */}
          {syntheticData && (
            <div className={`rounded-xl border overflow-hidden mb-6 ${
              showSyntheticData
                ? 'bg-gradient-to-br from-hmi-highlight/10 to-hmi-surface border-hmi-highlight/30'
                : 'bg-hmi-surface border-hmi-border'
            }`}>
              <div className={`p-4 border-b ${showSyntheticData ? 'border-hmi-highlight/30' : 'border-hmi-border'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${showSyntheticData ? 'text-hmi-highlight' : 'text-hmi-muted'}`} />
                      Hourly Idle Time Pattern
                      <span className={`px-2 py-0.5 rounded text-xs border ${
                        showSyntheticData
                          ? 'bg-hmi-highlight/20 text-hmi-highlight border-hmi-highlight/30'
                          : 'bg-hmi-border text-hmi-muted border-hmi-border'
                      }`}>
                        SYNTHETIC DATA
                      </span>
                    </h3>
                    <p className="text-xs text-hmi-muted mt-1">
                      {showSyntheticData
                        ? 'Simulated equipment idle percentage by hour (actual idle tracking not available)'
                        : 'Synthetic data hidden. Showing only real database results.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSyntheticData(!showSyntheticData)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showSyntheticData
                        ? 'bg-hmi-highlight text-white hover:bg-hmi-highlight/80'
                        : 'bg-hmi-normal text-white hover:bg-hmi-normal/80'
                    }`}
                  >
                    {showSyntheticData ? 'Hide Synthetic Data' : 'Show Synthetic Data'}
                  </button>
                </div>
              </div>
              {showSyntheticData && (
              <div className="p-4">
                <div className="h-48 flex items-end gap-1">
                  {syntheticData.idlePeriods.map((period, idx) => {
                    const maxHeight = 180; // pixels - slightly less than h-48 (192px)
                    const barHeight = Math.round((period.idle_percent / 100) * maxHeight);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div
                          className={`w-full rounded-t transition-all ${
                            period.idle_percent > 50 ? 'bg-hmi-highlight' :
                            period.idle_percent > 30 ? 'bg-hmi-process' :
                            'bg-hmi-good'
                          }`}
                          style={{ height: `${barHeight}px`, minHeight: '4px' }}
                          title={`${period.hour_label}: ${period.idle_percent}% idle`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-hmi-muted">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-hmi-good" />
                    <span className="text-hmi-muted">&lt;30% idle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-hmi-process" />
                    <span className="text-hmi-muted">30-50% idle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-hmi-highlight" />
                    <span className="text-hmi-muted">&gt;50% idle</span>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* Monthly Volume Trend */}
          <div className="bg-hmi-surface rounded-xl border border-hmi-border overflow-hidden mb-6">
            <div className="p-4 border-b border-hmi-border">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-hmi-process" />
                Monthly Processing Volume
              </h3>
              <p className="text-xs text-hmi-muted mt-1">PCN jobs processed per month (recent 24 months)</p>
            </div>
            <div className="p-4">
              {throughputData?.monthlyVolume?.length > 0 ? (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {throughputData.monthlyVolume.slice(0, 24).map((month, idx) => {
                    const maxCount = Math.max(...throughputData.monthlyVolume.slice(0, 24).map(m => m.pcn_count));
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthName = monthNames[parseInt(month.month) - 1] || month.month;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-hmi-muted text-right font-mono">
                          {monthName} {month.year}
                        </div>
                        <div className="flex-1 h-5 bg-hmi-border/30 rounded overflow-hidden">
                          <div
                            className="h-full bg-hmi-process rounded transition-all"
                            style={{ width: `${(month.pcn_count / maxCount) * 100}%` }}
                          />
                        </div>
                        <div className="w-16 text-xs text-hmi-text text-right font-mono">{formatNumber(month.pcn_count)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-hmi-muted opacity-50" />
                  <p className="text-hmi-muted">No monthly volume data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Recommendations */}
          <div className="bg-gradient-to-br from-hmi-good/10 to-hmi-surface rounded-xl border border-hmi-good/30 overflow-hidden">
            <div className="p-4 border-b border-hmi-good/30">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-hmi-good" />
                Throughput Optimization Recommendations
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-hmi-good" />
                    Available with Current Data
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Analyze accelerator workload balance (Pit vs Tower utilization)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Identify peak processing days for capacity planning
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Review customer volume distribution for scheduling optimization
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Analyze conveyor speed patterns by product type
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-muted flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Data Collection Suggestions
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Changeover time tracking</strong> - to identify longest setup transitions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Equipment idle time logs</strong> - to analyze capacity loss reasons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Planned vs actual schedule</strong> - to measure schedule adherence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Maintenance downtime records</strong> - to calculate OEE</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Customer Optimization Component
function CustomerOptimization({ fileName, surebeamStats, onNavigate, onClose }) {
  const [showSyntheticData, setShowSyntheticData] = useState(true);

  // Generate synthetic customer analysis data
  const customerData = useMemo(() => {
    const topCustomers = [
      { name: 'SUPREME', pcnCount: 5898, spsaCount: 12, avgDose: 8.2, volume: 'High', segment: 'Food', revenue: 2340000, growthRate: 12.5 },
      { name: 'Nakheel Al Watan', pcnCount: 2426, spsaCount: 8, avgDose: 4.5, volume: 'High', segment: 'Dates', revenue: 980000, growthRate: 8.3 },
      { name: 'UNIMED', pcnCount: 1366, spsaCount: 15, avgDose: 25.0, volume: 'Medium', segment: 'Medical', revenue: 1560000, growthRate: 15.2 },
      { name: 'Al Foah', pcnCount: 1124, spsaCount: 6, avgDose: 3.8, volume: 'Medium', segment: 'Dates', revenue: 450000, growthRate: 5.1 },
      { name: 'MedTech Solutions', pcnCount: 987, spsaCount: 22, avgDose: 28.5, volume: 'Medium', segment: 'Medical', revenue: 1230000, growthRate: 22.8 },
      { name: 'Fresh Harvest', pcnCount: 856, spsaCount: 4, avgDose: 2.2, volume: 'Medium', segment: 'Produce', revenue: 320000, growthRate: -3.2 },
      { name: 'Pharma Gulf', pcnCount: 745, spsaCount: 18, avgDose: 30.2, volume: 'Medium', segment: 'Pharma', revenue: 890000, growthRate: 18.4 },
      { name: 'Desert Farms', pcnCount: 632, spsaCount: 5, avgDose: 4.1, volume: 'Low', segment: 'Dates', revenue: 280000, growthRate: 2.1 },
    ];

    const segmentAnalysis = [
      { segment: 'Medical Devices', customers: 45, spsas: 320, avgDose: 27.5, margin: 'High', growth: '+18%', color: 'hmi-accent' },
      { segment: 'Food Products', customers: 180, spsas: 450, avgDose: 5.2, margin: 'Medium', growth: '+8%', color: 'hmi-good' },
      { segment: 'Dates & Agriculture', customers: 120, spsas: 280, avgDose: 3.8, margin: 'Medium', growth: '+5%', color: 'hmi-process' },
      { segment: 'Pharmaceuticals', customers: 35, spsas: 180, avgDose: 28.0, margin: 'High', growth: '+22%', color: 'hmi-info' },
      { segment: 'Cosmetics', customers: 45, spsas: 95, avgDose: 12.5, margin: 'Medium', growth: '+12%', color: 'hmi-highlight' },
      { segment: 'Packaging', customers: 30, spsas: 54, avgDose: 18.0, margin: 'Low', growth: '+3%', color: 'hmi-muted' },
    ];

    const schedulingOpportunities = [
      { type: 'Batch Similar Dose', potential: '$45,000/year', description: 'Group 3-6 kGy products (dates, produce) into single shifts', effort: 'Low', customers: 'Al Foah, Nakheel, Fresh Harvest' },
      { type: 'Dedicated Medical Days', potential: '$62,000/year', description: 'Schedule all 25-36 kGy medical runs on Tue/Thu', effort: 'Medium', customers: 'UNIMED, MedTech, Pharma Gulf' },
      { type: 'Priority Scheduling', potential: '$28,000/year', description: 'Prioritize high-margin medical during peak capacity', effort: 'Low', customers: 'All Medical segment' },
      { type: 'Customer Consolidation', potential: '$18,000/year', description: 'Combine small customer batches with similar requirements', effort: 'Medium', customers: '85 low-volume customers' },
    ];

    return { topCustomers, segmentAnalysis, schedulingOpportunities };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-hmi-bg">
      {/* Navigation Bar */}
      <NavigationBar currentView="customer-optimization" onNavigate={onNavigate} fileName={fileName} onClose={onClose} />

      {/* Sub-navigation */}
      <div className="bg-hmi-surface border-b border-hmi-border px-6 py-2 flex items-center">
        <h3 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
          <Users className="w-4 h-4 text-hmi-info" />
          Customer & Product Mix Optimization
        </h3>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-hmi-text flex items-center gap-3">
                <Users className="w-8 h-8 text-hmi-info" />Customer & Product Mix Optimization
              </h1>
              <p className="text-hmi-muted mt-1">Analysis based on {formatNumber(surebeamStats?.customerCount || 455)} customers and {formatNumber(surebeamStats?.spsaCount || 1379)} SPSAs</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-hmi-good/20 rounded-lg border border-hmi-good/30">
              <CheckCircle2 className="w-4 h-4 text-hmi-good" />
              <span className="text-sm font-medium text-hmi-good">Fully Implementable</span>
            </div>
          </div>

          {/* Data Sources Panel */}
          <DataSourcesPanel
            realData={[
              'Customer list & assignments',
              'SPSA configurations per customer',
              'PCN job counts by customer',
              'Product/segment categorization'
            ]}
            syntheticData={showSyntheticData ? [
              'Revenue estimates',
              'Growth rate projections',
              'Savings calculations',
              'Scheduling optimization models'
            ] : []}
            unavailableData={[
              'Actual revenue/pricing data',
              'Customer profitability metrics',
              'SLA/priority configurations'
            ]}
            defaultExpanded={false}
          />

          {/* KPI Summary */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Customers', value: formatNumber(surebeamStats?.customerCount || 455), icon: Users, color: 'hmi-info' },
              { label: 'Active SPSAs', value: formatNumber(surebeamStats?.spsaCount || 1379), icon: Package, color: 'hmi-accent' },
              { label: 'Potential Savings', value: '$153K/yr', icon: DollarSign, color: 'hmi-good' },
              { label: 'Optimization Score', value: '78%', icon: TrendingUp, color: 'hmi-process' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-hmi-surface rounded-lg p-4 border border-hmi-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-hmi-muted">{kpi.label}</span>
                  <kpi.icon className={`w-5 h-5 text-${kpi.color}`} />
                </div>
                <div className={`text-2xl font-bold text-${kpi.color} mt-2`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Synthetic Data Analysis Section */}
          {showSyntheticData && (
            <>
              {/* Top Customers Table */}
              <div className="bg-hmi-surface rounded-lg border border-hmi-border">
                <div className="p-4 border-b border-hmi-border">
                  <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-hmi-info" />Top Customer Analysis
                    <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                      SYNTHETIC DATA
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-hmi-bg text-xs text-hmi-muted uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-right">PCN Jobs</th>
                        <th className="px-4 py-3 text-right">SPSAs</th>
                        <th className="px-4 py-3 text-center">Segment</th>
                        <th className="px-4 py-3 text-right">Avg Dose</th>
                        <th className="px-4 py-3 text-right">Est. Revenue</th>
                        <th className="px-4 py-3 text-right">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hmi-border">
                      {customerData.topCustomers.map((customer, idx) => (
                        <tr key={idx} className="hover:bg-hmi-bg/50">
                          <td className="px-4 py-3 font-medium text-hmi-text">{customer.name}</td>
                          <td className="px-4 py-3 text-right text-hmi-muted">{formatNumber(customer.pcnCount)}</td>
                          <td className="px-4 py-3 text-right text-hmi-muted">{customer.spsaCount}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              customer.segment === 'Medical' ? 'bg-hmi-accent/20 text-hmi-accent' :
                              customer.segment === 'Dates' ? 'bg-hmi-process/20 text-hmi-process' :
                              customer.segment === 'Pharma' ? 'bg-hmi-info/20 text-hmi-info' :
                              'bg-hmi-good/20 text-hmi-good'
                            }`}>{customer.segment}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-hmi-muted">{customer.avgDose.toFixed(1)} kGy</td>
                          <td className="px-4 py-3 text-right text-hmi-good">${formatNumber(customer.revenue)}</td>
                          <td className={`px-4 py-3 text-right ${customer.growthRate >= 0 ? 'text-hmi-good' : 'text-hmi-alarm'}`}>
                            {customer.growthRate >= 0 ? '+' : ''}{customer.growthRate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Segment Analysis */}
              <div className="bg-hmi-surface rounded-lg border border-hmi-border">
                <div className="p-4 border-b border-hmi-border">
                  <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-hmi-accent" />Market Segment Analysis
                    <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                      SYNTHETIC DATA
                    </span>
                  </h2>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4">
                  {customerData.segmentAnalysis.map((seg, idx) => (
                    <div key={idx} className="p-4 bg-hmi-bg rounded-lg border border-hmi-border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold text-${seg.color}`}>{seg.segment}</h3>
                        <span className={`text-sm text-hmi-good`}>{seg.growth}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-hmi-muted">Customers</span><span className="text-hmi-text">{seg.customers}</span></div>
                        <div className="flex justify-between"><span className="text-hmi-muted">SPSAs</span><span className="text-hmi-text">{seg.spsas}</span></div>
                        <div className="flex justify-between"><span className="text-hmi-muted">Avg Dose</span><span className="text-hmi-text">{seg.avgDose} kGy</span></div>
                        <div className="flex justify-between"><span className="text-hmi-muted">Margin</span>
                          <span className={seg.margin === 'High' ? 'text-hmi-good' : seg.margin === 'Medium' ? 'text-hmi-info' : 'text-hmi-muted'}>{seg.margin}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scheduling Opportunities */}
              <div className="bg-hmi-surface rounded-lg border border-hmi-border">
                <div className="p-4 border-b border-hmi-border">
                  <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-hmi-good" />Scheduling Optimization Opportunities
                    <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                      SYNTHETIC DATA
                    </span>
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {customerData.schedulingOpportunities.map((opp, idx) => (
                    <div key={idx} className="p-4 bg-hmi-bg rounded-lg border border-hmi-border hover:border-hmi-good/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-hmi-text">{opp.type}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs ${opp.effort === 'Low' ? 'bg-hmi-good/20 text-hmi-good' : 'bg-hmi-highlight/20 text-hmi-highlight'}`}>
                              {opp.effort} Effort
                            </span>
                          </div>
                          <p className="text-sm text-hmi-muted mt-1">{opp.description}</p>
                          <p className="text-xs text-hmi-info mt-2">Affects: {opp.customers}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-hmi-good">{opp.potential}</div>
                          <div className="text-xs text-hmi-muted">Estimated Savings</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}

          {/* Customer Optimization Recommendations */}
          <div className="bg-gradient-to-br from-hmi-good/10 to-hmi-surface rounded-xl border border-hmi-good/30 overflow-hidden">
            <div className="p-4 border-b border-hmi-good/30">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-hmi-good" />
                Customer Optimization Recommendations
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-hmi-good" />
                    Available with Current Data
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Group similar-dose customers for batch scheduling
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Implement dedicated accelerator days by segment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Analyze seasonal patterns for capacity planning
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Identify consolidation opportunities for small customers
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-muted flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Data Collection Suggestions
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Revenue/pricing data</strong> - for customer profitability analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Customer priority/SLA data</strong> - for scheduling rules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Product profitability</strong> - for optimization targeting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Customer feedback scores</strong> - to correlate service levels</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Maintenance Optimization Component
function MaintenanceOptimization({ fileName, surebeamStats, onNavigate, onClose }) {
  const [showSyntheticData, setShowSyntheticData] = useState(true);

  // Generate synthetic maintenance analysis data
  const maintenanceData = useMemo(() => {
    const equipmentStatus = [
      { device: 'Pit Linear Accelerator', id: 'B11', status: 'Operational', uptime: 94.2, lastMaint: '2023-11-15', nextMaint: '2024-02-15', health: 87 },
      { device: 'Tower Linear Accelerator', id: 'B12', status: 'Operational', uptime: 91.8, lastMaint: '2023-10-28', nextMaint: '2024-01-28', health: 82 },
    ];

    const faultPatterns = [
      { type: 'RF Power Fluctuation', occurrences: 156, avgDuration: '12 min', impact: 'Medium', trend: 'Increasing', device: 'B11' },
      { type: 'Beam Current Drop', occurrences: 89, avgDuration: '8 min', impact: 'High', trend: 'Stable', device: 'Both' },
      { type: 'Conveyor Speed Variance', occurrences: 234, avgDuration: '3 min', impact: 'Low', trend: 'Decreasing', device: 'Both' },
      { type: 'Cooling System Alert', occurrences: 45, avgDuration: '25 min', impact: 'High', trend: 'Increasing', device: 'B12' },
      { type: 'Vacuum Pressure Warning', occurrences: 67, avgDuration: '15 min', impact: 'Medium', trend: 'Stable', device: 'B11' },
    ];

    const predictiveAlerts = [
      { component: 'RF Klystron (Pit)', risk: 'Medium', daysToAction: 45, indicator: 'Power output degradation 8%', recommendation: 'Schedule inspection during Q1 maintenance window' },
      { component: 'Scan Magnet (Tower)', risk: 'Low', daysToAction: 90, indicator: 'Current variance within spec but trending', recommendation: 'Monitor weekly, no immediate action' },
      { component: 'Cooling Pump #2', risk: 'High', daysToAction: 14, indicator: 'Temperature differential increasing', recommendation: 'Inspect seals and bearings immediately' },
      { component: 'Conveyor Belt Section 3', risk: 'Medium', daysToAction: 30, indicator: 'Speed sensor intermittent', recommendation: 'Replace sensor during next scheduled downtime' },
    ];

    const monthlyDowntime = [
      { month: 'Jan', planned: 24, unplanned: 8 },
      { month: 'Feb', planned: 16, unplanned: 12 },
      { month: 'Mar', planned: 20, unplanned: 6 },
      { month: 'Apr', planned: 32, unplanned: 4 },
      { month: 'May', planned: 18, unplanned: 15 },
      { month: 'Jun', planned: 24, unplanned: 7 },
    ];

    return { equipmentStatus, faultPatterns, predictiveAlerts, monthlyDowntime };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-hmi-bg">
      {/* Navigation Bar */}
      <NavigationBar currentView="maintenance-optimization" onNavigate={onNavigate} fileName={fileName} onClose={onClose} />

      {/* Sub-navigation */}
      <div className="bg-hmi-surface border-b border-hmi-border px-6 py-2 flex items-center">
        <h3 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
          <Wrench className="w-4 h-4 text-hmi-info" />
          Equipment Reliability & Predictive Maintenance
        </h3>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-hmi-text flex items-center gap-3">
                <Wrench className="w-8 h-8 text-hmi-accent" />Equipment Reliability & Predictive Maintenance
              </h1>
              <p className="text-hmi-muted mt-1">Analysis based on {formatNumber(surebeamStats?.deviceLogCount || 6643054)} device log entries</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-hmi-highlight/20 rounded-lg border border-hmi-highlight/30">
              <AlertTriangle className="w-4 h-4 text-hmi-highlight" />
              <span className="text-sm font-medium text-hmi-highlight">Partially Implementable</span>
            </div>
          </div>

          {/* Data Sources Panel */}
          <DataSourcesPanel
            realData={[
              'Device operational logs (6.6M+ entries)',
              'Equipment identifiers (B11, B12)',
              'Fault type definitions',
              'Processing timestamps'
            ]}
            syntheticData={[
              'Health scores & uptime percentages',
              'Maintenance schedules',
              'Predictive alerts & risk levels',
              'Component degradation indicators'
            ]}
            unavailableData={[
              'Actual maintenance event records',
              'Downtime tracking with reason codes',
              'Component failure history',
              'Parts replacement data'
            ]}
          />

          {/* Synthetic Data Banner - Always visible */}
          <div className={`rounded-xl border p-4 ${
            showSyntheticData
              ? 'bg-gradient-to-br from-hmi-highlight/10 to-hmi-surface border-hmi-highlight/30'
              : 'bg-hmi-surface border-hmi-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  showSyntheticData ? 'bg-hmi-highlight/20' : 'bg-hmi-border'
                }`}>
                  <Wrench className={`w-6 h-6 ${showSyntheticData ? 'text-hmi-highlight' : 'text-hmi-muted'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    Predictive Maintenance Analysis
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      showSyntheticData
                        ? 'bg-hmi-highlight/20 text-hmi-highlight border-hmi-highlight/30'
                        : 'bg-hmi-border text-hmi-muted border-hmi-border'
                    }`}>
                      SYNTHETIC DATA
                    </span>
                  </h3>
                  <p className="text-xs text-hmi-muted mt-1">
                    {showSyntheticData
                      ? 'Equipment IDs from database logs. Maintenance schedules, health scores, and fault patterns are predictive models for demonstration.'
                      : 'Synthetic data hidden. Showing only real database results below.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyntheticData(!showSyntheticData)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showSyntheticData
                    ? 'bg-hmi-highlight text-white hover:bg-hmi-highlight/80'
                    : 'bg-hmi-normal text-white hover:bg-hmi-normal/80'
                }`}
              >
                {showSyntheticData ? 'Hide Synthetic Data' : 'Show Synthetic Data'}
              </button>
            </div>
          </div>

          {/* Synthetic Data Analysis Section */}
          {showSyntheticData && (
            <>
          {/* Equipment Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            {maintenanceData.equipmentStatus.map((equip, idx) => (
              <div key={idx} className="bg-hmi-surface rounded-lg border border-hmi-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-hmi-text">{equip.device}</h3>
                    <span className="text-xs text-hmi-muted">ID: {equip.id}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${equip.status === 'Operational' ? 'bg-hmi-good/20 text-hmi-good' : 'bg-hmi-alarm/20 text-hmi-alarm'}`}>
                    {equip.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-hmi-muted mb-1">Uptime</div>
                    <div className="text-2xl font-bold text-hmi-good">{equip.uptime}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-hmi-muted mb-1">Health Score</div>
                    <div className={`text-2xl font-bold ${equip.health >= 85 ? 'text-hmi-good' : equip.health >= 70 ? 'text-hmi-highlight' : 'text-hmi-alarm'}`}>
                      {equip.health}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-hmi-border flex justify-between text-xs">
                  <div><span className="text-hmi-muted">Last Maint:</span> <span className="text-hmi-text">{equip.lastMaint}</span></div>
                  <div><span className="text-hmi-muted">Next Maint:</span> <span className="text-hmi-info">{equip.nextMaint}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Predictive Alerts */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                <Activity className="w-5 h-5 text-hmi-warning" />Predictive Maintenance Alerts
                <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                  SYNTHETIC DATA
                </span>
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {maintenanceData.predictiveAlerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${
                  alert.risk === 'High' ? 'bg-hmi-alarm/10 border-hmi-alarm/30' :
                  alert.risk === 'Medium' ? 'bg-hmi-highlight/10 border-hmi-highlight/30' :
                  'bg-hmi-good/10 border-hmi-good/30'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-hmi-text">{alert.component}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          alert.risk === 'High' ? 'bg-hmi-alarm/20 text-hmi-alarm' :
                          alert.risk === 'Medium' ? 'bg-hmi-highlight/20 text-hmi-highlight' :
                          'bg-hmi-good/20 text-hmi-good'
                        }`}>{alert.risk} Risk</span>
                      </div>
                      <p className="text-sm text-hmi-muted mt-1">{alert.indicator}</p>
                      <p className="text-xs text-hmi-info mt-2">{alert.recommendation}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${alert.daysToAction <= 14 ? 'text-hmi-alarm' : alert.daysToAction <= 30 ? 'text-hmi-highlight' : 'text-hmi-good'}`}>
                        {alert.daysToAction}
                      </div>
                      <div className="text-xs text-hmi-muted">days to action</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fault Pattern Analysis */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-hmi-highlight" />Fault Pattern Analysis
                <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                  SYNTHETIC DATA
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-hmi-bg text-xs text-hmi-muted uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Fault Type</th>
                    <th className="px-4 py-3 text-right">Occurrences</th>
                    <th className="px-4 py-3 text-right">Avg Duration</th>
                    <th className="px-4 py-3 text-center">Impact</th>
                    <th className="px-4 py-3 text-center">Trend</th>
                    <th className="px-4 py-3 text-center">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hmi-border">
                  {maintenanceData.faultPatterns.map((fault, idx) => (
                    <tr key={idx} className="hover:bg-hmi-bg/50">
                      <td className="px-4 py-3 font-medium text-hmi-text">{fault.type}</td>
                      <td className="px-4 py-3 text-right text-hmi-muted">{fault.occurrences}</td>
                      <td className="px-4 py-3 text-right text-hmi-muted">{fault.avgDuration}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          fault.impact === 'High' ? 'bg-hmi-alarm/20 text-hmi-alarm' :
                          fault.impact === 'Medium' ? 'bg-hmi-highlight/20 text-hmi-highlight' :
                          'bg-hmi-good/20 text-hmi-good'
                        }`}>{fault.impact}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm ${
                          fault.trend === 'Increasing' ? 'text-hmi-alarm' :
                          fault.trend === 'Decreasing' ? 'text-hmi-good' :
                          'text-hmi-muted'
                        }`}>{fault.trend}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-hmi-info">{fault.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Downtime Chart */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border p-4">
            <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-hmi-info" />Monthly Downtime (Hours)
            </h2>
            <div className="flex items-end gap-4 h-48">
              {maintenanceData.monthlyDowntime.map((month, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="flex flex-col w-full" style={{ height: `${(month.planned + month.unplanned) * 2}px` }}>
                    <div className="bg-hmi-warning/60 rounded-t" style={{ height: `${month.unplanned * 2}px` }} title={`Unplanned: ${month.unplanned}h`}></div>
                    <div className="bg-hmi-info/60 rounded-b" style={{ height: `${month.planned * 2}px` }} title={`Planned: ${month.planned}h`}></div>
                  </div>
                  <span className="text-xs text-hmi-muted mt-2">{month.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-hmi-info/60"></div><span className="text-hmi-muted">Planned</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-hmi-warning/60"></div><span className="text-hmi-muted">Unplanned</span></div>
            </div>
          </div>

            </>
          )}

          {/* Maintenance Optimization Recommendations */}
          <div className="bg-gradient-to-br from-hmi-good/10 to-hmi-surface rounded-xl border border-hmi-good/30 overflow-hidden">
            <div className="p-4 border-b border-hmi-good/30">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-hmi-good" />
                Maintenance Optimization Recommendations
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-hmi-good" />
                    Available with Current Data
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Analyze device operational logs for fault patterns
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Identify RF power and beam current anomalies
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Detect processing gaps that may indicate issues
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Track fault type frequency and trends over time
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-muted flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Data Collection Suggestions
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Maintenance event records</strong> - for actual intervention tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Downtime tracking logs</strong> - to distinguish planned vs unplanned</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Component failure history</strong> - for root cause correlation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Work order/parts data</strong> - for cost and inventory analysis</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Parameters Optimization Component
function ParametersOptimization({ fileName, surebeamStats, onNavigate, onClose }) {
  const [selectedSpsa, setSelectedSpsa] = useState(null);
  const [showSyntheticData, setShowSyntheticData] = useState(true);

  // Generate synthetic parameter analysis data
  const parameterData = useMemo(() => {
    const spsaParameters = [
      { id: 'SPSA-001', product: 'Medical Device A', customer: 'UNIMED', speedAvg: 4.2, speedStd: 0.3, currentAvg: 1250, currentStd: 45, passes: 2, consistency: 94, jobs: 245 },
      { id: 'SPSA-012', product: 'Dates Premium', customer: 'Nakheel Al Watan', speedAvg: 8.5, speedStd: 0.8, currentAvg: 1100, currentStd: 62, passes: 1, consistency: 87, jobs: 412 },
      { id: 'SPSA-023', product: 'Surgical Kit', customer: 'MedTech', speedAvg: 3.1, speedStd: 0.2, currentAvg: 1380, currentStd: 38, passes: 2, consistency: 96, jobs: 178 },
      { id: 'SPSA-034', product: 'Fresh Produce', customer: 'Fresh Harvest', speedAvg: 12.0, speedStd: 1.2, currentAvg: 950, currentStd: 85, passes: 1, consistency: 78, jobs: 523 },
      { id: 'SPSA-045', product: 'Pharma Packaging', customer: 'Pharma Gulf', speedAvg: 2.8, speedStd: 0.15, currentAvg: 1420, currentStd: 32, passes: 2, consistency: 98, jobs: 156 },
      { id: 'SPSA-056', product: 'Cosmetic Items', customer: 'Beauty Corp', speedAvg: 6.5, speedStd: 0.6, currentAvg: 1150, currentStd: 55, passes: 1, consistency: 89, jobs: 287 },
    ];

    const optimizationSuggestions = [
      { spsa: 'SPSA-034', issue: 'High speed variance', current: '12.0 ± 1.2', recommended: '11.5 ± 0.5', impact: 'Reduce reprocessing by 15%', confidence: 'Medium' },
      { spsa: 'SPSA-012', issue: 'Current fluctuation', current: '1100 ± 62 mA', recommended: '1080 ± 35 mA', impact: 'Improve dose consistency 8%', confidence: 'High' },
      { spsa: 'SPSA-056', issue: 'Suboptimal speed', current: '6.5 m/min', recommended: '7.2 m/min', impact: 'Increase throughput 10%', confidence: 'High' },
      { spsa: 'SPSA-001', issue: 'Potential single-pass', current: '2 passes', recommended: '1 pass @ higher current', impact: 'Reduce cycle time 40%', confidence: 'Low' },
    ];

    const processTableUsage = [
      { table: 'PT-001', description: 'Low dose produce', spsas: 45, avgSpeed: 10.2, avgCurrent: 980 },
      { table: 'PT-002', description: 'Medium dose food', spsas: 78, avgSpeed: 6.5, avgCurrent: 1150 },
      { table: 'PT-003', description: 'High dose medical', spsas: 120, avgSpeed: 3.2, avgCurrent: 1350 },
      { table: 'PT-004', description: 'Ultra-high dose pharma', spsas: 35, avgSpeed: 2.1, avgCurrent: 1450 },
    ];

    return { spsaParameters, optimizationSuggestions, processTableUsage };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-hmi-bg">
      {/* Navigation Bar */}
      <NavigationBar currentView="parameters-optimization" onNavigate={onNavigate} fileName={fileName} onClose={onClose} />

      {/* Sub-navigation */}
      <div className="bg-hmi-surface border-b border-hmi-border px-6 py-2 flex items-center">
        <h3 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
          <Activity className="w-4 h-4 text-hmi-process" />
          Process Parameter Optimization
        </h3>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-hmi-text flex items-center gap-3">
                <Activity className="w-8 h-8 text-hmi-process" />Process Parameter Optimization
              </h1>
              <p className="text-hmi-muted mt-1">Analysis based on {formatNumber(surebeamStats?.processingCount || 58772)} processing records</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-hmi-highlight/20 rounded-lg border border-hmi-highlight/30">
              <AlertTriangle className="w-4 h-4 text-hmi-highlight" />
              <span className="text-sm font-medium text-hmi-highlight">Partially Implementable</span>
            </div>
          </div>

          {/* Data Sources Panel */}
          <DataSourcesPanel
            realData={[
              'Processing records (58K+ entries)',
              'SPSA configurations (1,379 products)',
              'Conveyor speed settings',
              'Beam current values per lot',
              'Number of passes per PCN'
            ]}
            syntheticData={[
              'Consistency scores',
              'Optimization suggestions',
              'Process table usage patterns',
              'Variance calculations'
            ]}
            unavailableData={[
              'Actual dose measurements',
              'Parameter adjustment history',
              'Quality feedback loop data'
            ]}
          />

          {/* KPI Summary */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Processing Records', value: formatNumber(surebeamStats?.processingCount || 58772), icon: Layers, color: 'hmi-info' },
              { label: 'Unique SPSAs', value: formatNumber(surebeamStats?.spsaCount || 1379), icon: Package, color: 'hmi-accent' },
              { label: 'Avg Consistency', value: '89%', icon: Target, color: 'hmi-good' },
              { label: 'Optimization Potential', value: '12%', icon: TrendingUp, color: 'hmi-process' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-hmi-surface rounded-lg p-4 border border-hmi-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-hmi-muted">{kpi.label}</span>
                  <kpi.icon className={`w-5 h-5 text-${kpi.color}`} />
                </div>
                <div className={`text-2xl font-bold text-${kpi.color} mt-2`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Synthetic Data Banner - Always visible */}
          <div className={`rounded-xl border p-4 ${
            showSyntheticData
              ? 'bg-gradient-to-br from-hmi-highlight/10 to-hmi-surface border-hmi-highlight/30'
              : 'bg-hmi-surface border-hmi-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  showSyntheticData ? 'bg-hmi-highlight/20' : 'bg-hmi-border'
                }`}>
                  <Activity className={`w-6 h-6 ${showSyntheticData ? 'text-hmi-highlight' : 'text-hmi-muted'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    Parameter Consistency Analysis
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      showSyntheticData
                        ? 'bg-hmi-highlight/20 text-hmi-highlight border-hmi-highlight/30'
                        : 'bg-hmi-border text-hmi-muted border-hmi-border'
                    }`}>
                      SYNTHETIC DATA
                    </span>
                  </h3>
                  <p className="text-xs text-hmi-muted mt-1">
                    {showSyntheticData
                      ? 'Process parameters from database records. Consistency scores and optimization suggestions are calculated models for demonstration.'
                      : 'Synthetic data hidden. Showing only real database results below.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyntheticData(!showSyntheticData)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showSyntheticData
                    ? 'bg-hmi-highlight text-white hover:bg-hmi-highlight/80'
                    : 'bg-hmi-normal text-white hover:bg-hmi-normal/80'
                }`}
              >
                {showSyntheticData ? 'Hide Synthetic Data' : 'Show Synthetic Data'}
              </button>
            </div>
          </div>

          {/* Synthetic Data Analysis Section */}
          {showSyntheticData && (
            <>
          {/* SPSA Parameter Table */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                <Settings className="w-5 h-5 text-hmi-info" />SPSA Parameter Analysis
                <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                  SYNTHETIC DATA
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-hmi-bg text-xs text-hmi-muted uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">SPSA</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">Speed (m/min)</th>
                    <th className="px-4 py-3 text-right">Current (mA)</th>
                    <th className="px-4 py-3 text-center">Passes</th>
                    <th className="px-4 py-3 text-center">Consistency</th>
                    <th className="px-4 py-3 text-right">Jobs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hmi-border">
                  {parameterData.spsaParameters.map((spsa, idx) => (
                    <tr key={idx} className={`hover:bg-hmi-bg/50 cursor-pointer ${selectedSpsa === spsa.id ? 'bg-hmi-info/10' : ''}`}
                        onClick={() => setSelectedSpsa(selectedSpsa === spsa.id ? null : spsa.id)}>
                      <td className="px-4 py-3 font-mono text-hmi-accent text-sm">{spsa.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-hmi-text">{spsa.product}</div>
                        <div className="text-xs text-hmi-muted">{spsa.customer}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-hmi-text">{spsa.speedAvg.toFixed(1)}</span>
                        <span className="text-hmi-muted text-xs ml-1">± {spsa.speedStd.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-hmi-text">{spsa.currentAvg}</span>
                        <span className="text-hmi-muted text-xs ml-1">± {spsa.currentStd}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-hmi-muted">{spsa.passes}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          spsa.consistency >= 95 ? 'bg-hmi-good/20 text-hmi-good' :
                          spsa.consistency >= 85 ? 'bg-hmi-info/20 text-hmi-info' :
                          'bg-hmi-highlight/20 text-hmi-highlight'
                        }`}>{spsa.consistency}%</span>
                      </td>
                      <td className="px-4 py-3 text-right text-hmi-muted">{spsa.jobs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Optimization Suggestions */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-hmi-good" />Parameter Optimization Suggestions
                <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                  SYNTHETIC DATA
                </span>
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {parameterData.optimizationSuggestions.map((suggestion, idx) => (
                <div key={idx} className="p-4 bg-hmi-bg rounded-lg border border-hmi-border hover:border-hmi-process/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-hmi-accent text-sm">{suggestion.spsa}</span>
                        <span className="text-hmi-text font-medium">{suggestion.issue}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          suggestion.confidence === 'High' ? 'bg-hmi-good/20 text-hmi-good' :
                          suggestion.confidence === 'Medium' ? 'bg-hmi-info/20 text-hmi-info' :
                          'bg-hmi-muted/20 text-hmi-muted'
                        }`}>{suggestion.confidence} Confidence</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div><span className="text-hmi-muted">Current:</span> <span className="text-hmi-text">{suggestion.current}</span></div>
                        <ArrowRight className="w-4 h-4 text-hmi-process" />
                        <div><span className="text-hmi-muted">Recommended:</span> <span className="text-hmi-good">{suggestion.recommended}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-hmi-process">{suggestion.impact}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Table Usage */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                <Table2 className="w-5 h-5 text-hmi-accent" />Process Table Configuration Usage
                <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                  SYNTHETIC DATA
                </span>
              </h2>
            </div>
            <div className="p-4 grid grid-cols-4 gap-4">
              {parameterData.processTableUsage.map((pt, idx) => (
                <div key={idx} className="p-4 bg-hmi-bg rounded-lg border border-hmi-border">
                  <div className="text-lg font-semibold text-hmi-accent">{pt.table}</div>
                  <div className="text-sm text-hmi-muted mb-3">{pt.description}</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-hmi-muted">SPSAs</span><span className="text-hmi-text">{pt.spsas}</span></div>
                    <div className="flex justify-between"><span className="text-hmi-muted">Avg Speed</span><span className="text-hmi-text">{pt.avgSpeed} m/min</span></div>
                    <div className="flex justify-between"><span className="text-hmi-muted">Avg Current</span><span className="text-hmi-text">{pt.avgCurrent} mA</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

            </>
          )}

          {/* Process Parameter Optimization Recommendations */}
          <div className="bg-gradient-to-br from-hmi-good/10 to-hmi-surface rounded-xl border border-hmi-good/30 overflow-hidden">
            <div className="p-4 border-b border-hmi-good/30">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-hmi-good" />
                Process Parameter Optimization Recommendations
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-hmi-good" />
                    Available with Current Data
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Analyze conveyor speed variance by SPSA to identify inconsistencies
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Review beam current patterns for optimization opportunities
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Identify products with potential single-pass conversion
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Compare process table configurations for efficiency gains
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-muted flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Data Collection Suggestions
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Actual dose measurements</strong> - to verify parameter effectiveness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Parameter adjustment history</strong> - to track changes and reasoning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Quality feedback loop data</strong> - to correlate parameters with outcomes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Machine learning training data</strong> - for predictive parameter optimization</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Energy Optimization Component
function EnergyOptimization({ fileName, surebeamStats, onNavigate, onClose }) {
  const [showSyntheticData, setShowSyntheticData] = useState(true);

  // Generate synthetic energy analysis data
  const energyData = useMemo(() => {
    const hourlyUsage = [
      { hour: '00:00', power: 120, jobs: 2 },
      { hour: '02:00', power: 95, jobs: 1 },
      { hour: '04:00', power: 85, jobs: 1 },
      { hour: '06:00', power: 180, jobs: 4 },
      { hour: '08:00', power: 320, jobs: 8 },
      { hour: '10:00', power: 380, jobs: 10 },
      { hour: '12:00', power: 350, jobs: 9 },
      { hour: '14:00', power: 390, jobs: 11 },
      { hour: '16:00', power: 360, jobs: 9 },
      { hour: '18:00', power: 280, jobs: 7 },
      { hour: '20:00', power: 200, jobs: 5 },
      { hour: '22:00', power: 150, jobs: 3 },
    ];

    const acceleratorEfficiency = [
      { device: 'Pit Accelerator', avgPower: 285, peakPower: 420, efficiency: 78, utilizationRate: 72, costPerJob: 12.50 },
      { device: 'Tower Accelerator', avgPower: 265, peakPower: 395, efficiency: 82, utilizationRate: 68, costPerJob: 11.80 },
    ];

    const savingsOpportunities = [
      { type: 'Off-Peak Scheduling', potential: '$48,000/year', description: 'Shift 30% of flexible jobs to off-peak hours (22:00-06:00)', kwhSaved: '180,000 kWh', effort: 'Medium' },
      { type: 'Batch Consolidation', potential: '$25,000/year', description: 'Reduce accelerator warm-up cycles by batching similar-dose products', kwhSaved: '95,000 kWh', effort: 'Low' },
      { type: 'Idle Time Reduction', potential: '$32,000/year', description: 'Minimize standby power between jobs with better scheduling', kwhSaved: '120,000 kWh', effort: 'Medium' },
      { type: 'Power Factor Correction', potential: '$15,000/year', description: 'Optimize power factor to reduce demand charges', kwhSaved: 'N/A (demand)', effort: 'High' },
    ];

    const monthlyEnergy = [
      { month: 'Jan', consumption: 485000, cost: 58200, jobs: 2850 },
      { month: 'Feb', consumption: 462000, cost: 55440, jobs: 2720 },
      { month: 'Mar', consumption: 510000, cost: 61200, jobs: 3010 },
      { month: 'Apr', consumption: 498000, cost: 59760, jobs: 2940 },
      { month: 'May', consumption: 525000, cost: 63000, jobs: 3100 },
      { month: 'Jun', consumption: 540000, cost: 64800, jobs: 3180 },
    ];

    return { hourlyUsage, acceleratorEfficiency, savingsOpportunities, monthlyEnergy };
  }, []);

  const maxPower = Math.max(...energyData.hourlyUsage.map(h => h.power));

  return (
    <div className="h-screen flex flex-col bg-hmi-bg">
      {/* Navigation Bar */}
      <NavigationBar currentView="energy-optimization" onNavigate={onNavigate} fileName={fileName} onClose={onClose} />

      {/* Sub-navigation */}
      <div className="bg-hmi-surface border-b border-hmi-border px-6 py-2 flex items-center">
        <h3 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
          <Zap className="w-4 h-4 text-hmi-highlight" />
          Energy Cost Reduction Analysis
        </h3>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-hmi-text flex items-center gap-3">
                <Zap className="w-8 h-8 text-hmi-highlight" />Energy Cost Reduction Analysis
              </h1>
              <p className="text-hmi-muted mt-1">Power usage patterns from {formatNumber(surebeamStats?.deviceLogCount || 6643054)} device log entries</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-hmi-highlight/20 rounded-lg border border-hmi-highlight/30">
              <AlertTriangle className="w-4 h-4 text-hmi-highlight" />
              <span className="text-sm font-medium text-hmi-highlight">Partially Implementable</span>
            </div>
          </div>

          {/* Data Sources Panel */}
          <DataSourcesPanel
            realData={[
              'RF forward power readings per job',
              'Beam current values',
              'Processing timestamps',
              'Job duration information'
            ]}
            syntheticData={[
              'kWh consumption estimates',
              'Energy costs & pricing',
              'Savings projections',
              'Efficiency calculations'
            ]}
            unavailableData={[
              'Actual power meter readings',
              'Electricity rate data',
              'Idle power consumption',
              'Energy cost per unit'
            ]}
          />

          {/* KPI Summary */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Est. Annual Energy', value: '5.9M kWh', icon: Zap, color: 'hmi-highlight' },
              { label: 'Est. Annual Cost', value: '$708K', icon: DollarSign, color: 'hmi-warning' },
              { label: 'Potential Savings', value: '$120K/yr', icon: TrendingUp, color: 'hmi-good' },
              { label: 'Avg kWh/Job', value: '175', icon: Gauge, color: 'hmi-info' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-hmi-surface rounded-lg p-4 border border-hmi-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-hmi-muted">{kpi.label}</span>
                  <kpi.icon className={`w-5 h-5 text-${kpi.color}`} />
                </div>
                <div className={`text-2xl font-bold text-${kpi.color} mt-2`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Synthetic Data Banner - Always visible */}
          <div className={`rounded-xl border p-4 ${
            showSyntheticData
              ? 'bg-gradient-to-br from-hmi-highlight/10 to-hmi-surface border-hmi-highlight/30'
              : 'bg-hmi-surface border-hmi-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  showSyntheticData ? 'bg-hmi-highlight/20' : 'bg-hmi-border'
                }`}>
                  <Zap className={`w-6 h-6 ${showSyntheticData ? 'text-hmi-highlight' : 'text-hmi-muted'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    Energy Consumption Analysis
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      showSyntheticData
                        ? 'bg-hmi-highlight/20 text-hmi-highlight border-hmi-highlight/30'
                        : 'bg-hmi-border text-hmi-muted border-hmi-border'
                    }`}>
                      SYNTHETIC DATA
                    </span>
                  </h3>
                  <p className="text-xs text-hmi-muted mt-1">
                    {showSyntheticData
                      ? 'Processing timestamps from database. Energy consumption, costs, and savings projections are estimated models for demonstration.'
                      : 'Synthetic data hidden. Showing only real database results below.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyntheticData(!showSyntheticData)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showSyntheticData
                    ? 'bg-hmi-highlight text-white hover:bg-hmi-highlight/80'
                    : 'bg-hmi-normal text-white hover:bg-hmi-normal/80'
                }`}
              >
                {showSyntheticData ? 'Hide Synthetic Data' : 'Show Synthetic Data'}
              </button>
            </div>
          </div>

          {/* Synthetic Data Analysis Section */}
          {showSyntheticData && (
            <>
          {/* Hourly Usage Pattern */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border p-4">
            <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-hmi-info" />Daily Power Consumption Pattern (Estimated kW)
              <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                SYNTHETIC DATA
              </span>
            </h2>
            <div className="flex items-end gap-2 h-48">
              {energyData.hourlyUsage.map((hour, idx) => {
                const isPeak = hour.hour >= '08:00' && hour.hour <= '18:00';
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t transition-all ${isPeak ? 'bg-hmi-highlight/60' : 'bg-hmi-normal/60'}`}
                      style={{ height: `${(hour.power / maxPower) * 160}px` }}
                      title={`${hour.power} kW, ${hour.jobs} jobs`}
                    ></div>
                    <span className="text-xs text-hmi-muted mt-2 rotate-45 origin-left">{hour.hour}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-hmi-highlight/60"></div><span className="text-hmi-muted">Peak Hours (Higher Rates)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-hmi-normal/60"></div><span className="text-hmi-muted">Off-Peak Hours</span></div>
            </div>
          </div>

          {/* Accelerator Efficiency */}
          <div className="grid grid-cols-2 gap-4">
            {energyData.acceleratorEfficiency.map((accel, idx) => (
              <div key={idx} className="bg-hmi-surface rounded-lg border border-hmi-border p-4">
                <h3 className="font-semibold text-hmi-text mb-4">{accel.device}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-hmi-bg rounded">
                    <div className="text-xs text-hmi-muted">Avg Power</div>
                    <div className="text-xl font-bold text-hmi-highlight">{accel.avgPower} kW</div>
                  </div>
                  <div className="p-3 bg-hmi-bg rounded">
                    <div className="text-xs text-hmi-muted">Peak Power</div>
                    <div className="text-xl font-bold text-hmi-warning">{accel.peakPower} kW</div>
                  </div>
                  <div className="p-3 bg-hmi-bg rounded">
                    <div className="text-xs text-hmi-muted">Efficiency</div>
                    <div className="text-xl font-bold text-hmi-good">{accel.efficiency}%</div>
                  </div>
                  <div className="p-3 bg-hmi-bg rounded">
                    <div className="text-xs text-hmi-muted">Cost/Job</div>
                    <div className="text-xl font-bold text-hmi-info">${accel.costPerJob}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-hmi-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-hmi-muted">Utilization Rate</span>
                    <span className="text-hmi-text font-medium">{accel.utilizationRate}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-hmi-bg rounded-full overflow-hidden">
                    <div className="h-full bg-hmi-process rounded-full" style={{ width: `${accel.utilizationRate}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Savings Opportunities */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-hmi-good" />Energy Savings Opportunities
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {energyData.savingsOpportunities.map((opp, idx) => (
                <div key={idx} className="p-4 bg-hmi-bg rounded-lg border border-hmi-border hover:border-hmi-good/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-hmi-text">{opp.type}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          opp.effort === 'Low' ? 'bg-hmi-good/20 text-hmi-good' :
                          opp.effort === 'Medium' ? 'bg-hmi-info/20 text-hmi-info' :
                          'bg-hmi-highlight/20 text-hmi-highlight'
                        }`}>{opp.effort} Effort</span>
                      </div>
                      <p className="text-sm text-hmi-muted mt-1">{opp.description}</p>
                      <p className="text-xs text-hmi-process mt-2">Energy Saved: {opp.kwhSaved}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-hmi-good">{opp.potential}</div>
                      <div className="text-xs text-hmi-muted">Estimated Savings</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-hmi-surface rounded-lg border border-hmi-border">
            <div className="p-4 border-b border-hmi-border">
              <h2 className="text-lg font-semibold text-hmi-text flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-hmi-accent" />Monthly Energy Consumption
                <span className="px-2 py-0.5 rounded text-xs bg-hmi-highlight/20 text-hmi-highlight border border-hmi-highlight/30">
                  SYNTHETIC DATA
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-hmi-bg text-xs text-hmi-muted uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Month</th>
                    <th className="px-4 py-3 text-right">Consumption (kWh)</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Jobs Processed</th>
                    <th className="px-4 py-3 text-right">kWh/Job</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hmi-border">
                  {energyData.monthlyEnergy.map((month, idx) => (
                    <tr key={idx} className="hover:bg-hmi-bg/50">
                      <td className="px-4 py-3 font-medium text-hmi-text">{month.month}</td>
                      <td className="px-4 py-3 text-right text-hmi-highlight">{formatNumber(month.consumption)}</td>
                      <td className="px-4 py-3 text-right text-hmi-warning">${formatNumber(month.cost)}</td>
                      <td className="px-4 py-3 text-right text-hmi-muted">{formatNumber(month.jobs)}</td>
                      <td className="px-4 py-3 text-right text-hmi-info">{Math.round(month.consumption / month.jobs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

            </>
          )}

          {/* Energy Optimization Recommendations */}
          <div className="bg-gradient-to-br from-hmi-good/10 to-hmi-surface rounded-xl border border-hmi-good/30 overflow-hidden">
            <div className="p-4 border-b border-hmi-good/30">
              <h3 className="font-semibold text-hmi-text flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-hmi-good" />
                Energy Optimization Recommendations
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-text flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-hmi-good" />
                    Available with Current Data
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Analyze RF power patterns to identify efficiency variations
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Identify peak vs off-peak processing distribution
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Calculate relative energy usage by SPSA and customer
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-good">•</span>
                      Compare accelerator efficiency metrics over time
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-hmi-muted flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Data Collection Suggestions
                  </h4>
                  <ul className="space-y-2 text-sm text-hmi-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Power meter readings</strong> - for actual kWh consumption tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Electricity rate data</strong> - to calculate actual costs by time of day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Idle power tracking</strong> - to quantify standby energy waste</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-hmi-highlight">•</span>
                      <span><strong>Demand charge data</strong> - for power factor optimization analysis</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Database Viewer (Data Explorer)
function DatabaseViewer({ fileName, tables, tablesMetadata, onClose, onNavigate }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [schema, setSchema] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [showQuery, setShowQuery] = useState(false);
  const [showSchema, setShowSchema] = useState(true);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, 1);
      loadSchema(selectedTable);
    }
  }, [selectedTable]);

  const loadTableData = async (table, page, sort = sortBy, dir = sortDir) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const result = databaseService.getTableData(table, {
        page,
        limit: 100,
        sortBy: sort,
        sortDir: dir
      });
      setData(result.data);
      setColumns(result.columns);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = async (table) => {
    setSchemaLoading(true);
    setSchema(null);
    setStats(null);
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const schemaResult = databaseService.getTableSchema(table);
      setSchema(schemaResult);
      const statsResult = databaseService.getTableStats(table);
      setStats(statsResult);
    } catch (err) {
      console.error('Failed to load schema:', err);
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleSort = (col) => {
    const newDir = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc';
    setSortBy(col);
    setSortDir(newDir);
    loadTableData(selectedTable, pagination.page, col, newDir);
  };

  const handlePageChange = (page) => {
    loadTableData(selectedTable, page);
  };

  const handleClose = () => {
    databaseService.close();
    onClose();
  };

  return (
    <div className="h-screen flex flex-col bg-hmi-bg">
      {/* Header with Navigation */}
      <header className="h-16 bg-hmi-surface border-b border-hmi-border flex items-center justify-between px-4">
        {/* Left: Facilis Logo and Navigation */}
        <div className="flex items-center gap-6">
          <img src="./WhiteTextIconBlackBackground.png" alt="Facilis" className="h-10 w-auto" />

          {/* Navigation Tabs */}
          <nav className="flex items-center">
            <button
              onClick={() => onNavigate('analysis')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg mx-1 text-hmi-muted hover:text-hmi-text hover:bg-hmi-border/50"
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => onNavigate('optimizations')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg mx-1 text-hmi-muted hover:text-hmi-text hover:bg-hmi-border/50"
            >
              <Lightbulb className="w-4 h-4" />
              Optimization
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg mx-1 bg-hmi-normal/20 text-hmi-normal"
            >
              <Table2 className="w-4 h-4" />
              Data Explorer
            </button>
          </nav>
        </div>

        {/* Right: Controls and SureBeam Logo */}
        <div className="flex items-center gap-4">
          {/* File indicator */}
          <div className="flex items-center gap-2 text-sm bg-hmi-bg rounded px-3 py-1.5 border border-hmi-border">
            <FileText className="w-4 h-4 text-hmi-muted" />
            <span className="text-hmi-text">{fileName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            {tables.length} Tables
          </div>
          <button
            onClick={() => setShowSchema(!showSchema)}
            className={`px-3 py-1 rounded text-sm ${showSchema ? 'bg-slate-700 text-slate-200' : 'bg-hmi-border text-hmi-muted'}`}
          >
            Schema
          </button>
          <button
            onClick={() => setShowQuery(!showQuery)}
            className={`px-3 py-1 rounded text-sm ${showQuery ? 'bg-slate-700 text-slate-200' : 'bg-hmi-border text-hmi-muted'}`}
          >
            SQL Query
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-hmi-border rounded transition-colors"
            title="Close database"
          >
            <X className="w-5 h-5 text-hmi-muted" />
          </button>

          {/* SureBeam Logo */}
          <div className="h-8 w-px bg-hmi-border" />
          <img src="./surebeam-logo.jpg" alt="SureBeam" className="h-10 w-auto rounded" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <TableList
          tables={tables}
          tablesMetadata={tablesMetadata}
          selected={selectedTable}
          onSelect={setSelectedTable}
        />
        <DataGrid
          table={selectedTable}
          data={data}
          columns={columns}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSort={handleSort}
          sortBy={sortBy}
          sortDir={sortDir}
          loading={loading}
        />
        {showSchema && selectedTable && (
          <SchemaPanel schema={schema} stats={stats} loading={schemaLoading} />
        )}
      </div>

      {/* Query Panel */}
      {showQuery && <QueryPanel />}
    </div>
  );
}

// Main App
function AppContent() {
  const [databaseInfo, setDatabaseInfo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [surebeamStats, setSurebeamStats] = useState(null);
  const [view, setView] = useState('upload');
  const [loading, setLoading] = useState(false);

  const handleDatabaseLoaded = async (info) => {
    setDatabaseInfo(info);
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 50));
    const dbSummary = databaseService.getDatabaseSummary();
    setSummary(dbSummary);

    // Load SureBeam-specific statistics
    const stats = databaseService.getSureBeamStats();
    setSurebeamStats(stats);

    setLoading(false);
    setView('analysis');
  };

  const handleNavigate = (targetView) => {
    setView(targetView);
  };

  const handleClose = () => {
    databaseService.close();
    setDatabaseInfo(null);
    setSummary(null);
    setSurebeamStats(null);
    setView('upload');
  };

  if (view === 'upload' || !databaseInfo) {
    return <DatabaseUpload onDatabaseLoaded={handleDatabaseLoaded} />;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-hmi-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-slate-400 animate-spin" />
          <p className="text-hmi-muted">Analyzing SureBeam database...</p>
        </div>
      </div>
    );
  }

  if (view === 'analysis' && summary) {
    return (
      <SureBeamAnalysis
        fileName={databaseInfo.fileName}
        summary={summary}
        surebeamStats={surebeamStats}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    );
  }

  if (view === 'optimizations') {
    return (
      <OptimizationOpportunities
        fileName={databaseInfo.fileName}
        surebeamStats={surebeamStats}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    );
  }

  if (view === 'dose-optimization') {
    return (
      <DoseOptimization
        fileName={databaseInfo.fileName}
        surebeamStats={surebeamStats}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    );
  }

  if (view === 'throughput-optimization') {
    return (
      <ThroughputOptimization
        fileName={databaseInfo.fileName}
        surebeamStats={surebeamStats}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    );
  }

  if (view === 'customer-optimization') {
    return (
      <CustomerOptimization
        fileName={databaseInfo.fileName}
        surebeamStats={surebeamStats}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    );
  }

  if (view === 'maintenance-optimization') {
    return (
      <MaintenanceOptimization
        fileName={databaseInfo.fileName}
        surebeamStats={surebeamStats}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    );
  }

  if (view === 'parameters-optimization') {
    return (
      <ParametersOptimization
        fileName={databaseInfo.fileName}
        surebeamStats={surebeamStats}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    );
  }

  if (view === 'energy-optimization') {
    return (
      <EnergyOptimization
        fileName={databaseInfo.fileName}
        surebeamStats={surebeamStats}
        onNavigate={handleNavigate}
        onClose={handleClose}
      />
    );
  }

  return (
    <DatabaseViewer
      fileName={databaseInfo.fileName}
      tables={databaseInfo.tables}
      tablesMetadata={summary?.tables || []}
      onClose={handleClose}
      onNavigate={handleNavigate}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
