/**
 * Zustand store for application state management
 */

import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Data state
  rawData: [],
  columns: [],
  fileName: null,

  // Column detection state
  detectedPairs: [],
  ambiguousSp: {},
  unmatched: [],
  datetimeColumns: [],
  selectedTimestampCol: null,

  // Selection state
  selectedPairs: [],
  selectedOutputVars: [],

  // Analysis parameters
  tolerance: 0.02,

  // Analysis state
  isAnalyzing: false,
  analysisResults: null,
  analysisError: null,

  // UI state
  activeTab: 'timeseries',
  showDataPreview: true,

  // Actions
  setData: (data, columns, fileName) => set({
    rawData: data,
    columns,
    fileName,
    analysisResults: null,
    analysisError: null
  }),

  setDetectedPairs: (pairs, ambiguous, unmatched) => set({
    detectedPairs: pairs,
    ambiguousSp: ambiguous,
    unmatched: unmatched,
    // Normalize pair structure: use spColumn/pvColumn consistently
    selectedPairs: pairs.map(p => ({
      baseName: p.baseName,
      spColumn: p.sp || p.spColumn,
      pvColumn: p.pv || p.pvColumn,
      selected: true
    }))
  }),

  setDatetimeColumns: (cols) => set({
    datetimeColumns: cols,
    selectedTimestampCol: cols.length > 0 ? cols[0] : null
  }),

  setSelectedTimestampCol: (col) => set({ selectedTimestampCol: col }),

  setOutputVariables: (vars) => set({
    selectedOutputVars: vars.map(v => ({ name: v, selected: true }))
  }),

  togglePairSelection: (baseName) => set(state => ({
    selectedPairs: state.selectedPairs.map(p =>
      p.baseName === baseName ? { ...p, selected: !p.selected } : p
    )
  })),

  toggleOutputVarSelection: (varName) => set(state => ({
    selectedOutputVars: state.selectedOutputVars.map(v =>
      v.name === varName ? { ...v, selected: !v.selected } : v
    )
  })),

  setTolerance: (tolerance) => set({ tolerance }),

  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  setAnalysisResults: (results) => set({
    analysisResults: results,
    analysisError: null
  }),

  setAnalysisError: (error) => set({
    analysisError: error,
    analysisResults: null
  }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleDataPreview: () => set(state => ({
    showDataPreview: !state.showDataPreview
  })),

  getSelectedPairs: () => {
    const state = get();
    return state.selectedPairs.filter(p => p.selected);
  },

  getSelectedOutputVars: () => {
    const state = get();
    return state.selectedOutputVars
      .filter(v => v.selected)
      .map(v => v.name);
  },

  reset: () => set({
    rawData: [],
    columns: [],
    fileName: null,
    detectedPairs: [],
    ambiguousSp: {},
    unmatched: [],
    datetimeColumns: [],
    selectedTimestampCol: null,
    selectedPairs: [],
    selectedOutputVars: [],
    tolerance: 0.02,
    isAnalyzing: false,
    analysisResults: null,
    analysisError: null,
    activeTab: 'timeseries',
    showDataPreview: true
  })
}));

export default useAppStore;
