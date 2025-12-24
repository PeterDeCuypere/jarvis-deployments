/**
 * Consistent Mode Color System
 * Used across all components for consistent mode visualization
 *
 * These colors match Plotly's shape fillcolor rendering for visual consistency
 */

// Base RGB values for all mode colors
const MODE_BASE_COLORS = [
  { r: 167, g: 139, b: 250 },  // Purple
  { r: 103, g: 232, b: 249 },  // Cyan
  { r: 134, g: 239, b: 172 },  // Green
  { r: 252, g: 211, b: 77 },   // Amber
  { r: 196, g: 181, b: 253 },  // Violet
  { r: 165, g: 243, b: 252 },  // Sky
  { r: 190, g: 242, b: 100 },  // Lime
  { r: 253, g: 230, b: 138 }   // Yellow
];

// Mode colors - Soft pastels for overlays (with transparency) - matches Plotly shapes
export const MODE_OVERLAY_COLORS = MODE_BASE_COLORS.map(
  c => `rgba(${c.r}, ${c.g}, ${c.b}, 0.25)`
);

// Mode solid colors for timelines/bars (slightly more opaque for visibility)
export const MODE_TIMELINE_COLORS = MODE_BASE_COLORS.map(
  c => `rgba(${c.r}, ${c.g}, ${c.b}, 0.7)`
);

// Mode solid colors - full opacity for badges/indicators
export const MODE_SOLID_COLORS = MODE_BASE_COLORS.map(
  c => `rgb(${c.r}, ${c.g}, ${c.b})`
);

/**
 * Get mode colors for a set of modes
 * Returns consistent colors based on mode ID (sorted order)
 * @param {Array|Object} modes - Array of mode IDs or Object with mode IDs as keys
 * @returns {Object} - Map of mode ID to color object { fill, solid, timeline }
 */
export function getModeColors(modes) {
  // Handle both array and object inputs
  const modeList = Array.isArray(modes)
    ? modes
    : Object.keys(modes);

  // Sort modes to ensure consistent color assignment
  const sortedModes = [...modeList].sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return String(a).localeCompare(String(b));
  });

  const colors = {};
  sortedModes.forEach((mode, idx) => {
    colors[mode] = {
      fill: MODE_OVERLAY_COLORS[idx % MODE_OVERLAY_COLORS.length],
      solid: MODE_SOLID_COLORS[idx % MODE_SOLID_COLORS.length],
      timeline: MODE_TIMELINE_COLORS[idx % MODE_TIMELINE_COLORS.length]
    };
  });

  return colors;
}

/**
 * Get a single mode's solid color
 * @param {string|number} mode - Mode ID
 * @param {Array|Object} allModes - All modes for consistent indexing
 * @returns {string} - Solid color for the mode
 */
export function getModeSolidColor(mode, allModes) {
  const colors = getModeColors(allModes);
  return colors[mode]?.solid || '#888888';
}

/**
 * Get a single mode's overlay color
 * @param {string|number} mode - Mode ID
 * @param {Array|Object} allModes - All modes for consistent indexing
 * @returns {string} - Overlay color for the mode
 */
export function getModeOverlayColor(mode, allModes) {
  const colors = getModeColors(allModes);
  return colors[mode]?.fill || 'rgba(128, 128, 128, 0.2)';
}
