// Color palette for mode visualization
export const MODE_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#22c55e', // Green
  '#eab308', // Yellow
];

export function getModeColor(modeIndex) {
  return MODE_COLORS[modeIndex % MODE_COLORS.length];
}

export function getModeColorWithAlpha(modeIndex, alpha = 1) {
  const hex = MODE_COLORS[modeIndex % MODE_COLORS.length];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
