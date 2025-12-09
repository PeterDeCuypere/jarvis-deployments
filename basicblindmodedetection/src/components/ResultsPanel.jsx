import { useMemo, useState } from 'react';
import { Download, Table, FileJson, ChevronDown, ChevronUp, TrendingUp, Activity } from 'lucide-react';
import useAppStore from '../store/appStore';
import { getModeColors } from '../utils/modeColors';

function ResultsPanel() {
  const [showOutputStats, setShowOutputStats] = useState(true);

  const { analysisResults, rawData, selectedTimestampCol, fileName } = useAppStore();

  // Get consistent mode colors
  const modeColors = useMemo(() => {
    if (!analysisResults?.modeStatistics) return {};
    return getModeColors(analysisResults.modeStatistics);
  }, [analysisResults]);

  // Prepare stability metrics
  const stabilityMetrics = useMemo(() => {
    if (!analysisResults?.stabilityMetrics) return null;
    return analysisResults.stabilityMetrics;
  }, [analysisResults]);

  // Output variable statistics by mode
  const outputStats = useMemo(() => {
    if (!analysisResults?.outputStatsByMode) return [];
    return Object.entries(analysisResults.outputStatsByMode).map(([mode, stats]) => ({
      mode,
      ...stats
    }));
  }, [analysisResults]);

  // Export results as CSV
  const exportCSV = () => {
    if (!analysisResults) return;

    // Create segment data
    const rows = analysisResults.modeSegments.map((segment, idx) => {
      const startTime = selectedTimestampCol && rawData[segment.startIdx]
        ? rawData[segment.startIdx][selectedTimestampCol]
        : segment.startIdx;
      const endTime = selectedTimestampCol && rawData[segment.endIdx]
        ? rawData[segment.endIdx][selectedTimestampCol]
        : segment.endIdx;

      return {
        segment_id: idx + 1,
        mode: segment.mode,
        start_index: segment.startIdx,
        end_index: segment.endIdx,
        start_time: startTime,
        end_time: endTime,
        duration: segment.endIdx - segment.startIdx + 1
      };
    });

    const headers = Object.keys(rows[0] || {}).join(',');
    const csvContent = [
      headers,
      ...rows.map(row => Object.values(row).join(','))
    ].join('\n');

    downloadFile(csvContent, `${fileName || 'analysis'}_modes.csv`, 'text/csv');
  };

  // Export results as JSON
  const exportJSON = () => {
    if (!analysisResults) return;

    const exportData = {
      metadata: {
        sourceFile: fileName,
        analysisDate: new Date().toISOString(),
        dataPoints: rawData.length,
        modesDetected: Object.keys(analysisResults.modeStatistics || {}).length
      },
      modeStatistics: analysisResults.modeStatistics,
      modeDetails: analysisResults.modeDetails,
      stabilityMetrics: analysisResults.stabilityMetrics,
      segments: analysisResults.modeSegments,
      outputStatsByMode: analysisResults.outputStatsByMode
    };

    downloadFile(
      JSON.stringify(exportData, null, 2),
      `${fileName || 'analysis'}_results.json`,
      'application/json'
    );
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!analysisResults) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">
          Run analysis to view detailed results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Export Results</h3>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm"
            >
              <Table className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Stability Metrics */}
      {stabilityMetrics && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Stability Analysis
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Overall Stability</p>
              <p className="text-xl font-bold">
                {stabilityMetrics.overallStability?.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Stable Points</p>
              <p className="text-xl font-bold">
                {stabilityMetrics.stablePoints?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Transient Points</p>
              <p className="text-xl font-bold">
                {stabilityMetrics.transientPoints?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Mode Transitions</p>
              <p className="text-xl font-bold">
                {(analysisResults.modeSegments?.length || 1) - 1}
              </p>
            </div>
          </div>

          {/* Per-variable stability */}
          {stabilityMetrics.byVariable && Object.keys(stabilityMetrics.byVariable).length > 0 && (
            <div className="overflow-x-auto">
              <table className="results-table text-sm">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Stability %</th>
                    <th>Stable Points</th>
                    <th>Transient Points</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stabilityMetrics.byVariable).map(([varName, stats]) => (
                    <tr key={varName}>
                      <td className="font-medium">{varName}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${stats.stability}%` }}
                            ></div>
                          </div>
                          <span>{stats.stability.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>{stats.stablePoints.toLocaleString()}</td>
                      <td>{stats.transientPoints.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Output Statistics by Mode */}
      {outputStats.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowOutputStats(!showOutputStats)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <span className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Output Statistics by Mode
            </span>
            {showOutputStats ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showOutputStats && (
            <div className="p-4 overflow-x-auto">
              <table className="results-table text-sm">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Variable</th>
                    <th>Mean</th>
                    <th>Std Dev</th>
                    <th>Min</th>
                    <th>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {outputStats.map((modeStats, modeIdx) => (
                    Object.entries(modeStats)
                      .filter(([key]) => key !== 'mode')
                      .map(([varName, stats], varIdx) => (
                        <tr key={`${modeStats.mode}-${varName}`}>
                          {varIdx === 0 && (
                            <td
                              rowSpan={Object.keys(modeStats).length - 1}
                              className="font-medium align-top"
                            >
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-3 h-3 rounded-sm inline-block"
                                  style={{ backgroundColor: modeColors[modeStats.mode]?.solid || '#888' }}
                                />
                                Mode {modeStats.mode}
                              </span>
                            </td>
                          )}
                          <td>{varName}</td>
                          <td>{stats.mean?.toFixed(3) || 'N/A'}</td>
                          <td>{stats.std?.toFixed(3) || 'N/A'}</td>
                          <td>{stats.min?.toFixed(3) || 'N/A'}</td>
                          <td>{stats.max?.toFixed(3) || 'N/A'}</td>
                        </tr>
                      ))
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Final Merged Modes Table */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Final Merged Modes
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({Object.keys(analysisResults.modeStatistics || {}).length} modes)
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="results-table text-sm">
            <thead>
              <tr>
                <th>Mode</th>
                <th>Start</th>
                <th>End</th>
                <th>Total Duration</th>
                <th>Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Calculate start/end times and duration for each mode
                const modeStartEnd = {};
                if (analysisResults?.modeSegments) {
                  analysisResults.modeSegments.forEach(segment => {
                    const modeId = String(segment.mode);
                    const startTime = selectedTimestampCol && rawData[segment.startIdx]
                      ? rawData[segment.startIdx][selectedTimestampCol]
                      : segment.startIdx;
                    const endTime = selectedTimestampCol && rawData[segment.endIdx]
                      ? rawData[segment.endIdx][selectedTimestampCol]
                      : segment.endIdx;

                    if (!modeStartEnd[modeId]) {
                      modeStartEnd[modeId] = {
                        startTime,
                        endTime,
                        startIdx: segment.startIdx,
                        endIdx: segment.endIdx
                      };
                    } else {
                      if (segment.endIdx > modeStartEnd[modeId].endIdx) {
                        modeStartEnd[modeId].endTime = endTime;
                        modeStartEnd[modeId].endIdx = segment.endIdx;
                      }
                      if (segment.startIdx < modeStartEnd[modeId].startIdx) {
                        modeStartEnd[modeId].startTime = startTime;
                        modeStartEnd[modeId].startIdx = segment.startIdx;
                      }
                    }
                  });
                }

                // Calculate time duration from timestamps if available
                const formatDuration = (startTime, endTime) => {
                  if (!startTime || !endTime) return 'N/A';
                  const start = new Date(startTime);
                  const end = new Date(endTime);
                  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';

                  const diffMs = Math.abs(end - start);
                  const hours = Math.floor(diffMs / (1000 * 60 * 60));
                  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

                  if (hours > 0) {
                    return `${hours}h ${minutes}m ${seconds}s`;
                  } else if (minutes > 0) {
                    return `${minutes}m ${seconds}s`;
                  } else {
                    return `${seconds}s`;
                  }
                };

                return Object.entries(analysisResults.modeStatistics || {})
                  .sort((a, b) => b[1].percentage - a[1].percentage)
                  .map(([modeId, stats]) => {
                    const modeColor = modeColors[modeId]?.solid || '#888';
                    const startEnd = modeStartEnd[modeId] || {};
                    const timeDuration = formatDuration(startEnd.startTime, startEnd.endTime);

                    return (
                      <tr key={modeId}>
                        <td>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5"
                            style={{
                              backgroundColor: `${modeColor}20`,
                              color: modeColor
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: modeColor }}
                            />
                            Mode {modeId}
                          </span>
                        </td>
                        <td className="text-xs">{startEnd.startTime ? String(startEnd.startTime) : 'N/A'}</td>
                        <td className="text-xs">{startEnd.endTime ? String(startEnd.endTime) : 'N/A'}</td>
                        <td>{timeDuration}</td>
                        <td>{stats.occurrences}</td>
                      </tr>
                    );
                  });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ResultsPanel;
