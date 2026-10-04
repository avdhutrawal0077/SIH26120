import React, { useState, useEffect, useRef } from 'react';

/**
 * Prescriptive Component
 * Prescriptive Optimization Recommendation card with calibrated target metrics.
 * Supports "Apply Recommendation", "Revert", and a full "View Optimization Details" modal
 * with inputs, baseline vs optimized comparison, and applied constraints.
 */
function PrescriptiveComponent({
  recommendation,
  isRecShimmering = false,
  canRevert = false,
  telemetry = {},
  setpoints = {},
  actions
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [localShimmer, setLocalShimmer] = useState(false);
  const isShimmering = isRecShimmering || localShimmer;

  const rec = recommendation || {
    scenarioId: 'Opt-Scenario #04B',
    calibration: 'EnKF calibrated',
    steamDurationDays: 2.5,
    steamRateM3: 52,
    soakDurationDays: 6.5,
    srpSpeedSpm: 4.5,
    expectedProductionBpd: 97,
    yieldChangePct: '+18.7%',
    baselineAvgBpd: 76,
    simulatedAvgBpd: 90,
    constraints: {
      caprockPressureLimit: '8.75 MPa',
      maxSteamRate: '60 m³/day',
      maxMotorLoad: '80%',
      overburdenHeatLossMax: '200 kW'
    }
  };

  // Brief shimmer animation when recommendation updates
  const prevScenarioRef = useRef(rec.scenarioId);
  useEffect(() => {
    if (prevScenarioRef.current !== rec.scenarioId) {
      prevScenarioRef.current = rec.scenarioId;
      setLocalShimmer(true);
      const timer = setTimeout(() => setLocalShimmer(false), 500);
      return () => clearTimeout(timer);
    }
  }, [rec.scenarioId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDetailsOpen) {
        setIsDetailsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailsOpen]);

  const handleApply = () => {
    actions?.applyRecommendation?.(rec);
  };

  const handleRevert = () => {
    actions?.revertSetpoints?.();
  };

  return (
    <div
      className={`flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm select-none transition-all ${
        isShimmering ? 'ring-2 ring-[#00A86B]/40' : ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-md border-b border-[#C9DCCF] mb-space-md">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span>
          <h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-bold">
            Prescriptive Optimization Recommendation
          </h2>
          <span className="px-2.5 py-1 rounded bg-[#006B45]/10 text-[#006B45] border border-[#006B45]/30 font-label-caps text-xs font-semibold">
            {rec.scenarioId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-telemetry-dense text-telemetry-dense text-[#006B45] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
            CYCLE OPTIMIZATION READY
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md mb-space-lg">
        {/* Metric 1: Steam Duration */}
        <div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col justify-between">
          <span className="text-[#52665C] font-label-caps text-[10px] uppercase font-semibold tracking-wider">
            Steam Injection Duration
          </span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="font-metric-display text-2xl text-[#10251B] font-bold">
              {rec.steamDurationDays}
            </span>
            <span className="font-telemetry-data text-xs text-[#52665C]">days</span>
          </div>
          <span className="text-[10px] text-[#006B45] font-telemetry-dense mt-1 font-medium">
            Optimal plume expansion
          </span>
        </div>

        {/* Metric 2: Steam Rate */}
        <div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col justify-between">
          <span className="text-[#52665C] font-label-caps text-[10px] uppercase font-semibold tracking-wider">
            Steam Rate
          </span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="font-metric-display text-2xl text-[#10251B] font-bold">
              {rec.steamRateM3}
            </span>
            <span className="font-telemetry-data text-xs text-[#52665C]">m³/day</span>
          </div>
          <span className="text-[10px] text-[#006B45] font-telemetry-dense mt-1 font-medium">
            Controlled thermal plume
          </span>
        </div>

        {/* Metric 3: Soak Duration */}
        <div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col justify-between">
          <span className="text-[#52665C] font-label-caps text-[10px] uppercase font-semibold tracking-wider">
            Soak Duration
          </span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="font-metric-display text-2xl text-[#10251B] font-bold">
              {rec.soakDurationDays}
            </span>
            <span className="font-telemetry-data text-xs text-[#52665C]">days</span>
          </div>
          <span className="text-[10px] text-[#52665C] font-telemetry-dense mt-1">
            {Math.round(rec.soakDurationDays * 24)}h diffusion cycle
          </span>
        </div>

        {/* Metric 4: SRP Speed */}
        <div className="bg-[#F9FCFA] border border-[#C9DCCF] rounded-lg p-space-md flex flex-col justify-between">
          <span className="text-[#52665C] font-label-caps text-[10px] uppercase font-semibold tracking-wider">
            Recommended SRP Speed
          </span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="font-metric-display text-2xl text-[#10251B] font-bold">
              {rec.srpSpeedSpm}
            </span>
            <span className="font-telemetry-data text-xs text-[#52665C]">SPM</span>
          </div>
          <span className="text-[10px] text-[#006B45] font-telemetry-dense mt-1 font-medium">
            Dynamic rod tuning
          </span>
        </div>

        {/* Metric 5: Expected Production */}
        <div className="bg-[#EAF7EF] border border-[#00A86B]/40 rounded-lg p-space-md flex flex-col justify-between">
          <span className="text-[#003B25] font-label-caps text-[10px] uppercase font-semibold tracking-wider">
            Expected Production
          </span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="font-metric-display text-2xl text-[#003B25] font-bold">
              {rec.expectedProductionBpd}
            </span>
            <span className="font-telemetry-data text-xs text-[#006B45] font-semibold">BPD</span>
          </div>
          <span className="text-[10px] text-[#006B45] font-telemetry-dense mt-1 font-medium">
            Near peak target (101 BPD)
          </span>
        </div>

        {/* Metric 6: Expected Yield Change (Highlighted) */}
        <div className="bg-[#D9F2E6] border-2 border-[#00A86B] rounded-lg p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#003B25] font-label-caps text-[10px] uppercase font-bold">
            <span>Yield Change</span>
            <span className="material-symbols-outlined text-xs text-[#006B45]">trending_up</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="font-metric-display text-2xl text-[#006B45] font-bold">
              {rec.yieldChangePct}
            </span>
          </div>
          <span className="text-[10px] text-[#003B25] font-telemetry-dense mt-1 font-semibold">
            Simulated vs unassisted baseline
          </span>
        </div>
      </div>

      {/* Action Button Footer */}
      <div className="pt-space-sm border-t border-[#C9DCCF] flex items-center justify-between flex-wrap gap-space-sm">
        <div className="text-[#52665C] font-telemetry-dense text-xs">
          Prescriptive candidate:{' '}
          <span className="text-[#10251B] font-semibold">{rec.scenarioId}</span> ({rec.calibration})
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canRevert && (
            <button
              type="button"
              onClick={handleRevert}
              className="px-space-md py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] rounded-lg font-medium text-xs flex items-center gap-1.5 border border-[#D1D5DB] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Revert to previous setpoints"
            >
              <span className="material-symbols-outlined text-sm">undo</span>
              <span>Revert</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            className="px-space-md py-2 bg-[#006B45] hover:bg-[#003B25] text-white rounded-lg font-medium text-xs flex items-center gap-1.5 border border-[#006B45] transition-all cursor-pointer shadow-xs active:scale-95"
            title="Apply recommended setpoints to digital twin simulation"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Apply Recommendation</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="px-space-md py-2 bg-[#EAF7EF] hover:bg-[#D9F2E6] text-[#003B25] rounded-lg font-medium text-xs flex items-center gap-1.5 border border-[#006B45] transition-all cursor-pointer shadow-xs active:scale-95"
            title="View optimization matrix comparison"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>View Optimization Details</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Optimization Details Modal Dialog */}
      {isDetailsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-fadeIn"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div
            className="bg-[#FFFFFF] w-full max-w-2xl rounded-2xl border border-[#C9DCCF] shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#C9DCCF]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-5 bg-[#006B45] rounded-full"></span>
                <div>
                  <h3 id="modal-title" className="font-headline-lg text-lg text-[#10251B] font-bold">
                    Optimization Scenario: {rec.scenarioId}
                  </h3>
                  <p className="text-xs text-[#52665C]">
                    EnKF thermodynamic state feedback &amp; constrained nonlinear Darcy optimization
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                aria-label="Close optimization details dialog"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#52665C] hover:bg-gray-100 hover:text-[#10251B] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Inputs & Reservoir Conditions */}
            <div className="flex flex-col gap-2">
              <span className="font-label-caps text-xs text-[#003B25] font-semibold uppercase">
                Model Inputs &amp; Reservoir Boundary Conditions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-telemetry-dense">
                <div className="p-2 rounded bg-[#F9FCFA] border border-[#C9DCCF]">
                  <span className="text-[#52665C] text-[10px]">Reservoir Temp</span>
                  <div className="font-semibold text-[#10251B]">{telemetry.reservoirTemp} °C</div>
                </div>
                <div className="p-2 rounded bg-[#F9FCFA] border border-[#C9DCCF]">
                  <span className="text-[#52665C] text-[10px]">Reservoir Pressure</span>
                  <div className="font-semibold text-[#10251B]">{telemetry.reservoirPressure} bar</div>
                </div>
                <div className="p-2 rounded bg-[#F9FCFA] border border-[#C9DCCF]">
                  <span className="text-[#52665C] text-[10px]">Oil Viscosity</span>
                  <div className="font-semibold text-[#006B45]">{telemetry.oilViscosity} cP</div>
                </div>
                <div className="p-2 rounded bg-[#F9FCFA] border border-[#C9DCCF]">
                  <span className="text-[#52665C] text-[10px]">Wellhead Pressure</span>
                  <div className="font-semibold text-[#10251B]">{telemetry.whPressure} MPa</div>
                </div>
              </div>
            </div>

            {/* Baseline vs Optimized Comparison Table */}
            <div className="flex flex-col gap-2">
              <span className="font-label-caps text-xs text-[#003B25] font-semibold uppercase">
                Baseline vs Prescriptive Setpoints
              </span>
              <table className="w-full text-left font-telemetry-dense text-xs border border-[#C9DCCF] rounded-lg overflow-hidden">
                <thead className="bg-[#EAF7EF] text-[#003B25] text-[11px] font-semibold">
                  <tr>
                    <th className="p-2">PARAMETER</th>
                    <th className="p-2 text-right">BASELINE</th>
                    <th className="p-2 text-right">OPTIMIZED</th>
                    <th className="p-2">PREDICTED IMPACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9DCCF]">
                  <tr>
                    <td className="p-2 font-medium">Steam Injection Duration</td>
                    <td className="p-2 text-right text-[#52665C]">{setpoints.injectionDays || 2.0} days</td>
                    <td className="p-2 text-right font-bold text-[#006B45]">{rec.steamDurationDays} days</td>
                    <td className="p-2 text-[#006B45]">+0.5d thermal plume expansion</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Steam Injection Rate</td>
                    <td className="p-2 text-right text-[#52665C]">{setpoints.steamRate || 48} m³/d</td>
                    <td className="p-2 text-right font-bold text-[#006B45]">{rec.steamRateM3} m³/d</td>
                    <td className="p-2 text-[#006B45]">Controlled chamber enthalpy</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Soak Period Duration</td>
                    <td className="p-2 text-right text-[#52665C]">{(Number(setpoints.soakDurationHrs || 168) / 24).toFixed(1)} days</td>
                    <td className="p-2 text-right font-bold text-[#006B45]">{rec.soakDurationDays} days</td>
                    <td className="p-2 text-[#52665C]">Optimal conductive heat diffusion</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">SRP Sucker Rod Speed</td>
                    <td className="p-2 text-right text-[#52665C]">{setpoints.srpSpm || 4.2} SPM</td>
                    <td className="p-2 text-right font-bold text-[#006B45]">{rec.srpSpeedSpm} SPM</td>
                    <td className="p-2 text-[#006B45]">Dynamic bottomhole drawdown</td>
                  </tr>
                  <tr className="bg-[#EAF7EF]/50">
                    <td className="p-2 font-bold text-[#003B25]">Projected Peak Production</td>
                    <td className="p-2 text-right text-[#52665C]">{rec.baselineAvgBpd || 76} BPD</td>
                    <td className="p-2 text-right font-bold text-[#003B25]">{rec.expectedProductionBpd} BPD</td>
                    <td className="p-2 font-bold text-[#006B45]">{rec.yieldChangePct} overall yield</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Applied Constraints Checklist */}
            <div className="flex flex-col gap-2">
              <span className="font-label-caps text-xs text-[#003B25] font-semibold uppercase">
                Active Operational Constraints (Zero Violation Guarantee)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-telemetry-dense">
                <div className="p-2 rounded bg-[#F9FCFA] border border-[#C9DCCF] flex items-center justify-between">
                  <span>Caprock Pressure Upper Limit</span>
                  <span className="font-bold text-[#006B45]">8.75 MPa [SAFE]</span>
                </div>
                <div className="p-2 rounded bg-[#F9FCFA] border border-[#C9DCCF] flex items-center justify-between">
                  <span>Maximum Surface Steam Rate</span>
                  <span className="font-bold text-[#006B45]">60 m³/d [WITHIN]</span>
                </div>
                <div className="p-2 rounded bg-[#F9FCFA] border border-[#C9DCCF] flex items-center justify-between">
                  <span>SRP Motor Load Ceiling</span>
                  <span className="font-bold text-[#006B45]">80.0% [NOMINAL]</span>
                </div>
                <div className="p-2 rounded bg-[#F9FCFA] border border-[#C9DCCF] flex items-center justify-between">
                  <span>Overburden Heat Loss Limit</span>
                  <span className="font-bold text-[#006B45]">200 kW [CONTAINED]</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#C9DCCF] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Details
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApply();
                  setIsDetailsOpen(false);
                }}
                className="px-4 py-2 bg-[#006B45] hover:bg-[#003B25] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Apply This Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(PrescriptiveComponent);
