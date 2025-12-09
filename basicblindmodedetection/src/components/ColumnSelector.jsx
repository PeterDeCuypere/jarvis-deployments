import { useState, useMemo } from 'react';
import { Check, AlertTriangle, Info, ChevronDown, ChevronUp, Link2, Unlink } from 'lucide-react';
import useAppStore from '../store/appStore';

function ColumnSelector() {
  const [showUnmatched, setShowUnmatched] = useState(false);

  const {
    detectedPairs,
    ambiguousSp,
    unmatched,
    datetimeColumns,
    selectedTimestampCol,
    selectedPairs,
    selectedOutputVars,
    setSelectedTimestampCol,
    togglePairSelection,
    toggleOutputVarSelection
  } = useAppStore();

  const hasData = detectedPairs.length > 0 || unmatched.length > 0;

  const selectedPairCount = selectedPairs.filter(p => p.selected).length;
  const selectedOutputCount = selectedOutputVars.filter(v => v.selected).length;

  const pairsByCategory = useMemo(() => {
    const categories = {
      confident: [],
      ambiguous: []
    };

    selectedPairs.forEach(pair => {
      if (ambiguousSp[pair.baseName]) {
        categories.ambiguous.push(pair);
      } else {
        categories.confident.push(pair);
      }
    });

    return categories;
  }, [selectedPairs, ambiguousSp]);

  if (!hasData) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <Info className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">
          Upload a data file to detect SP/PV pairs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timestamp Column Selection */}
      {datetimeColumns.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Timestamp Column
          </h3>
          <select
            value={selectedTimestampCol || ''}
            onChange={(e) => setSelectedTimestampCol(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {datetimeColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      )}

      {/* Detected SP/PV Pairs */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            SP/PV Pairs
            <span className="text-sm font-normal text-muted-foreground">
              ({selectedPairCount} of {selectedPairs.length} selected)
            </span>
          </h3>
        </div>

        {/* Confident Pairs */}
        {pairsByCategory.confident.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
              Detected Pairs
            </p>
            <div className="space-y-2">
              {pairsByCategory.confident.map(pair => (
                <label
                  key={pair.baseName}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${pair.selected
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-secondary/50 border-border hover:border-muted-foreground'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={pair.selected}
                    onChange={() => togglePairSelection(pair.baseName)}
                    className="hidden"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                    ${pair.selected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                  >
                    {pair.selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pair.baseName}</p>
                    <p className="text-xs text-muted-foreground">
                      SP: {pair.spColumn} → PV: {pair.pvColumn}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Ambiguous Pairs */}
        {pairsByCategory.ambiguous.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
              Ambiguous SP Columns
            </p>
            <div className="space-y-2">
              {pairsByCategory.ambiguous.map(pair => (
                <div key={pair.baseName} className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pair.selected}
                      onChange={() => togglePairSelection(pair.baseName)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                      ${pair.selected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                    >
                      {pair.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pair.baseName}</p>
                      <p className="text-xs text-muted-foreground">
                        SP: {pair.spColumn} → PV: {pair.pvColumn}
                      </p>
                    </div>
                  </label>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 ml-8">
                    Multiple SP candidates: {ambiguousSp[pair.baseName]?.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPairs.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No SP/PV pairs detected. Check your column naming convention.
          </p>
        )}
      </div>

      {/* Output Variables */}
      {selectedOutputVars.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Unlink className="w-4 h-4 text-orange-500" />
              Output Variables
              <span className="text-sm font-normal text-muted-foreground">
                ({selectedOutputCount} of {selectedOutputVars.length} selected)
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {selectedOutputVars.map(variable => (
              <label
                key={variable.name}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm
                  ${variable.selected
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-secondary/50 border-border hover:border-muted-foreground'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={variable.selected}
                  onChange={() => toggleOutputVarSelection(variable.name)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                  ${variable.selected ? 'bg-orange-500 border-orange-500' : 'border-muted-foreground'}`}
                >
                  {variable.selected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="truncate" title={variable.name}>{variable.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Unmatched Columns */}
      {unmatched.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowUnmatched(!showUnmatched)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm text-muted-foreground">
              {unmatched.length} unmatched columns
            </span>
            {showUnmatched ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showUnmatched && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {unmatched.map(col => (
                  <span
                    key={col}
                    className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ColumnSelector;
