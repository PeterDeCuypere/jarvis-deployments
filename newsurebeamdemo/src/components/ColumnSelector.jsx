import { useState } from 'react';
import { ChevronDown, ChevronRight, Activity, BarChart3, Info } from 'lucide-react';
import useAppStore from '../store/appStore';

function ColumnSelector() {
  const {
    spPvPairs,
    outputVariables,
    selectedSpPvPairs,
    selectedOutputVariables,
    toggleSpPvPair,
    toggleOutputVariable,
    selectAllSpPvPairs,
    deselectAllSpPvPairs,
    selectAllOutputVariables,
    deselectAllOutputVariables
  } = useAppStore();

  const [spPvExpanded, setSpPvExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* Purpose indicator */}
      <div className="card bg-primary/10 border-primary/30">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">
            Select the variables below to include in mode detection analysis.
            The algorithm will use these measurements to identify distinct operating regimes.
          </p>
        </div>
      </div>

      {/* SP/PV Pairs Section */}
      <div className="card">
        <button
          onClick={() => setSpPvExpanded(!spPvExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-medium">SP/PV Pairs</span>
            <span className="text-xs text-muted-foreground">
              ({selectedSpPvPairs.length}/{spPvPairs.length} selected)
            </span>
          </div>
          {spPvExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {spPvExpanded && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">
              Setpoint/Process Variable pairs for controlled variables
            </p>

            {/* Select/Deselect All */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={selectAllSpPvPairs}
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAllSpPvPairs}
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Deselect All
              </button>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {spPvPairs.map(pair => (
                <label key={pair.baseName} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedSpPvPairs.includes(pair.baseName)}
                    onChange={() => toggleSpPvPair(pair.baseName)}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{pair.baseName}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({pair.description})
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Output Variables Section */}
      <div className="card">
        <button
          onClick={() => setOutputExpanded(!outputExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="font-medium">Output Variables</span>
            <span className="text-xs text-muted-foreground">
              ({selectedOutputVariables.length}/{outputVariables.length} selected)
            </span>
          </div>
          {outputExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {outputExpanded && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">
              Additional process measurements and KPIs
            </p>

            {/* Select/Deselect All */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={selectAllOutputVariables}
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAllOutputVariables}
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Deselect All
              </button>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {outputVariables.map(variable => (
                <label key={variable.name} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedOutputVariables.includes(variable.name)}
                    onChange={() => toggleOutputVariable(variable.name)}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{variable.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({variable.description})
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ColumnSelector;
