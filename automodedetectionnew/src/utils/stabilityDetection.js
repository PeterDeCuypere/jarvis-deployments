/**
 * Stability Detection Algorithms
 * Phase 1: SP Stability Detection
 * Phase 2: PV Stability Detection (Two-Pass)
 */

// Fixed parameters (do not expose to user)
const WINDOW_SIZE = 20;
const SLOPE_THRESHOLD = 0.01;
const MIN_SEGMENT_LENGTH = 20;

// Adaptive k parameters
const K_MIN = 2.0;
const K_MAX = 3.5;
const K_ALPHA = 5.0;
const NOISE_RATIO_LOW = 0.05;
const NOISE_RATIO_HIGH = 0.9;

/**
 * Extract contiguous True regions from a boolean mask
 * @param {boolean[]} mask - Boolean array
 * @param {number} minLength - Minimum region length
 * @returns {Array<[number, number]>} - List of (start, end) tuples
 */
export function extractContiguousRegions(mask, minLength) {
  const regions = [];
  const n = mask.length;
  let i = 0;

  while (i < n) {
    if (mask[i]) {
      const start = i;
      while (i < n && mask[i]) {
        i++;
      }
      const end = i - 1;
      const length = end - start + 1;

      if (length >= minLength) {
        regions.push([start, end]);
      }
    } else {
      i++;
    }
  }

  return regions;
}

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
 * Calculate linear regression slope
 * @param {number[]} y - Values
 * @returns {number} - Slope
 */
function linearSlope(y) {
  const n = y.length;
  if (n < 2) return 0;

  const xMean = (n - 1) / 2;
  const yMean = mean(y);

  let num = 0;
  let den = 0;

  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (y[i] - yMean);
    den += Math.pow(i - xMean, 2);
  }

  return den === 0 ? 0 : num / den;
}

/**
 * Step 1: SP Stability Detection (Phase 1)
 * Detect stable segments where SP is constant
 * @param {number[]} spData - SP values
 * @returns {Array<[number, number]>} - Stable segments
 */
export function detectSpStableSegments(spData) {
  const n = spData.length;
  if (n < WINDOW_SIZE) return [];

  // 1. Standardize SP for scale-independent detection
  const spStd = std(spData);
  const spMean = mean(spData);
  const standardized = spData.map(x => spStd === 0 ? 0 : (x - spMean) / spStd);

  // 2. Calculate rolling slope using linear regression
  const slopes = new Array(n).fill(0);
  const halfWindow = Math.floor(WINDOW_SIZE / 2);

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(n, i + halfWindow + 1);
    if (end - start >= 3) {
      const windowData = standardized.slice(start, end);
      slopes[i] = linearSlope(windowData);
    }
  }

  // 3. Stable where |slope| < threshold
  const stableMask = slopes.map(s => Math.abs(s) < SLOPE_THRESHOLD);

  // 4. Extract contiguous regions >= min_length
  return extractContiguousRegions(stableMask, MIN_SEGMENT_LENGTH);
}

/**
 * Calculate noise ratio using difference-based variance estimator
 * @param {number[]} residuals
 * @returns {number} - Noise ratio (typically 0 to ~1.4)
 */
function calculateNoiseRatio(residuals) {
  const stdTotal = std(residuals);
  if (stdTotal === 0) return 1.0;

  // Difference-based std estimation
  const diffs = [];
  for (let i = 1; i < residuals.length; i++) {
    diffs.push(residuals[i] - residuals[i - 1]);
  }
  const diffStd = std(diffs) / Math.sqrt(2);

  return diffStd / stdTotal;
}

/**
 * Calculate adaptive k-value based on noise ratio
 * @param {number} noiseRatio
 * @returns {number} - k-value for control limits
 */
function calculateAdaptiveK(noiseRatio) {
  if (noiseRatio <= NOISE_RATIO_LOW) {
    return K_MIN;
  } else if (noiseRatio >= NOISE_RATIO_HIGH) {
    return K_MAX;
  } else {
    // Exponential curve: fast rise for moderate noise, then plateau
    const normalized = (noiseRatio - NOISE_RATIO_LOW) / (NOISE_RATIO_HIGH - NOISE_RATIO_LOW);
    const scaled = 1 - Math.exp(-K_ALPHA * normalized);
    return K_MIN + (K_MAX - K_MIN) * scaled;
  }
}

/**
 * Replace short outliers with neighbor average
 * @param {number[]} residuals
 * @param {boolean[]} ooc - Out-of-control mask
 * @param {number} nNeighbors - Number of neighbors to use
 * @returns {number[]} - Cleaned residuals
 */
function replaceShortOutliers(residuals, ooc, nNeighbors) {
  const cleaned = [...residuals];

  for (let idx = 0; idx < residuals.length; idx++) {
    if (!ooc[idx]) continue;

    const neighbors = [];
    const offsets = nNeighbors === 2 ? [-2, -1, 1, 2] : [-2, -1, 1, 2];

    for (const offset of offsets) {
      const ni = idx + offset;
      if (ni >= 0 && ni < residuals.length && !ooc[ni]) {
        neighbors.push(residuals[ni]);
      }
    }

    if (neighbors.length > 0) {
      cleaned[idx] = mean(neighbors);
    }
  }

  return cleaned;
}

/**
 * Replace only single-point outliers with neighbor average
 * @param {number[]} residuals
 * @param {boolean[]} ooc - Out-of-control mask
 * @param {number} nNeighbors - Number of neighbors to use
 * @returns {number[]} - Cleaned residuals
 */
function replaceSingleOutliers(residuals, ooc, nNeighbors) {
  const cleaned = [...residuals];
  const n = residuals.length;

  for (let i = 0; i < n; i++) {
    if (!ooc[i]) continue;

    // Check if single-point outlier (neighbors are not OOC)
    const prevOoc = i > 0 ? ooc[i - 1] : false;
    const nextOoc = i < n - 1 ? ooc[i + 1] : false;

    if (!prevOoc && !nextOoc) {
      // Single-point outlier - replace with neighbor average
      const neighbors = [];

      // 2 neighbors before
      for (let j = Math.max(0, i - 2); j < i; j++) {
        if (!ooc[j]) {
          neighbors.push(residuals[j]);
        }
      }

      // 2 neighbors after
      for (let j = i + 1; j < Math.min(n, i + 3); j++) {
        if (!ooc[j]) {
          neighbors.push(residuals[j]);
        }
      }

      if (neighbors.length > 0) {
        cleaned[i] = mean(neighbors);
      }
    }
  }

  return cleaned;
}

/**
 * Split segment at out-of-control points
 * @param {number} segStart - Global start index
 * @param {boolean[]} oocRelative - OOC mask relative to segment
 * @param {number} minLength - Minimum segment length
 * @returns {Array<[number, number]>} - Global (start, end) tuples
 */
function splitAtOoc(segStart, oocRelative, minLength) {
  // In-control mask is inverse of OOC
  const inControl = oocRelative.map(x => !x);

  // Extract contiguous in-control regions
  const relativeRegions = extractContiguousRegions(inControl, minLength);

  // Convert to global indices
  return relativeRegions.map(([relStart, relEnd]) => [
    segStart + relStart,
    segStart + relEnd
  ]);
}

/**
 * Step 2: PV Stability Detection (Phase 2 - Two-Pass)
 * @param {Array<[number, number]>} phase1Segments - Phase 1 segments
 * @param {number[]} pvData - PV values
 * @param {number[]} spData - SP values
 * @returns {{ segments: Array<[number, number]>, adaptiveK: number, controlLimits: Object }}
 */
export function detectPvStability(phase1Segments, pvData, spData) {
  if (phase1Segments.length === 0) {
    return { segments: [], adaptiveK: 2.5, controlLimits: { ucl: 0, lcl: 0 } };
  }

  // Calculate residuals
  const residuals = pvData.map((pv, i) => pv - spData[i]);

  // Pool residuals from all Phase 1 segments
  const pooled = [];
  for (const [start, end] of phase1Segments) {
    for (let i = start; i <= end; i++) {
      pooled.push(residuals[i]);
    }
  }

  // === Pass 1: Initial 2-sigma limits + short outlier replacement ===
  const meanInit = mean(pooled);
  const stdInit = std(pooled);
  const uclInit = meanInit + 2 * stdInit;
  const lclInit = meanInit - 2 * stdInit;

  // Detect OOC
  const ooc = residuals.map(r => r > uclInit || r < lclInit);

  // Replace short outliers with 2-neighbor average (1+1)
  const residualsCleaned = replaceShortOutliers(residuals, ooc, 2);

  // === Pass 2: Adaptive k control limits ===

  // Pool cleaned residuals
  const pooledCleaned = [];
  for (const [start, end] of phase1Segments) {
    for (let i = start; i <= end; i++) {
      pooledCleaned.push(residualsCleaned[i]);
    }
  }

  // Calculate refined control limits with adaptive k
  const noiseRatio = calculateNoiseRatio(pooledCleaned);
  const k = calculateAdaptiveK(noiseRatio);

  const meanVal = mean(pooledCleaned);
  const stdVal = std(pooledCleaned);
  const ucl = meanVal + k * stdVal;
  const lcl = meanVal - k * stdVal;

  // For each Phase 1 segment, refine
  const finalSegments = [];

  for (const [segStart, segEnd] of phase1Segments) {
    const segResiduals = residualsCleaned.slice(segStart, segEnd + 1);

    // Detect OOC
    const segOoc = segResiduals.map(r => r > ucl || r < lcl);

    // Replace single-point outliers with 4-neighbor average (2+2)
    const segCleaned = replaceSingleOutliers(segResiduals, segOoc, 4);

    // Recalculate OOC after cleaning
    const oocFinal = segCleaned.map(r => r > ucl || r < lcl);

    // Split at remaining OOC -> extract in-control sub-segments
    const subSegments = splitAtOoc(segStart, oocFinal, MIN_SEGMENT_LENGTH);
    finalSegments.push(...subSegments);
  }

  return {
    segments: finalSegments,
    adaptiveK: k,
    controlLimits: { ucl, lcl, mean: meanVal }
  };
}

/**
 * Full stability analysis for a single PV/SP pair
 * @param {number[]} pvData
 * @param {number[]} spData
 * @returns {Object} - Analysis results
 */
export function analyzeVariableStability(pvData, spData) {
  // Phase 1: SP Stability
  const phase1Segments = detectSpStableSegments(spData);

  // Phase 2: PV Stability
  const phase2Results = detectPvStability(phase1Segments, pvData, spData);

  return {
    phase1Segments,
    phase2Segments: phase2Results.segments,
    adaptiveK: phase2Results.adaptiveK,
    controlLimits: phase2Results.controlLimits
  };
}
