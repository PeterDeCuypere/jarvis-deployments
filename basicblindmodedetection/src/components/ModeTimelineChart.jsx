import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Clock, Layers } from 'lucide-react';
import useAppStore from '../store/appStore';
import { getModeColors } from '../utils/modeColors';

function ModeTimelineChart() {
  const { analysisResults, selectedTimestampCol, rawData } = useAppStore();

  // Generate consistent colors for modes - using shared color utility
  const modeColors = useMemo(() => {
    if (!analysisResults?.modeStatistics) return {};
    return getModeColors(analysisResults.modeStatistics);
  }, [analysisResults]);

  // Prepare timeline data (Gantt-style)
  const timelineData = useMemo(() => {
    if (!analysisResults?.modeSegments) return [];

    return analysisResults.modeSegments.map((segment, idx) => {
      const startTime = selectedTimestampCol && rawData[segment.startIdx]
        ? rawData[segment.startIdx][selectedTimestampCol]
        : segment.startIdx;
      const endTime = selectedTimestampCol && rawData[segment.endIdx]
        ? rawData[segment.endIdx][selectedTimestampCol]
        : segment.endIdx;

      return {
        id: idx,
        mode: segment.mode,
        start: segment.startIdx,
        end: segment.endIdx,
        duration: segment.endIdx - segment.startIdx + 1,
        startTime,
        endTime,
        color: modeColors[segment.mode]?.timeline || '#888'
      };
    });
  }, [analysisResults, modeColors, selectedTimestampCol, rawData]);

  // Prepare mode duration statistics with overall start/end datetime for merged mode
  const durationStats = useMemo(() => {
    if (!analysisResults?.modeStatistics) return [];

    // Get overall start/end for each mode (first segment start, last segment end)
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
          // Update end time to the latest segment
          if (segment.endIdx > modeStartEnd[modeId].endIdx) {
            modeStartEnd[modeId].endTime = endTime;
            modeStartEnd[modeId].endIdx = segment.endIdx;
          }
          // Update start time to the earliest segment
          if (segment.startIdx < modeStartEnd[modeId].startIdx) {
            modeStartEnd[modeId].startTime = startTime;
            modeStartEnd[modeId].startIdx = segment.startIdx;
          }
        }
      });
    }

    return Object.entries(analysisResults.modeStatistics)
      .map(([mode, stats]) => ({
        mode: `Mode ${mode}`,
        modeId: mode,
        totalDuration: stats.totalDuration,
        percentage: stats.percentage,
        occurrences: stats.occurrences,
        avgDuration: stats.avgDuration,
        color: modeColors[mode]?.timeline || '#888',
        solidColor: modeColors[mode]?.solid || '#888',
        startTime: modeStartEnd[mode]?.startTime,
        endTime: modeStartEnd[mode]?.endTime
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [analysisResults, modeColors, selectedTimestampCol, rawData]);

  // Prepare setpoint values per mode
  const setpointData = useMemo(() => {
    if (!analysisResults?.modeDetails) return [];

    return Object.entries(analysisResults.modeDetails).map(([mode, details]) => ({
      mode: `Mode ${mode}`,
      modeId: mode,
      setpoints: details.setpointValues,
      color: modeColors[mode]?.solid || '#888'
    }));
  }, [analysisResults, modeColors]);

  // Plotly pie chart trace
  const pieTrace = useMemo(() => {
    if (durationStats.length === 0) return null;
    return {
      type: 'pie',
      values: durationStats.map(d => d.percentage),
      labels: durationStats.map(d => d.mode),
      marker: {
        colors: durationStats.map(d => d.color),
        line: {
          color: 'rgba(255,255,255,0.3)',
          width: 1
        }
      },
      textinfo: 'label+percent',
      textposition: 'outside',
      hovertemplate: '%{label}: %{percent}<extra></extra>',
      textfont: { size: 11, color: '#e5e5e5' },
      outsidetextfont: { size: 11, color: '#e5e5e5' }
    };
  }, [durationStats]);

  // Plotly bar chart trace
  const barTrace = useMemo(() => {
    if (durationStats.length === 0) return null;
    return {
      type: 'bar',
      y: durationStats.map(d => d.mode),
      x: durationStats.map(d => d.totalDuration),
      orientation: 'h',
      marker: {
        color: durationStats.map(d => d.color)
      },
      hovertemplate: '%{y}: %{x:,.0f} points<extra></extra>'
    };
  }, [durationStats]);

  // Common Plotly layout
  const commonLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'inherit',
      color: '#e5e5e5',
      size: 11
    },
    margin: { l: 80, r: 20, t: 20, b: 40 },
    showlegend: false
  };

  const plotConfig = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d', 'zoom2d', 'pan2d', 'zoomIn2d', 'zoomOut2d', 'resetScale2d']
  };

  if (!analysisResults) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">
          Run analysis to view mode timeline
        </p>
      </div>
    );
  }

  const totalModes = Object.keys(analysisResults.modeStatistics || {}).length;
  const totalTransitions = (analysisResults.modeSegments?.length || 1) - 1;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-sm">Modes Detected</span>
          </div>
          <p className="text-2xl font-bold">{totalModes}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Transitions</span>
          </div>
          <p className="text-2xl font-bold">{totalTransitions}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-sm">Stability</span>
          </div>
          <p className="text-2xl font-bold">
            {analysisResults.stabilityMetrics?.overallStability?.toFixed(1) || 'N/A'}%
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-sm">Data Points</span>
          </div>
          <p className="text-2xl font-bold">{rawData.length.toLocaleString()}</p>
        </div>
      </div>

      {/* Mode Timeline */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold mb-4">
          Mode Timeline ({durationStats.length} modes)
        </h3>
        <div className="h-32 overflow-visible">
          <div className="min-w-full h-full flex items-center gap-0.5">
            {durationStats.map((mode, idx) => {
              const widthPercent = mode.percentage;
              // Account for gaps: subtract small amount per mode
              const adjustedWidth = Math.max(widthPercent - 0.1, 0.3);
              return (
                <div
                  key={idx}
                  className="h-12 flex items-center justify-center text-xs font-bold text-white relative group rounded-sm"
                  style={{
                    width: `${adjustedWidth}%`,
                    backgroundColor: mode.color,
                    minWidth: '20px'
                  }}
                  title={`Mode ${mode.modeId}: ${mode.totalDuration} points (${mode.percentage.toFixed(1)}%)`}
                >
                  {/* Always show mode number, use smaller text for narrow segments */}
                  <span className={widthPercent < 3 ? 'text-[10px]' : ''}>
                    M{mode.modeId}
                  </span>
                  {/* Tooltip - positioned with enough space above */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-gray-700 whitespace-nowrap">
                    <div className="font-semibold mb-1">Mode {mode.modeId}</div>
                    <div>Total Duration: {mode.totalDuration.toLocaleString()} points</div>
                    <div>Occurrences: {mode.occurrences}</div>
                    {mode.startTime && mode.endTime && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <div>Start: {String(mode.startTime)}</div>
                        <div>End: {String(mode.endTime)}</div>
                      </div>
                    )}
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Duration Distribution (Pie Chart) */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-4">Mode Distribution</h3>
          <div className="h-64">
            {pieTrace && (
              <Plot
                data={[pieTrace]}
                layout={{
                  ...commonLayout,
                  height: 250,
                  margin: { l: 20, r: 20, t: 20, b: 20 }
                }}
                config={plotConfig}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            )}
          </div>
        </div>

        {/* Mode Duration Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-4">Mode Duration (Data Points)</h3>
          <div className="h-64">
            {barTrace && (
              <Plot
                data={[barTrace]}
                layout={{
                  ...commonLayout,
                  height: 250,
                  xaxis: {
                    gridcolor: 'rgba(255,255,255,0.15)',
                    linecolor: 'rgba(255,255,255,0.15)',
                    tickfont: { size: 10, color: '#e5e5e5' },
                    zerolinecolor: 'rgba(255,255,255,0.15)'
                  },
                  yaxis: {
                    gridcolor: 'rgba(255,255,255,0.15)',
                    linecolor: 'rgba(255,255,255,0.15)',
                    tickfont: { size: 10, color: '#e5e5e5' },
                    automargin: true,
                    zerolinecolor: 'rgba(255,255,255,0.15)'
                  }
                }}
                config={plotConfig}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Setpoint Values per Mode */}
      {setpointData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-4">Setpoint Values by Mode</h3>
          <div className="overflow-x-auto">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Mode</th>
                  {Object.keys(setpointData[0]?.setpoints || {}).map(sp => (
                    <th key={sp}>{sp}</th>
                  ))}
                  <th>Occurrences</th>
                </tr>
              </thead>
              <tbody>
                {setpointData.map((row, idx) => {
                  const stats = durationStats.find(s => s.modeId === row.modeId);
                  return (
                    <tr key={idx}>
                      <td>
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: row.color }}
                        ></span>
                        {row.mode}
                      </td>
                      {Object.values(row.setpoints).map((val, spIdx) => (
                        <td key={spIdx}>
                          {typeof val === 'number' ? val.toFixed(2) : val}
                        </td>
                      ))}
                      <td>{stats?.occurrences || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeTimelineChart;
