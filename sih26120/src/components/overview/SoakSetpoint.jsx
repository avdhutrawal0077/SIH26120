import React, { useState, useRef } from 'react';

/**
 * SoakSetpoint Component
 * Setpoint stepper & input widget for adjusting Target Soak Duration (96 - 240 hrs).
 * Debounces updates by ~400ms, logs setpoint change, displays toast notification,
 * and recalculates production switch UTC timestamp.
 */
function SoakSetpointComponent({ setpoints, cycle = {}, actions }) {
  const soakDurationHrs = Number(setpoints?.soakDurationHrs) || 168.0;
  const [prevSoakDurationHrs, setPrevSoakDurationHrs] = useState(soakDurationHrs);
  const [localVal, setLocalVal] = useState(soakDurationHrs.toFixed(1));
  const pendingValRef = useRef(soakDurationHrs);
  const debounceTimerRef = useRef(null);

  // Sync local input with external state when setpoints change from outside
  if (soakDurationHrs !== prevSoakDurationHrs) {
    setPrevSoakDurationHrs(soakDurationHrs);
    setLocalVal(soakDurationHrs.toFixed(1));
    pendingValRef.current = soakDurationHrs;
  }

  const commitSetpoint = (val) => {
    const clamped = Math.max(96.0, Math.min(240.0, Math.round(val * 10) / 10));
    pendingValRef.current = clamped;
    setLocalVal(clamped.toFixed(1));

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      actions.setSetpoints({ soakDurationHrs: clamped });
      actions.setToast('Setpoint sent (simulation)');
    }, 400);
  };

  const handleDecrease = () => {
    const currentBase = pendingValRef.current != null ? pendingValRef.current : soakDurationHrs;
    const nextVal = Math.max(96.0, currentBase - 12.0);
    commitSetpoint(nextVal);
  };

  const handleIncrease = () => {
    const currentBase = pendingValRef.current != null ? pendingValRef.current : soakDurationHrs;
    const nextVal = Math.min(240.0, currentBase + 12.0);
    commitSetpoint(nextVal);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalVal(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      pendingValRef.current = Math.max(96.0, Math.min(240.0, parsed));
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localVal);
    if (isNaN(parsed)) {
      setLocalVal(soakDurationHrs.toFixed(1));
      pendingValRef.current = soakDurationHrs;
    } else {
      commitSetpoint(parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  // Recompute Day X of Y and Switch to Prod from active/pending hours
  const activeHours = pendingValRef.current != null ? pendingValRef.current : soakDurationHrs;
  const totalSoakDays = Math.max(4, Math.round(activeHours / 24));
  const currentDay = cycle?.phase === 'SOAK' ? Math.min(totalSoakDays, cycle?.dayInPhase || 1) : 4;

  // Base date of current cycle soak: 2025-05-14 14:00 UTC
  const baseSoakStart = new Date('2025-05-14T14:00:00Z');
  const switchTime = new Date(baseSoakStart.getTime() + activeHours * 3600 * 1000);
  const switchTimeStr = switchTime.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

  const isMin = activeHours <= 96.0;
  const isMax = activeHours >= 240.0;

  return (
    <div className="p-space-lg bg-[#EAF7EF] rounded-xl border border-[#C9DCCF] flex flex-col gap-space-sm shadow-sm select-none">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps text-[#52665C] uppercase tracking-wide">
          SOAK PERIOD SETPOINT
        </span>
        <span className="text-[#006B45] font-telemetry-dense font-medium text-xs">
          DAY {currentDay} OF {totalSoakDays}
        </span>
      </div>

      <div className="flex items-center justify-between gap-space-md mt-1">
        <div className="flex-1 bg-[#FFFFFF] px-space-md py-1.5 rounded-lg border border-[#C9DCCF] flex items-center justify-between shadow-xs">
          <span className="font-telemetry-dense text-[#10251B] font-medium text-xs">
            Target Soak Duration
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="96"
              max="240"
              step="1"
              value={localVal}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              aria-label="Target Soak Duration in hours"
              className="w-16 text-right font-metric-value text-metric-value font-bold text-[#003B25] bg-transparent border-b border-transparent hover:border-[#C9DCCF] focus:border-[#006B45] focus:outline-none transition-colors"
            />
            <span className="text-[#52665C] font-telemetry-dense text-xs">hrs</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={isMin}
            aria-label="Decrease soak duration by 12 hours"
            className={`w-8 h-8 flex items-center justify-center bg-[#FFFFFF] rounded-lg border border-[#C9DCCF] text-[#10251B] text-base font-bold transition-all shadow-xs ${
              isMin ? 'opacity-40 cursor-not-allowed bg-gray-100' : 'hover:border-[#00A86B] hover:text-[#006B45] cursor-pointer active:scale-95'
            }`}
            title={isMin ? 'Minimum duration reached (96 hrs)' : 'Decrease target by 12 hrs'}
          >
            -
          </button>
          <button
            type="button"
            onClick={handleIncrease}
            disabled={isMax}
            aria-label="Increase soak duration by 12 hours"
            className={`w-8 h-8 flex items-center justify-center bg-[#FFFFFF] rounded-lg border border-[#C9DCCF] text-[#10251B] text-base font-bold transition-all shadow-xs ${
              isMax ? 'opacity-40 cursor-not-allowed bg-gray-100' : 'hover:border-[#00A86B] hover:text-[#006B45] cursor-pointer active:scale-95'
            }`}
            title={isMax ? 'Maximum duration reached (240 hrs)' : 'Increase target by 12 hrs'}
          >
            +
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[#52665C] text-[10px] font-telemetry-dense mt-1">
        <span>Min: 96 hrs</span>
        <span className="text-[#003B25] font-medium font-metric-value">
          Switch to Prod: {switchTimeStr}
        </span>
        <span>Max: 240 hrs</span>
      </div>
    </div>
  );
}

export default React.memo(SoakSetpointComponent);
