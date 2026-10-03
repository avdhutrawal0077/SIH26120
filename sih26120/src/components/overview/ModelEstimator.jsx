import React, { useState } from 'react';

/**
 * ModelEstimator Component
 * EnKF history-matching parameter calibration matrix & autocal control.
 * Displays 6 calibrated parameters and variance bounds with live EnKF micro-drift.
 * Features a 1.5s animated "RE-ESTIMATE MATRIX" state and 30s countdown autocal toggle.
 */
function ModelEstimatorComponent({
  model = {},
  autocalCountdown = 30,
  actions
}) {
  const [isEstimating, setIsEstimating] = useState(false);
  const autocalOn = model?.autocalOn ?? true;

  const variances = model?.variances || {
    steamQuality: '±0.015',
    viscosity: 'Nominal',
    permeability: '+40 mD',
    overburdenLoss: '-2.1%',
    skin: 'Clean',
    caprock: 'SAFE'
  };

  const handleReestimateClick = () => {
    if (isEstimating) return;
    setIsEstimating(true);

    setTimeout(() => {
      actions?.reestimateModel?.();
      setIsEstimating(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] overflow-hidden shadow-sm select-none">
      {/* Header */}
      <div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[#00A86B] text-base">settings_suggest</span>
          <span className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs">
            MODEL ESTIMATOR STATE
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps border transition-all flex items-center gap-1.5 ${
            isEstimating
              ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
              : 'bg-[#EAF7EF] text-[#006B45] border-[#C9DCCF]'
          }`}
        >
          {isEstimating ? (
            <span className="material-symbols-outlined text-xs animate-spin">sync</span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
          )}
          <span>{isEstimating ? 'ESTIMATING ENKF...' : 'EnKF RUNNING'}</span>
        </span>
      </div>

      <div className="p-space-lg flex flex-col gap-space-md">
        {/* Parameter Matrix Table */}
        <table className="w-full text-left font-telemetry-dense text-telemetry-dense border-collapse">
          <thead>
            <tr className="text-[#52665C] border-b border-[#C9DCCF]/60 text-[10px]">
              <th className="pb-1.5 font-medium">PARAMETER</th>
              <th className="pb-1.5 text-right font-medium">CALIBRATED</th>
              <th className="pb-1.5 text-right font-medium">VARIANCE</th>
            </tr>
          </thead>
          <tbody className="text-[#10251B] divide-y divide-[#C9DCCF]/40">
            <tr className="hover:bg-[#F9FCFA] transition-colors">
              <td className="py-2 text-[#52665C]">Steam Quality (X)</td>
              <td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">
                {model?.steamQuality ?? 0.82}
              </td>
              <td className="py-2 text-right text-[#006B45] font-metric-value">
                {variances.steamQuality}
              </td>
            </tr>
            <tr className="hover:bg-[#F9FCFA] transition-colors bg-[#F9FCFA]/50">
              <td className="py-2 text-[#52665C]">Bitumen Viscosity (@248°C)</td>
              <td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">
                {model?.bitumenViscosity ?? 12.4} mPa·s
              </td>
              <td className="py-2 text-right text-[#52665C] font-metric-value">
                {variances.viscosity}
              </td>
            </tr>
            <tr className="hover:bg-[#F9FCFA] transition-colors">
              <td className="py-2 text-[#52665C]">Reservoir Permeability (Kh)</td>
              <td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">
                {Number(model?.permeability ?? 1480).toLocaleString()} mD
              </td>
              <td className="py-2 text-right text-[#006B45] font-metric-value">
                {variances.permeability}
              </td>
            </tr>
            <tr className="hover:bg-[#F9FCFA] transition-colors bg-[#F9FCFA]/50">
              <td className="py-2 text-[#52665C]">Overburden Heat Loss Rate</td>
              <td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">
                {model?.overburdenLoss ?? 184} kW
              </td>
              <td className="py-2 text-right text-[#006B45] font-metric-value">
                {variances.overburdenLoss}
              </td>
            </tr>
            <tr className="hover:bg-[#F9FCFA] transition-colors">
              <td className="py-2 text-[#52665C]">Skin Factor (S)</td>
              <td className="py-2 text-right font-semibold font-metric-value text-[#10251B]">
                {model?.skin != null ? (model.skin > 0 ? `+${model.skin}` : model.skin) : '+0.42'}
              </td>
              <td className="py-2 text-right text-[#006B45] font-metric-value">
                {variances.skin}
              </td>
            </tr>
            <tr className="hover:bg-[#F9FCFA] transition-colors bg-[#F9FCFA]/50">
              <td className="py-2 text-[#52665C]">Caprock Integrity Index</td>
              <td className="py-2 text-right font-semibold text-[#003B25] font-metric-value">
                {model?.caprockIntegrity ?? 0.982} / 1.0
              </td>
              <td className="py-2 text-right text-[#006B45] font-metric-value">
                {variances.caprock}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Actuator Interlock Action & Autocal Toggle */}
        <div className="pt-space-sm border-t border-[#C9DCCF]/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReestimateClick}
            disabled={isEstimating}
            aria-label="Re-estimate model parameter covariance matrix via EnKF"
            className={`px-space-md py-1.5 bg-[#006B45] hover:bg-[#003B25] text-white rounded-lg font-label-caps text-label-caps border border-[#006B45] transition-all flex items-center gap-1.5 shadow-sm ${
              isEstimating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'
            }`}
          >
            <span className={`material-symbols-outlined text-sm ${isEstimating ? 'animate-spin' : ''}`}>
              {isEstimating ? 'sync' : 'tune'}
            </span>
            <span>{isEstimating ? 'RE-ESTIMATING...' : 'RE-ESTIMATE MATRIX'}</span>
          </button>

          <button
            type="button"
            onClick={() => actions?.toggleAutocal?.()}
            aria-pressed={autocalOn}
            className="text-[#52665C] hover:text-[#10251B] font-telemetry-dense text-[10px] cursor-pointer flex items-center gap-1 select-none"
            title="Toggle Automatic Calibration (30s cycle)"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autocalOn ? 'bg-[#00A86B] animate-pulse' : 'bg-[#94A3B8]'
              }`}
            ></span>
            <span>
              Autocal: {autocalOn ? `ON (${autocalCountdown}s)` : 'OFF'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ModelEstimatorComponent);
