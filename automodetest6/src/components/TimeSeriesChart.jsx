import { useMemo, useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Home, Eye, EyeOff } from 'lucide-react';
import useAppStore from '../store/appStore';
import { getModeColors } from '../utils/modeColors';

// ============================================
// HIGH PERFORMANCE HMI COLOR SYSTEM
// ============================================
// Process Variables: Neutral greys/slate - calm, professional
// Mode Overlays: Soft pastels - informational, not attention-grabbing
// Red/Orange: RESERVED for alarms only (not used here)

// Tag Colors - one color per tag (SP and PV share the same color, differentiated by line style)
const TAG_COLORS = [
  '#6b8cae', // steel blue
  '#7a9b76', // sage green
  '#a08060', // tan/brown
  '#8b7aa0', // mauve/purple
  '#6a9a9a', // teal
  '#9a8070', // taupe
  '#7090a0', // slate blue
  '#908078'  // stone grey
];

// Output Variable Colors - HP HMI compliant muted tones
const OUTPUT_COLORS = ['#5a8a8a', '#7a7090', '#9a8a60', '#6a8a70', '#8a6a70', '#606a8a', '#7a9060', '#8a7a60'];

// Helper to get computed CSS color values for Plotly
const getCSSColor = (cssVar) => {
  const style = getComputedStyle(document.documentElement);
  const hslValue = style.getPropertyValue(cssVar).trim();
  if (hslValue) {
    return `hsl(${hslValue})`;
  }
  return '#333'; // fallback
};

function TimeSeriesChart() {
  const [showModeOverlay, setShowModeOverlay] = useState(true);
  const [checkedTags, setCheckedTags] = useState(new Set()); // Track which tags are checked
  const [checkedOutputVars, setCheckedOutputVars] = useState(new Set()); // Track which output vars are checked

  const {
    rawData,
    analysisResults,
    spPvPairs,
    selectedSpPvPairs,
    outputVariables,
    selectedOutputVariables
  } = useAppStore();

  // Filter selected pairs and output vars based on store selections
  const selectedPairs = useMemo(() =>
    spPvPairs.filter(p => selectedSpPvPairs.includes(p.baseName)),
    [spPvPairs, selectedSpPvPairs]
  );

  const selectedOutputVars = useMemo(() =>
    outputVariables.filter(v => selectedOutputVariables.includes(v.name)).map(v => v.name),
    [outputVariables, selectedOutputVariables]
  );

  // Initialize checked tags: first 2 by default (or 1 if only 1 exists)
  useEffect(() => {
    if (selectedPairs.length > 0 && checkedTags.size === 0) {
      const initialTags = new Set(
        selectedPairs.slice(0, Math.min(2, selectedPairs.length)).map(p => p.baseName)
      );
      setCheckedTags(initialTags);
    }
  }, [selectedPairs]);

  // Initialize/update checked output vars: ensure first 2 visible are checked when available vars change
  useEffect(() => {
    if (selectedOutputVars.length > 0) {
      // Filter current checked vars to only include those still visible
      const stillVisible = new Set(
        [...checkedOutputVars].filter(v => selectedOutputVars.includes(v))
      );

      // If no vars are checked (or none remain visible), check first 2
      if (stillVisible.size === 0) {
        const initialVars = new Set(
          selectedOutputVars.slice(0, Math.min(2, selectedOutputVars.length))
        );
        setCheckedOutputVars(initialVars);
      } else if (stillVisible.size !== checkedOutputVars.size) {
        // Update to remove vars that are no longer visible
        setCheckedOutputVars(stillVisible);
      }
    } else {
      // No output vars available, clear selections
      setCheckedOutputVars(new Set());
    }
  }, [selectedOutputVars]);

  // Toggle tag visibility
  const toggleTag = (baseName) => {
    setCheckedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(baseName)) {
        newSet.delete(baseName);
      } else {
        newSet.add(baseName);
      }
      return newSet;
    });
  };

  // Toggle output variable visibility
  const toggleOutputVar = (varName) => {
    setCheckedOutputVars(prev => {
      const newSet = new Set(prev);
      if (newSet.has(varName)) {
        newSet.delete(varName);
      } else {
        newSet.add(varName);
      }
      return newSet;
    });
  };

  // Get color for output variable based on its index
  const getOutputVarColor = (varName) => {
    const idx = selectedOutputVars.indexOf(varName);
    return OUTPUT_COLORS[idx % OUTPUT_COLORS.length];
  };

  // Prepare chart data - plot ALL data points (no downsampling)
  const chartData = useMemo(() => {
    if (rawData.length === 0) return [];

    // Plot all data points for full fidelity
    return rawData
      .map((row, idx) => {
        const point = {
          index: idx,
          timestamp: row.timestamp || idx
        };

        // Add SP/PV pairs
        selectedPairs.forEach(pair => {
          const spVal = parseFloat(row[pair.spColumn]);
          const pvVal = parseFloat(row[pair.pvColumn]);
          point[`${pair.baseName}_SP`] = isNaN(spVal) ? null : spVal;
          point[`${pair.baseName}_PV`] = isNaN(pvVal) ? null : pvVal;
        });

        // Add output variables
        selectedOutputVars.forEach(varName => {
          const val = parseFloat(row[varName]);
          point[varName] = isNaN(val) ? null : val;
        });

        return point;
      });
  }, [rawData, selectedPairs, selectedOutputVars]);

  // Mode segments for highlighting
  const modeSegments = useMemo(() => {
    if (!analysisResults?.modeSegments) return [];
    return analysisResults.modeSegments;
  }, [analysisResults]);

  // Get unique modes for color mapping - using shared color utility for consistency
  const modeColors = useMemo(() => {
    if (!modeSegments.length) return {};
    const uniqueModes = [...new Set(modeSegments.map(s => s.mode))];
    const colors = getModeColors(uniqueModes);
    // Transform to match expected shape (fill for overlay, solid for border/legend)
    const result = {};
    Object.entries(colors).forEach(([mode, colorObj]) => {
      result[mode] = {
        fill: colorObj.fill,
        border: colorObj.solid
      };
    });
    return result;
  }, [modeSegments]);

  // Get color for a tag based on its index in selectedPairs
  const getTagColor = (baseName) => {
    const idx = selectedPairs.findIndex(p => p.baseName === baseName);
    return TAG_COLORS[idx % TAG_COLORS.length];
  };

  // Create mode shapes for Plotly
  const createModeShapes = (yAxisRef = 'y') => {
    if (!showModeOverlay || !modeSegments.length) return [];

    return modeSegments.map((segment) => {
      // Find timestamps for start and end indices
      const startPoint = chartData.find(d => d.index >= segment.startIdx);
      const endPoint = chartData.find(d => d.index >= segment.endIdx) || chartData[chartData.length - 1];

      if (!startPoint || !endPoint) return null;

      return {
        type: 'rect',
        xref: 'x',
        yref: yAxisRef,
        x0: startPoint.timestamp,
        x1: endPoint.timestamp,
        y0: 0,
        y1: 1,
        yanchor: 'bottom',
        ysizemode: 'scaled',
        fillcolor: modeColors[segment.mode]?.fill || 'rgba(128,128,128,0.2)',
        line: { width: 0 },
        layer: 'below'
      };
    }).filter(Boolean);
  };

  // Build SP/PV traces for Plotly - only for checked tags
  const spPvTraces = useMemo(() => {
    const traces = [];

    // Filter to only checked tags
    const tagsToShow = selectedPairs.filter(pair => checkedTags.has(pair.baseName));

    tagsToShow.forEach((pair) => {
      const tagColor = getTagColor(pair.baseName);

      // SP trace - dashed, step line (same color as PV)
      traces.push({
        x: chartData.map(d => d.timestamp),
        y: chartData.map(d => d[`${pair.baseName}_SP`]),
        type: 'scatter',
        mode: 'lines',
        name: `${pair.baseName} SP`,
        line: {
          color: tagColor,
          width: 2,
          dash: '8px,4px',
          shape: 'hv'
        },
        hovertemplate: `%{x}<br>${pair.baseName} SP: %{y:.2f}<extra></extra>`,
        showlegend: false // Hide from Plotly legend - we use custom checkboxes
      });

      // PV trace - solid line (same color as SP)
      traces.push({
        x: chartData.map(d => d.timestamp),
        y: chartData.map(d => d[`${pair.baseName}_PV`]),
        type: 'scatter',
        mode: 'lines',
        name: `${pair.baseName} PV`,
        line: {
          color: tagColor,
          width: 2
        },
        hovertemplate: `%{x}<br>${pair.baseName} PV: %{y:.2f}<extra></extra>`,
        showlegend: false // Hide from Plotly legend - we use custom checkboxes
      });
    });

    // Add reference traces for legend (SP dashed grey, PV solid grey)
    if (tagsToShow.length > 0) {
      traces.push({
        x: [null],
        y: [null],
        type: 'scatter',
        mode: 'lines',
        name: 'SP (setpoint)',
        line: { color: '#888888', width: 2, dash: '8px,4px' },
        showlegend: true
      });
      traces.push({
        x: [null],
        y: [null],
        type: 'scatter',
        mode: 'lines',
        name: 'PV (process)',
        line: { color: '#888888', width: 2 },
        showlegend: true
      });
    }

    return traces;
  }, [chartData, selectedPairs, checkedTags]);

  // Build output variable traces - only for checked output vars
  const outputTraces = useMemo(() => {
    // Filter to only checked output variables
    const varsToShow = selectedOutputVars.filter(varName => checkedOutputVars.has(varName));

    return varsToShow.map((varName) => ({
      x: chartData.map(d => d.timestamp),
      y: chartData.map(d => d[varName]),
      type: 'scatter',
      mode: 'lines',
      name: varName,
      line: {
        color: getOutputVarColor(varName),
        width: 2
      },
      hovertemplate: `%{x}<br>${varName}: %{y:.2f}<extra></extra>`,
      showlegend: false // Hide from Plotly legend - we use custom checkboxes
    }));
  }, [chartData, selectedOutputVars, checkedOutputVars]);

  // Get computed colors for Plotly (CSS variables don't work directly)
  const borderColor = getCSSColor('--border');
  const foregroundColor = getCSSColor('--foreground');
  const mutedForegroundColor = getCSSColor('--muted-foreground');
  const primaryColor = getCSSColor('--primary');

  // Common layout settings
  const commonLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'inherit',
      color: foregroundColor
    },
    margin: { l: 60, r: 20, t: 30, b: 50 },
    hovermode: 'closest',
    dragmode: 'zoom', // Enable box zoom
    xaxis: {
      gridcolor: borderColor,
      gridwidth: 1,
      linecolor: borderColor,
      linewidth: 1,
      showline: true,
      tickfont: { size: 10, color: mutedForegroundColor },
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      gridcolor: borderColor,
      gridwidth: 1,
      linecolor: borderColor,
      linewidth: 1,
      showline: true,
      tickfont: { size: 10, color: mutedForegroundColor },
      showgrid: true,
      zeroline: false,
      autorange: true
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'left',
      x: 0,
      font: { size: 9 },
      bgcolor: 'transparent',
      itemsizing: 'constant',
      itemwidth: 50,  // Wider to show dash pattern
      traceorder: 'normal'
    },
    modebar: {
      bgcolor: 'transparent',
      color: mutedForegroundColor,
      activecolor: primaryColor
    }
  };

  // Plotly config
  const plotConfig = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
    modeBarButtonsToAdd: [],
    scrollZoom: true
  };

  // Reset zoom handler
  const handleResetZoom = () => {
    // Trigger relayout to reset zoom on all charts
    const plots = document.querySelectorAll('.js-plotly-plot');
    plots.forEach(plot => {
      if (window.Plotly) {
        window.Plotly.relayout(plot, {
          'xaxis.autorange': true,
          'yaxis.autorange': true
        });
      }
    });
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground">
          Upload data and select variables to view time series
        </p>
      </div>
    );
  }

  const hasSpPvPairs = selectedPairs.length > 0;
  const hasOutputVars = selectedOutputVars.length > 0;
  const hasModes = Object.keys(modeColors).length > 0;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Time Series</h3>
          <span className="text-xs text-muted-foreground">
            Drag to box-zoom (X+Y) | Scroll to zoom | Double-click to reset
          </span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {/* Mode Overlay Toggle */}
          {hasModes && (
            <button
              onClick={() => setShowModeOverlay(!showModeOverlay)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm ${
                showModeOverlay ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'
              }`}
              title={showModeOverlay ? 'Hide mode overlay' : 'Show mode overlay'}
            >
              {showModeOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden sm:inline">Modes</span>
            </button>
          )}

          {/* Reset Zoom */}
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg transition-colors hover:bg-secondary"
            title="Reset zoom (show all)"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SP/PV Pairs Chart */}
      {hasSpPvPairs && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Setpoints & Process Values
          </p>

          {/* Custom Tag Checkboxes */}
          <div className="flex flex-wrap items-center gap-3 mb-3 pb-2 border-b border-border/50">
            {selectedPairs.map((pair) => {
              const tagColor = getTagColor(pair.baseName);
              const isChecked = checkedTags.has(pair.baseName);
              return (
                <label
                  key={pair.baseName}
                  className="flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTag(pair.baseName)}
                    className="w-3.5 h-3.5 rounded border-2 cursor-pointer accent-current"
                    style={{ accentColor: tagColor }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: isChecked ? tagColor : '#666666' }}
                  >
                    {pair.baseName}
                  </span>
                </label>
              );
            })}
          </div>

          <Plot
            data={spPvTraces}
            layout={{
              ...commonLayout,
              height: 320,
              shapes: createModeShapes('y')
            }}
            config={plotConfig}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      {/* Output Variables Chart */}
      {hasOutputVars && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Output Variables
          </p>

          {/* Custom Output Variable Checkboxes */}
          <div className="flex flex-wrap items-center gap-3 mb-3 pb-2 border-b border-border/50">
            {selectedOutputVars.map((varName) => {
              const varColor = getOutputVarColor(varName);
              const isChecked = checkedOutputVars.has(varName);
              return (
                <label
                  key={varName}
                  className="flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOutputVar(varName)}
                    className="w-3.5 h-3.5 rounded border-2 cursor-pointer accent-current"
                    style={{ accentColor: varColor }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: isChecked ? varColor : '#666666' }}
                  >
                    {varName}
                  </span>
                </label>
              );
            })}
          </div>

          <Plot
            data={outputTraces}
            layout={{
              ...commonLayout,
              height: 260,
              shapes: createModeShapes('y'),
              showlegend: false // No legend for output vars
            }}
            config={plotConfig}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      {/* Mode Legend */}
      {Object.keys(modeColors).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground font-medium">Modes:</span>
          {Object.entries(modeColors).map(([mode, colors]) => (
            <div key={mode} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: colors.border }}
              />
              <span className="text-xs text-muted-foreground">
                Mode {mode}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimeSeriesChart;
