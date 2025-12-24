import { Play, Loader2, RefreshCw } from 'lucide-react';
import useAppStore from '../store/appStore';

function AnalysisControls({ onRunAnalysis }) {
  const {
    isAnalyzing,
    analysisResults,
    selectedSpPvPairs,
    selectedOutputVariables,
    clearAnalysisResults
  } = useAppStore();

  const totalSelectedColumns = selectedSpPvPairs.length * 2 + selectedOutputVariables.length;
  const canRunAnalysis = totalSelectedColumns >= 2 && !isAnalyzing;

  return (
    <div className="card">
      <h3 className="font-medium mb-3">Analysis Controls</h3>

      <div className="space-y-3">
        {/* Selection summary */}
        <div className="text-sm text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">{selectedSpPvPairs.length}</span> SP/PV pairs selected
            ({selectedSpPvPairs.length * 2} columns)
          </p>
          <p>
            <span className="text-foreground font-medium">{selectedOutputVariables.length}</span> output variables selected
          </p>
          <p className="mt-1 pt-1 border-t border-border">
            Total: <span className="text-foreground font-medium">{totalSelectedColumns}</span> columns for analysis
          </p>
        </div>

        {/* Minimum selection warning */}
        {totalSelectedColumns < 2 && (
          <p className="text-xs text-amber-500">
            Select at least 2 columns to run analysis
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRunAnalysis}
            disabled={!canRunAnalysis}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>

          {analysisResults && (
            <button
              onClick={clearAnalysisResults}
              className="btn-secondary flex items-center gap-2"
              title="Clear results"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results summary */}
        {analysisResults && (
          <div className="text-sm p-3 rounded bg-primary/10 border border-primary/30">
            <p className="text-primary font-medium">
              {Object.keys(analysisResults.modeStatistics || {}).length} operating modes detected
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {(analysisResults.modeSegments?.length || 1) - 1} mode transitions identified
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalysisControls;
