import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // Loading state
  isLoading: true,
  loadingMessage: 'Initializing...',
  error: null,

  // Data state
  rawData: [],
  columns: [],
  previewData: [],
  totalRows: 0,

  // Column discovery
  spPvPairs: [],
  outputVariables: [],
  selectedSpPvPairs: [],
  selectedOutputVariables: [],

  // Analysis state
  isAnalyzing: false,
  analysisResults: null,
  detectedModes: [],
  tolerance: 0.02, // Merge tolerance for similar modes

  // UI state
  showDataPreview: true,
  activeTab: 'timeseries',

  // Actions
  setLoading: (isLoading, message = '') => set({
    isLoading,
    loadingMessage: message
  }),

  setError: (error) => set({ error, isLoading: false }),

  setData: (data) => {
    const previewData = data.slice(0, 100);
    set({
      rawData: data,
      previewData,
      totalRows: data.length,
      isLoading: false,
      loadingMessage: ''
    });
  },

  setColumns: (columns) => set({ columns }),

  setSpPvPairs: (pairs) => set({
    spPvPairs: pairs,
    selectedSpPvPairs: pairs.map(p => p.baseName) // Pre-select all
  }),

  setOutputVariables: (variables) => set({
    outputVariables: variables,
    selectedOutputVariables: variables.map(v => v.name) // Pre-select all
  }),

  toggleSpPvPair: (baseName) => {
    const { selectedSpPvPairs } = get();
    const isSelected = selectedSpPvPairs.includes(baseName);
    set({
      selectedSpPvPairs: isSelected
        ? selectedSpPvPairs.filter(p => p !== baseName)
        : [...selectedSpPvPairs, baseName]
    });
  },

  toggleOutputVariable: (name) => {
    const { selectedOutputVariables } = get();
    const isSelected = selectedOutputVariables.includes(name);
    set({
      selectedOutputVariables: isSelected
        ? selectedOutputVariables.filter(v => v !== name)
        : [...selectedOutputVariables, name]
    });
  },

  selectAllSpPvPairs: () => {
    const { spPvPairs } = get();
    set({ selectedSpPvPairs: spPvPairs.map(p => p.baseName) });
  },

  deselectAllSpPvPairs: () => set({ selectedSpPvPairs: [] }),

  selectAllOutputVariables: () => {
    const { outputVariables } = get();
    set({ selectedOutputVariables: outputVariables.map(v => v.name) });
  },

  deselectAllOutputVariables: () => set({ selectedOutputVariables: [] }),

  setShowDataPreview: (show) => set({ showDataPreview: show }),

  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  setAnalysisResults: (results) => set({
    analysisResults: results,
    detectedModes: results?.modes || [],
    isAnalyzing: false
  }),

  clearAnalysisResults: () => set({
    analysisResults: null,
    detectedModes: []
  }),

  setTolerance: (tolerance) => set({ tolerance }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Get selected columns for analysis
  getSelectedColumns: () => {
    const { spPvPairs, selectedSpPvPairs, outputVariables, selectedOutputVariables } = get();

    const spPvColumns = spPvPairs
      .filter(p => selectedSpPvPairs.includes(p.baseName))
      .flatMap(p => [p.spColumn, p.pvColumn]);

    const outputCols = outputVariables
      .filter(v => selectedOutputVariables.includes(v.name))
      .map(v => v.name);

    return [...spPvColumns, ...outputCols];
  },

  // Reset store
  reset: () => set({
    isLoading: true,
    loadingMessage: 'Initializing...',
    error: null,
    rawData: [],
    columns: [],
    previewData: [],
    totalRows: 0,
    spPvPairs: [],
    outputVariables: [],
    selectedSpPvPairs: [],
    selectedOutputVariables: [],
    isAnalyzing: false,
    analysisResults: null,
    detectedModes: [],
    tolerance: 0.02,
    showDataPreview: true,
    activeTab: 'timeseries'
  })
}));

export default useAppStore;
