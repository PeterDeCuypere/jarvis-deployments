import { useState } from 'react';
import { Activity, BarChart3, Table2, LineChart, AlertCircle, Moon, Sun, Info, Loader2 } from 'lucide-react';
import useAppStore from './store/appStore';
import ErrorBoundary from './components/ErrorBoundary';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import AnalysisControls from './components/AnalysisControls';
import TimeSeriesChart from './components/TimeSeriesChart';
import ModeTimelineChart from './components/ModeTimelineChart';
import ResultsPanel from './components/ResultsPanel';

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const {
    fileName,
    analysisResults,
    analysisError,
    activeTab,
    setActiveTab,
    isAnalyzing
  } = useAppStore();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
  };

  const tabs = [
    { id: 'timeseries', label: 'Time Series', icon: LineChart },
    { id: 'modes', label: 'Modes', icon: BarChart3 },
    { id: 'results', label: 'Results', icon: Table2 }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Analysis Loading Overlay */}
        {isAnalyzing && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card rounded-xl border border-border p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Analyzing Data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Detecting operating modes...
                </p>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Blind Mode Detection</h1>
                  <p className="text-xs text-muted-foreground">
                    Automatic operating mode discovery from process data
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title="About"
                >
                  <Info className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title="Toggle dark mode"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Info Panel */}
        {showInfo && (
          <div className="bg-primary/10 border-b border-primary/20">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Blind Operating Mode Detection</strong> automatically discovers distinct operating modes
                    from process data by analyzing setpoint-process value pairs.
                  </p>
                  <p>
                    <strong>How it works:</strong> Upload a CSV/JSON file with SP (setpoint) and PV (process value) columns.
                    The algorithm detects stable operating regions where the process is at steady state,
                    clusters these regions by setpoint combinations, and identifies distinct operating modes.
                  </p>
                  <p>
                    <strong>Column naming:</strong> Use suffixes like _SP, _PV or .SP, .PV (e.g., Temperature_SP, Temperature_PV).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Configuration */}
            <div className="lg:col-span-4 space-y-6">
              {/* File Upload */}
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">1</span>
                  Data Input
                </h2>
                <FileUpload />
              </section>

              {/* Column Selection */}
              {fileName && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">2</span>
                    Configure Variables
                  </h2>
                  <ColumnSelector />
                </section>
              )}

              {/* Analysis Controls */}
              {fileName && (
                <section>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">3</span>
                    Run Analysis
                  </h2>
                  <AnalysisControls />
                </section>
              )}
            </div>

            {/* Right Content - Visualizations */}
            <div className="lg:col-span-8 space-y-6">
              {/* Error Display */}
              {analysisError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Analysis Error</p>
                    <p className="text-sm text-destructive/80 mt-1">{analysisError}</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              {fileName && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
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

                  <div className="p-4">
                    {activeTab === 'timeseries' && <TimeSeriesChart />}
                    {activeTab === 'modes' && <ModeTimelineChart />}
                    {activeTab === 'results' && <ResultsPanel />}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!fileName && (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No Data Loaded</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Upload a CSV or JSON file containing your process data with setpoint (SP)
                    and process value (PV) columns to begin analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-auto">
          <div className="container mx-auto px-4 py-4">
            <p className="text-xs text-muted-foreground text-center">
              Blind Operating Mode Detection - Automatic discovery of operating modes from process data
            </p>
          </div>
        </footer>
      </div>
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
