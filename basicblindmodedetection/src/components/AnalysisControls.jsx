import { useState, useCallback } from 'react';
import { Play, Loader2, Settings, Info } from 'lucide-react';
import useAppStore from '../store/appStore';
import { detectOperatingModes } from '../utils/modeDetection';

function AnalysisControls() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    rawData,
    selectedTimestampCol,
    tolerance,
    isAnalyzing,
    setTolerance,
    setIsAnalyzing,
    setAnalysisResults,
    setAnalysisError,
    getSelectedPairs,
    getSelectedOutputVars
  } = useAppStore();

  const selectedPairs = getSelectedPairs();
  const selectedOutputVars = getSelectedOutputVars();

  const canAnalyze = rawData.length > 0 && selectedPairs.length > 0;

  const runAnalysis = useCallback(async () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const results = detectOperatingModes(
        rawData,
        selectedPairs,
        selectedOutputVars,
        selectedTimestampCol,
        tolerance
      );

      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error.message || 'An error occurred during analysis');
    } finally {
      // Ensure isAnalyzing is reset even if something unexpected happens
      setIsAnalyzing(false);
    }
  }, [
    canAnalyze,
    rawData,
    selectedPairs,
    selectedOutputVars,
    selectedTimestampCol,
    tolerance,
    setIsAnalyzing,
    setAnalysisResults,
    setAnalysisError
  ]);

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Analysis Settings</h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tolerance (ε)
              <span className="ml-2 text-muted-foreground font-normal">
                {(tolerance * 100).toFixed(1)}%
              </span>
            </label>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={tolerance}
              onChange={(e) => setTolerance(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.1%</span>
              <span>10%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Tolerance defines how close PV must be to SP to be considered "at setpoint".
              Lower values = stricter matching.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={runAnalysis}
          disabled={!canAnalyze || isAnalyzing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {!canAnalyze && rawData.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Select at least one SP/PV pair to run analysis
        </p>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Selected: {selectedPairs.length} pairs, {selectedOutputVars.length} output variables</p>
        <p>Data points: {rawData.length.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default AnalysisControls;
