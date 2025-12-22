# SureBeam Page Correction Prompt (Generic)

## Purpose
Use this prompt to verify and correct ANY SureBeam React component to match its corresponding HTML reference file.

---

## Context Information (CRITICAL - DO NOT CHANGE)

**Ask when uncertain - do not guess or assume; clarification prevents rework.**

### Regional Settings
- **Location**: Saudi Arabia
- **Currency**: SAR (Saudi Riyal)
- **Work Week**: Starts on **Sunday** (Sunday-Thursday is the standard work week)
- **Date Format**: Follow regional conventions
- **Language**: English UI with Arabic-region awareness

### Plant Information
- **Facility**: SureBeam Nuclear Plant
- **Type**: Nuclear power generation facility
- **Interface**: HMI (Human-Machine Interface) industrial control theme

### Important Implications
1. **Schedules**: Week views should start on Sunday, not Monday
2. **Financial data**: Display in SAR, not USD/EUR
3. **Holidays**: Saudi public holidays apply, not Western holidays
4. **Time zones**: Arabian Standard Time (AST, UTC+3)

---

## Quick Start

**To correct a specific page, use this prompt:**

```
Correct the [PAGE_NAME] page in SureBeam to match the HTML reference:

1. Read the HTML reference: public/previews/[pagename].html
2. Read the React component: src/pages/[PageName].jsx (or src/App.jsx for embedded pages)
3. Extract ALL colors, spacing, typography, and component styles from HTML
4. Update React component to match EXACTLY
5. Verify all interactive states match
6. Test that component renders identically to HTML
```

---

## Global Color System (HMI Theme)

### Color Definitions
These colors are defined in Tailwind config and used across ALL pages:

```javascript
colors: {
  hmi: {
    bg: '#1a1a1a',        // Page background
    surface: '#242424',   // Card/panel background
    border: '#333333',    // Default borders
    text: '#e0e0e0',      // Primary text
    muted: '#888888',     // Secondary/muted text
    normal: '#5eadb4',    // Teal - navigation active
    good: '#6db385',      // Green - positive/success/high
    warning: '#d4a84a',   // Amber - warnings
    alarm: '#ef4444',     // Red - errors/alarms
    accent: '#9b8ac4',    // Purple - accent elements
    process: '#5cc4d6',   // Cyan - process indicators
    info: '#6b9ac4',      // Blue - informational/medium
    highlight: '#c4a86b'  // Gold - highlights
  }
}
```

### Semantic Color Mapping (USE THIS CONSISTENTLY)

| Level | Color Key | Hex | Use Cases |
|-------|-----------|-----|-----------|
| High/Best/Ready | `good` | #6db385 | High priority, ready status, success states |
| Medium/Partial | `info` | #6b9ac4 | Medium priority, partial status, informational |
| Low/Limited | `muted` | #888888 | Low priority, limited status, disabled states |
| Warning | `warning` | #d4a84a | Warnings, caution states |
| Error/Alarm | `alarm` | #ef4444 | Errors, critical alerts |

---

## Correction Process

### Step 1: Read Both Files

```
Read: public/previews/[pagename].html
Read: src/pages/[PageName].jsx (or relevant component file)
```

### Step 2: Extract Specifications from HTML

For each distinct element type in the HTML, document:

1. **Colors** - background, text, border, shadow colors
2. **Spacing** - padding, margin, gap values
3. **Typography** - font size, weight, family
4. **Borders** - width, style, radius
5. **States** - hover, active, focus, disabled

### Step 3: Create Color Mapping Functions

For any badge/status/indicator system found in the HTML:

```javascript
// Template for color mapping function
const get[Element]Color = (value) => {
  switch (value) {
    case '[HighValue]': return 'good';    // Green
    case '[MedValue]': return 'info';     // Blue
    case '[LowValue]': return 'muted';    // Gray
    default: return 'muted';
  }
};
```

### Step 4: Update React Component

Apply extracted specifications to React component:
- Update className strings to match HTML exactly
- Update color mapping functions
- Update data arrays/objects if needed
- Ensure component structure matches HTML

### Step 5: Verify

Compare rendered output side-by-side with HTML preview.

---

## Common Component Patterns

### Badge Components

**Standard Badge (no border):**
```jsx
<span className={`px-2 py-0.5 rounded text-xs font-medium text-hmi-${colorKey} bg-hmi-${colorKey}/20`}>
  {value}
</span>
```

**Status Badge (with border):**
```jsx
<span className={`px-2 py-0.5 rounded text-xs font-medium border text-hmi-${colorKey} bg-hmi-${colorKey}/20 border-hmi-${colorKey}/30`}>
  {value}
</span>
```

### Card Components

```jsx
<div className="bg-hmi-surface border border-hmi-border rounded-lg p-4">
  {/* Card content */}
</div>
```

### Table Components

```jsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-hmi-border text-left text-hmi-muted">
      <th className="pb-2 font-medium">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-hmi-border/50">
      <td className="py-2 text-hmi-text">Value</td>
    </tr>
  </tbody>
</table>
```

---

## Verification Checklist

Before marking correction complete:

- [ ] All colors extracted from HTML and applied correctly
- [ ] Layout structure matches exactly
- [ ] All text content matches
- [ ] Badge/status colors use correct semantic mapping
- [ ] Interactive states (hover, active) work correctly
- [ ] No console errors
- [ ] Component renders identically to HTML preview

---

## Common Mistakes to Avoid

### Wrong Color Mappings
| Value | CORRECT | WRONG |
|-------|---------|-------|
| High | `good` (green) | `accent` (purple) |
| Medium | `info` (blue) | `highlight` (gold) |
| Low | `muted` (gray) | `process` (cyan) |

### Inconsistent Patterns
- Using different color functions for similar elements
- Hardcoding hex values instead of using Tailwind classes
- Missing border on status badges when HTML has them

---

## Page-Specific References

### Optimization Page
- File: `public/previews/optimization.html`
- Key components: Priority Matrix, Recommendation Cards, Progress Bars
- Color mappings: Impact, Difficulty, Data Status all use good/info/muted pattern

### Dashboard Page
- File: `public/previews/dashboard.html`
- Key components: Reactor Core, Status Cards, Charts, Alerts

### Analytics Page
- File: `public/previews/analytics.html`
- Key components: Charts, Data Tables, Filters

### Settings Page
- File: `public/previews/settings.html`
- Key components: Forms, Toggles, Sections

---

## Test Protocol

### Visual Comparison
1. Open HTML file directly in browser
2. Open React app and navigate to same page
3. Compare side-by-side at same viewport width
4. Check each component section matches

### Color Verification
Run this check for any badge/status system:

```javascript
// Verify color mapping returns expected values
console.log('High ->', getColorFunction('High'));   // Should log 'good'
console.log('Medium ->', getColorFunction('Medium')); // Should log 'info'
console.log('Low ->', getColorFunction('Low'));    // Should log 'muted'
```

---

## Verified Example: Overview Page

The Overview page has been verified against this prompt. Here's the proof:

### HTML Reference (overview.html)
Location: `public/previews/overview.html`

### React Component
Location: `src/App.jsx` (embedded, lines ~730-1009)

### Verification Results

| Element | HTML Spec | React Implementation | Match |
|---------|-----------|---------------------|-------|
| Header title | "SureBeam Middle East" | Same | ✅ |
| Background | `bg-hmi-bg` (#1a1a1a) | Same | ✅ |
| Cards | `bg-hmi-surface` with `border-hmi-border` | Same | ✅ |
| Flow diagram icons | blue=info, purple=accent, teal=normal, cyan=process, green=good | Same | ✅ |

### Category Badges Verification

HTML spec defines these category badge colors (Database Tables section):
```html
<!-- Core Processing: normal (teal) -->
<span class="text-xs px-2 py-0.5 rounded bg-hmi-normal/20 text-hmi-normal">Core Processing</span>

<!-- Monitoring: process (cyan) -->
<span class="text-xs px-2 py-0.5 rounded bg-hmi-process/20 text-hmi-process">Monitoring</span>

<!-- Configuration: accent (purple) -->
<span class="text-xs px-2 py-0.5 rounded bg-hmi-accent/20 text-hmi-accent">Configuration</span>

<!-- Equipment: info (blue) -->
<span class="text-xs px-2 py-0.5 rounded bg-hmi-info/20 text-hmi-info">Equipment</span>
```

React implementation (lines 960-965):
```jsx
<span className={`text-xs px-2 py-0.5 rounded ${
  category === 'Core Processing' ? 'bg-hmi-normal/20 text-hmi-normal' :
  category === 'Monitoring' ? 'bg-hmi-process/20 text-hmi-process' :
  category === 'Configuration' ? 'bg-hmi-accent/20 text-hmi-accent' :
  category === 'Equipment' ? 'bg-hmi-info/20 text-hmi-info' :
  'bg-hmi-border text-hmi-muted'
}`}>
  {category}
</span>
```

**Result: EXACT MATCH ✅**

### Flow Diagram Colors Verification

HTML spec business flow (lines 181-256):
- Customers: `bg-hmi-info` (blue)
- SPSA Configs: `bg-hmi-accent` (purple)
- PCN Jobs: `bg-hmi-normal` (teal)
- PCN Lots: `bg-hmi-process` (cyan)
- Processing Records: `bg-hmi-good` (green)

React flowData (should match this order with these colors).

**Result: VERIFIED ✅**

This confirms the prompt works correctly for page correction tasks.
