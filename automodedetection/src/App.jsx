import { useEffect, useCallback, Component } from 'react';
import { Activity, LineChart, BarChart3, Table2 } from 'lucide-react';
import useAppStore from './store/appStore';
import { loadDataFile, discoverColumns } from './services/dataLoader';
import { detectOperatingModes } from './utils/modeDetection';
import LoadingScreen from './components/LoadingScreen';
import DataPreview from './components/DataPreview';
import ColumnSelector from './components/ColumnSelector';
import AnalysisControls from './components/AnalysisControls';
import TimeSeriesChart from './components/TimeSeriesChart';
import ModeTimelineChart from './components/ModeTimelineChart';
import ResultsPanel from './components/ResultsPanel';

// Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="card max-w-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">An unexpected error occurred.</p>
            <pre className="text-left bg-black/30 rounded p-3 mb-4 text-xs text-red-400 overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const {
    isLoading,
    loadingMessage,
    error,
    rawData,
    setLoading,
    setError,
    setData,
    setColumns,
    setSpPvPairs,
    setOutputVariables,
    setAnalyzing,
    setAnalysisResults,
    spPvPairs,
    selectedSpPvPairs,
    outputVariables,
    selectedOutputVariables,
    tolerance,
    activeTab,
    setActiveTab
  } = useAppStore();

  // Tab definitions - same as blind-operating-mode-detection
  const tabs = [
    { id: 'timeseries', label: 'Time Series', icon: LineChart },
    { id: 'modes', label: 'Modes', icon: BarChart3 },
    { id: 'results', label: 'Results', icon: Table2 }
  ];

  // Auto-load data on mount
  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('[App] Starting initialization...');
        setLoading(true, 'Loading data file...');

        const result = await loadDataFile();
        console.log('[App] Data loaded, rows:', result?.data?.length, 'columns:', result?.columns?.length);

        if (!result || !result.data || result.data.length === 0) {
          throw new Error('No data returned from file loader');
        }

        const { data, columns } = result;

        setLoading(true, 'Discovering columns...');
        setColumns(columns);
        console.log('[App] Columns set:', columns.length);

        const { spPvPairs: pairs, outputVariables: outputs } = discoverColumns(columns);
        console.log('[App] Discovered SP/PV pairs:', pairs.length, 'output vars:', outputs.length);

        setSpPvPairs(pairs);
        setOutputVariables(outputs);
        setData(data);
        console.log('[App] Initialization complete, data set');
      } catch (err) {
        console.error('[App] Initialization error:', err);
        setError(err.message || 'Failed to load data');
      }
    }

    initializeApp();
  }, [setLoading, setError, setData, setColumns, setSpPvPairs, setOutputVariables]);

  // Run analysis handler
  const handleRunAnalysis = useCallback(async () => {
    // Get selected SP/PV pairs
    const selectedPairs = spPvPairs
      .filter(p => selectedSpPvPairs.includes(p.baseName));

    // Get selected output variable names
    const selectedOutputVars = outputVariables
      .filter(v => selectedOutputVariables.includes(v.name))
      .map(v => v.name);

    if (selectedPairs.length === 0) {
      setError('Please select at least one SP/PV pair');
      return;
    }

    setAnalyzing(true);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const results = detectOperatingModes(
          rawData,
          selectedPairs,
          selectedOutputVars,
          null, // timestampCol - not used in automatic-mode-detection
          tolerance
        );
        setAnalysisResults(results);
      } catch (err) {
        console.error('Analysis error:', err);
        setError('Analysis failed: ' + err.message);
      }
    }, 50);
  }, [rawData, spPvPairs, selectedSpPvPairs, outputVariables, selectedOutputVariables, tolerance, setAnalyzing, setAnalysisResults, setError]);

  // Get columns for chart
  const chartColumns = spPvPairs
    .filter(p => selectedSpPvPairs.includes(p.baseName))
    .flatMap(p => [p.spColumn, p.pvColumn]);

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="card max-w-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Automatic Mode Detection</h1>
              <p className="text-sm text-muted-foreground">
                Blind operating mode detection for cascaded CSTR process
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <DataPreview />
            <ColumnSelector />
            <AnalysisControls onRunAnalysis={handleRunAnalysis} />
          </div>

          {/* Main Content Area - Tabbed Interface */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-border">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                      ${activeTab === tab.id
                        ? 'bg-primary/10 text-primary border-b-2 border-primary -mb-px'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'timeseries' && <TimeSeriesChart columns={chartColumns} />}
                {activeTab === 'modes' && <ModeTimelineChart />}
                {activeTab === 'results' && <ResultsPanel />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
