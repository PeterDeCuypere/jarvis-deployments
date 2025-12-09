import { useMemo, useEffect, useRef, useState } from 'react';
import useAppStore from '../store/appStore';

/**
 * High Performance HMI Value Ticker
 * Displays scrolling variable values grouped by SP/PV pairs
 * Uses neutral colors - no flashy/attention-grabbing colors for normal data
 */
function ValueTicker() {
  const tickerRef = useRef(null);
  const contentRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const {
    rawData,
    selectedPairs: allSelectedPairs,
    selectedOutputVars: allSelectedOutputVars,
    selectedTimestampCol
  } = useAppStore();

  const selectedPairs = useMemo(() =>
    allSelectedPairs.filter(p => p.selected),
    [allSelectedPairs]
  );

  const selectedOutputVars = useMemo(() =>
    allSelectedOutputVars.filter(v => v.selected).map(v => v.name),
    [allSelectedOutputVars]
  );

  // Get latest values from data
  const latestValues = useMemo(() => {
    if (rawData.length === 0) return null;

    const lastRow = rawData[rawData.length - 1];
    const values = {
      pairs: [],
      outputs: [],
      timestamp: selectedTimestampCol ? lastRow[selectedTimestampCol] : null
    };

    // Group SP/PV pairs together
    selectedPairs.forEach(pair => {
      const spVal = parseFloat(lastRow[pair.spColumn]);
      const pvVal = parseFloat(lastRow[pair.pvColumn]);
      values.pairs.push({
        baseName: pair.baseName,
        sp: isNaN(spVal) ? '--' : spVal.toFixed(2),
        pv: isNaN(pvVal) ? '--' : pvVal.toFixed(2)
      });
    });

    // Output variables
    selectedOutputVars.forEach(varName => {
      const val = parseFloat(lastRow[varName]);
      values.outputs.push({
        name: varName,
        value: isNaN(val) ? '--' : val.toFixed(2)
      });
    });

    return values;
  }, [rawData, selectedPairs, selectedOutputVars, selectedTimestampCol]);

  // Animation for scrolling
  useEffect(() => {
    if (!contentRef.current || !tickerRef.current || isPaused) return;

    const content = contentRef.current;
    const ticker = tickerRef.current;

    // Only animate if content is wider than container
    if (content.scrollWidth <= ticker.clientWidth) return;

    let position = 0;
    const speed = 0.5; // pixels per frame

    const animate = () => {
      position -= speed;
      if (position <= -content.scrollWidth / 2) {
        position = 0;
      }
      content.style.transform = `translateX(${position}px)`;
      if (!isPaused) {
        requestAnimationFrame(animate);
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, latestValues]);

  if (!latestValues || (latestValues.pairs.length === 0 && latestValues.outputs.length === 0)) {
    return null;
  }

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    if (typeof ts === 'string' && ts.includes('T')) {
      return new Date(ts).toLocaleTimeString();
    }
    return String(ts);
  };

  // Render content twice for seamless loop
  const renderContent = () => (
    <>
      {/* Timestamp */}
      {latestValues.timestamp && (
        <span className="ticker-item ticker-timestamp">
          {formatTimestamp(latestValues.timestamp)}
        </span>
      )}

      {/* SP/PV Pairs - grouped together */}
      {latestValues.pairs.map((pair, idx) => (
        <span key={`pair-${idx}`} className="ticker-item ticker-pair">
          <span className="ticker-label">{pair.baseName}</span>
          <span className="ticker-sp">SP: {pair.sp}</span>
          <span className="ticker-pv">PV: {pair.pv}</span>
        </span>
      ))}

      {/* Separator between pairs and outputs */}
      {latestValues.pairs.length > 0 && latestValues.outputs.length > 0 && (
        <span className="ticker-separator">|</span>
      )}

      {/* Output variables */}
      {latestValues.outputs.map((output, idx) => (
        <span key={`output-${idx}`} className="ticker-item ticker-output">
          <span className="ticker-label">{output.name}:</span>
          <span className="ticker-value">{output.value}</span>
        </span>
      ))}
    </>
  );

  return (
    <div
      ref={tickerRef}
      className="value-ticker"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div ref={contentRef} className="ticker-content">
        {renderContent()}
        {/* Duplicate for seamless loop */}
        {renderContent()}
      </div>
    </div>
  );
}

export default ValueTicker;
