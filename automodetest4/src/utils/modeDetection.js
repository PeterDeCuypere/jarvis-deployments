/**
 * Mode Detection and Merging Algorithms
 * Step 3: Common Segment Detection
 * Step 4: Mode Merging
 * Step 5: Optimization Insights
 */

import { extractContiguousRegions, analyzeVariableStability } from './stabilityDetection';
import { calculateSegmentDuration } from './timeFormat';

const MIN_SEGMENT_LENGTH = 20;

/**
 * Calculate mean of an array
 * @param {number[]} arr
 * @returns {number}
 */
function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate standard deviation of an array
 * @param {number[]} arr
 * @returns {number}
 */
function std(arr) {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Find common segments where ALL input variables are stable simultaneously
 * @param {Object} allVariableSegments - Dict of { varName: [[start, end], ...] }
 * @param {number} nSamples - Total number of data points
 * @returns {Array<[number, number]>} - Common stable periods
 */
export function findCommonSegments(allVariableSegments, nSamples) {
  const variableNames = Object.keys(allVariableSegments);
  if (variableNames.length === 0) return [];

  // Start with all true
  const combinedMask = new Array(nSamples).fill(true);

  for (const varName of variableNames) {
    const segments = allVariableSegments[varName];
    const varMask = new Array(nSamples).fill(false);

    for (const [start, end] of segments) {
      for (let i = start; i <= end; i++) {
        varMask[i] = true;
      }
    }

    // AND operation
    for (let i = 0; i < nSamples; i++) {
      combinedMask[i] = combinedMask[i] && varMask[i];
    }
  }

  return extractContiguousRegions(combinedMask, MIN_SEGMENT_LENGTH);
}

/**
 * Create segments DataFrame with SP values and output variable statistics
 * @param {Array<[number, number]>} commonSegments - Common segments
 * @param {Array} spPvPairs - SP/PV pairs
 * @param {string[]} outputVars - Output variable names
 * @param {Object[]} data - Raw data
 * @returns {Object[]} - Segments data
 */
export function createSegmentsData(commonSegments, spPvPairs, outputVars, data) {
  const rows = [];

  for (let segIdx = 0; segIdx < commonSegments.length; segIdx++) {
    const [start, end] = commonSegments[segIdx];

    const row = {
      segment: segIdx + 1,
      start: start,
      end: end,
      length: end - start + 1,
      spValues: {},
      outputStats: {}
    };

    // SP values from each input pair
    for (const pair of spPvPairs) {
      const spValues = [];
      for (let i = start; i <= end; i++) {
        const val = parseFloat(data[i][pair.sp]);
        if (!isNaN(val)) spValues.push(val);
      }
      row.spValues[pair.baseName] = mean(spValues);
    }

    // Output variable statistics
    for (const outputCol of outputVars) {
      const values = [];
      for (let i = start; i <= end; i++) {
        const val = parseFloat(data[i][outputCol]);
        if (!isNaN(val)) values.push(val);
      }

      const meanVal = mean(values);
      const stdVal = std(values);

      row.outputStats[outputCol] = {
        mean: meanVal,
        std: stdVal,
        cv: meanVal !== 0 ? stdVal / Math.abs(meanVal) : 0
      };
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Merge similar modes based on tolerance
 * @param {Object[]} segmentsData - Segments data
 * @param {Array} spPvPairs - SP/PV pairs
 * @param {string[]} outputVars - Output variable names
 * @param {number} tolerance - Relative tolerance (default 0.02)
 * @returns {{ groups: number[][], modes: Object[] }}
 */
export function mergeSimilarModes(segmentsData, spPvPairs, outputVars, tolerance = 0.02) {
  const groups = [];
  const used = new Set();

  for (let i = 0; i < segmentsData.length; i++) {
    if (used.has(i)) continue;

    const group = [i];

    for (let j = i + 1; j < segmentsData.length; j++) {
      if (used.has(j)) continue;

      let allClose = true;

      // Compare SP values
      for (const pair of spPvPairs) {
        const valI = segmentsData[i].spValues[pair.baseName];
        const valJ = segmentsData[j].spValues[pair.baseName];

        let relDiff;
        if (valI !== 0) {
          relDiff = Math.abs(valI - valJ) / Math.abs(valI);
        } else {
          relDiff = Math.abs(valI - valJ);
        }

        if (relDiff > tolerance) {
          allClose = false;
          break;
        }
      }

      // Compare output means
      if (allClose) {
        for (const outputCol of outputVars) {
          const valI = segmentsData[i].outputStats[outputCol]?.mean || 0;
          const valJ = segmentsData[j].outputStats[outputCol]?.mean || 0;

          let relDiff;
          if (valI !== 0) {
            relDiff = Math.abs(valI - valJ) / Math.abs(valI);
          } else {
            relDiff = Math.abs(valI - valJ);
          }

          if (relDiff > tolerance) {
            allClose = false;
            break;
          }
        }
      }

      if (allClose) {
        group.push(j);
        used.add(j);
      }
    }

    groups.push(group);
    used.add(i);
  }

  // Create merged modes (keep first segment's statistics for each group)
  const modes = groups.map((group, modeIdx) => {
    const firstSeg = segmentsData[group[0]];
    return {
      mode: modeIdx + 1,
      mergedFrom: group.map(g => segmentsData[g].segment),
      totalLength: group.reduce((sum, g) => sum + segmentsData[g].length, 0),
      segments: group.map(g => ({
        segment: segmentsData[g].segment,
        start: segmentsData[g].start,
        end: segmentsData[g].end,
        length: segmentsData[g].length
      })),
      spValues: { ...firstSeg.spValues },
      outputStats: { ...firstSeg.outputStats }
    };
  });

  return { groups, modes };
}

/**
 * Calculate optimization insights
 * @param {Object[]} modes - Merged modes
 * @param {string[]} outputVars - Output variable names
 * @param {Array} spPvPairs - SP/PV pairs
 * @returns {Object} - Insights
 */
export function calculateOptimizationInsights(modes, outputVars, spPvPairs) {
  if (modes.length === 0) return {};

  const insights = {};

  // Analyze each output variable
  for (const outputCol of outputVars) {
    const values = modes.map(m => ({
      mode: m.mode,
      value: m.outputStats[outputCol]?.mean || 0
    })).filter(v => !isNaN(v.value));

    if (values.length === 0) continue;

    // Find mode with max value
    const maxEntry = values.reduce((max, v) => v.value > max.value ? v : max, values[0]);

    // Find mode with min value
    const minEntry = values.reduce((min, v) => v.value < min.value ? v : min, values[0]);

    insights[outputCol] = {
      maxMode: maxEntry.mode,
      maxValue: maxEntry.value,
      minMode: minEntry.mode,
      minValue: minEntry.value
    };
  }

  // Calculate total throughput (sum of SP values)
  const spKeys = spPvPairs.map(p => p.baseName);
  if (spKeys.length > 0) {
    const throughputs = modes.map(m => ({
      mode: m.mode,
      value: spKeys.reduce((sum, key) => sum + (m.spValues[key] || 0), 0)
    }));

    const maxThroughput = throughputs.reduce((max, t) => t.value > max.value ? t : max, throughputs[0]);

    insights.throughput = {
      maxMode: maxThroughput.mode,
      maxValue: maxThroughput.value
    };
  }

  return insights;
}

/**
 * Run full mode detection pipeline
 * @param {Object[]} data - Raw data array
 * @param {Array} selectedPairs - Selected SP/PV pairs
 * @param {string[]} outputVars - Selected output variables
 * @param {number} tolerance - Merge tolerance
 * @returns {Object} - Full analysis results
 */
export function runModeDetection(data, selectedPairs, outputVars, tolerance) {
  const nSamples = data.length;
  const variableAnalysis = {};
  const allVariableSegments = {};

  // Analyze each PV/SP pair
  for (const pair of selectedPairs) {
    const pvData = data.map(row => parseFloat(row[pair.pv]));
    const spData = data.map(row => parseFloat(row[pair.sp]));

    // Check for NaN values and filter them out
    const validIndices = [];
    for (let i = 0; i < nSamples; i++) {
      if (!isNaN(pvData[i]) && !isNaN(spData[i])) {
        validIndices.push(i);
      }
    }

    if (validIndices.length < MIN_SEGMENT_LENGTH) {
      variableAnalysis[pair.baseName] = {
        phase1Segments: [],
        phase2Segments: [],
        adaptiveK: 2.5,
        controlLimits: { ucl: 0, lcl: 0, mean: 0 }
      };
      allVariableSegments[pair.baseName] = [];
      continue;
    }

    const analysis = analyzeVariableStability(pvData, spData);
    variableAnalysis[pair.baseName] = analysis;
    allVariableSegments[pair.baseName] = analysis.phase2Segments;
  }

  // Find common segments
  const commonSegments = findCommonSegments(allVariableSegments, nSamples);

  // Create segments data
  const segmentsData = createSegmentsData(commonSegments, selectedPairs, outputVars, data);

  // Merge similar modes
  const { groups, modes } = mergeSimilarModes(segmentsData, selectedPairs, outputVars, tolerance);

  // Calculate optimization insights
  const insights = calculateOptimizationInsights(modes, outputVars, selectedPairs);

  return {
    variableAnalysis,
    commonSegments,
    segmentsData,
    modes,
    mergeGroups: groups,
    insights,
    summary: {
      totalDataPoints: nSamples,
      totalSegments: commonSegments.length,
      totalModes: modes.length,
      inputVariables: selectedPairs.length,
      outputVariables: outputVars.length
    }
  };
}

/**
 * Main entry point for operating mode detection
 * @param {Object[]} data - Raw data array
 * @param {Array} selectedPairs - Selected SP/PV pairs (with spColumn, pvColumn, baseName)
 * @param {string[]} outputVars - Selected output variable names
 * @param {string} timestampCol - Timestamp column name
 * @param {number} tolerance - Merge tolerance (default 0.02)
 * @returns {Object} - Analysis results
 */
export function detectOperatingModes(data, selectedPairs, outputVars, timestampCol, tolerance = 0.02) {
  if (!data || data.length === 0) {
    throw new Error('No data provided');
  }

  if (!selectedPairs || selectedPairs.length === 0) {
    throw new Error('No SP/PV pairs selected');
  }

  // Convert selectedPairs format (from store) to internal format
  const pairs = selectedPairs.map(p => ({
    pv: p.pvColumn,
    sp: p.spColumn,
    baseName: p.baseName
  }));

  // Run the detection
  const results = runModeDetection(data, pairs, outputVars || [], tolerance);

  // Transform to format expected by UI
  const modeSegments = [];
  const modeStatistics = {};
  const modeDetails = {};

  // Build mode segments list (each segment with its mode ID)
  // Calculate actual time durations from timestamps
  for (const mode of results.modes) {
    let totalDurationMs = 0;
    const segmentDurations = [];

    for (const seg of mode.segments) {
      // Calculate actual duration from timestamps
      const durationMs = calculateSegmentDuration(data, seg.start, seg.end, 'timestamp');
      segmentDurations.push(durationMs);
      totalDurationMs += durationMs || 0;

      modeSegments.push({
        mode: mode.mode,
        startIdx: seg.start,
        endIdx: seg.end,
        duration: seg.length,
        durationMs: durationMs  // Add actual time duration
      });
    }

    // Calculate average duration in milliseconds
    const validDurations = segmentDurations.filter(d => d !== null && d > 0);
    const avgDurationMs = validDurations.length > 0
      ? validDurations.reduce((a, b) => a + b, 0) / validDurations.length
      : null;

    modeStatistics[mode.mode] = {
      totalDuration: mode.totalLength,           // Keep points for backwards compatibility
      totalDurationMs: totalDurationMs,          // Add actual time duration
      percentage: (mode.totalLength / data.length) * 100,
      occurrences: mode.segments.length,
      avgDuration: mode.totalLength / mode.segments.length,  // Keep points
      avgDurationMs: avgDurationMs               // Add actual time duration
    };

    modeDetails[mode.mode] = {
      setpointValues: mode.spValues,
      outputStats: mode.outputStats
    };
  }

  // Sort segments by start index
  modeSegments.sort((a, b) => a.startIdx - b.startIdx);

  // Calculate stability metrics
  let stablePoints = 0;
  for (const seg of modeSegments) {
    stablePoints += seg.duration;
  }
  const transientPoints = data.length - stablePoints;

  const stabilityMetrics = {
    overallStability: (stablePoints / data.length) * 100,
    stablePoints,
    transientPoints,
    byVariable: {}
  };

  // Per-variable stability
  for (const [varName, analysis] of Object.entries(results.variableAnalysis)) {
    let varStable = 0;
    for (const [start, end] of analysis.phase2Segments) {
      varStable += end - start + 1;
    }
    stabilityMetrics.byVariable[varName] = {
      stability: (varStable / data.length) * 100,
      stablePoints: varStable,
      transientPoints: data.length - varStable
    };
  }

  // Calculate output statistics by mode
  const outputStatsByMode = {};
  for (const mode of results.modes) {
    outputStatsByMode[mode.mode] = {};
    for (const [varName, stats] of Object.entries(mode.outputStats)) {
      outputStatsByMode[mode.mode][varName] = {
        mean: stats.mean,
        std: stats.std,
        min: null,
        max: null
      };
    }
  }

  // Calculate min/max for each output variable per mode
  for (const mode of results.modes) {
    for (const seg of mode.segments) {
      for (const varName of outputVars || []) {
        if (!outputStatsByMode[mode.mode][varName]) {
          outputStatsByMode[mode.mode][varName] = { mean: 0, std: 0, min: Infinity, max: -Infinity };
        }
        for (let i = seg.start; i <= seg.end; i++) {
          const val = parseFloat(data[i][varName]);
          if (!isNaN(val)) {
            if (outputStatsByMode[mode.mode][varName].min === null || val < outputStatsByMode[mode.mode][varName].min) {
              outputStatsByMode[mode.mode][varName].min = val;
            }
            if (outputStatsByMode[mode.mode][varName].max === null || val > outputStatsByMode[mode.mode][varName].max) {
              outputStatsByMode[mode.mode][varName].max = val;
            }
          }
        }
      }
    }
  }

  return {
    modeSegments,
    modeStatistics,
    modeDetails,
    stabilityMetrics,
    outputStatsByMode,
    insights: results.insights,
    summary: results.summary
  };
}
