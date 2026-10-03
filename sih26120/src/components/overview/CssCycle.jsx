import React from 'react';

/**
 * CssCycle Component
 * Current CSS Cycle progression: Injection -> Soak -> Production stages.
 * Stepper dynamically derived from cycle.phase (completed = check, active = pulse, future = greyed).
 * Stage durations and injection rate come from state and setpoints.
 * Includes an "Advance phase" button visible in simulation mode.
 */
function CssCycleComponent({
  cycle = {},
  setpoints = {},
  mode = 'LIVE',
  onAdvancePhase
}) {
  const cycleNum = cycle.number || 2;
  const totalCycles = cycle.totalCycles || 5;
  const phase = cycle.phase || 'PRODUCTION';
  const dayInPhase = cycle.dayInPhase || 18;
  const phaseDays = cycle.phaseDays || 45;
  const steamRate = setpoints?.steamRate || 52;
  const injectionDays = setpoints?.injectionDays || 2.5;
  const soakHours = setpoints?.soakDurationHrs || 168;
  const soakDays = (soakHours / 24).toFixed(1);

  const phaseSequence = ['INJECTION', 'SOAK', 'PRODUCTION'];
  const currentPhaseIndex = phaseSequence.indexOf(phase);

  // Time elapsed in active phase: hours or days
  const hoursInPhase = Math.max(1, Math.round(dayInPhase * 24));
  const startedText = hoursInPhase < 48 ? `Started ${hoursInPhase}h ago` : `Day ${dayInPhase} of ${phaseDays}`;

  return (
    <div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl p-6 shadow-sm select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md border-b border-[#C9DCCF] mb-space-md">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span>
          <h2 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">
            Current CSS Cycle
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps border border-[#C9DCCF]">
            CYCLE {cycleNum} / {totalCycles}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded bg-[#D9F2E6] border border-[#C9DCCF] text-[#006B45] font-telemetry-dense text-telemetry-dense">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>
            <span className="font-semibold uppercase">{phase} ACTIVE</span>
          </div>

          {/* Advance phase button: visible only in simulation mode */}
          {mode !== 'PLAYBACK' && onAdvancePhase && (
            <button
              type="button"
              onClick={onAdvancePhase}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#006B45] hover:bg-[#005234] text-white text-[11px] font-semibold rounded-md shadow-xs transition-all cursor-pointer active:scale-95 font-label-caps"
              title="Advance to next phase in simulation"
            >
              <span className="material-symbols-outlined text-xs">fast_forward</span>
              <span>Advance Phase</span>
            </button>
          )}
        </div>
      </div>

      {/* Cycle Stage Nodes (Derived dynamically from cycle.phase) */}
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#C9DCCF] -z-0"></div>

          {phaseSequence.map((stageKey, idx) => {
            const isCompleted = idx < currentPhaseIndex;
            const isActive = idx === currentPhaseIndex;

            const stageNumber = idx + 1;
            const stageName = stageKey;

            return (
              <div key={stageKey} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#00A86B] border-2 border-[#006B45] text-white shadow ring-4 ring-[#00A86B]/20 animate-pulse'
                      : isCompleted
                      ? 'bg-[#D9F2E6] border-[#C9DCCF] text-[#006B45]'
                      : 'bg-[#FFFFFF] border-[#C9DCCF] text-[#8FA99B]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    {isCompleted ? 'check' : isActive ? 'play_arrow' : 'schedule'}
                  </span>
                </div>
                <span
                  className={`font-label-caps text-[10px] uppercase mt-1.5 ${
                    isActive
                      ? 'text-[#003B25] font-bold'
                      : isCompleted
                      ? 'text-[#10251B]'
                      : 'text-[#8FA99B]'
                  }`}
                >
                  {stageNumber}. {stageName}
                </span>
                <span
                  className={`font-telemetry-dense text-[9px] flex items-center gap-0.5 ${
                    isActive
                      ? 'text-[#006B45] font-semibold'
                      : isCompleted
                      ? 'text-[#52665C]'
                      : 'text-[#8FA99B]'
                  }`}
                >
                  {isActive && <span className="w-1 h-1 rounded-full bg-[#00A86B] animate-pulse"></span>}
                  {isCompleted ? 'Completed' : isActive ? 'Active' : 'Upcoming'}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3 Detail Stage Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-space-xs">
          {/* Stage 1: Injection */}
          <div
            className={`rounded-lg p-space-sm flex flex-col justify-between transition-all ${
              phase === 'INJECTION'
                ? 'bg-[#EAF7EF] border-2 border-[#00A86B] shadow-xs'
                : 'bg-[#F9FCFA] border border-[#C9DCCF]'
            }`}
          >
            <div className="flex items-center justify-between text-[#52665C] text-[10px] font-label-caps uppercase">
              <span className={phase === 'INJECTION' ? 'text-[#003B25] font-bold' : ''}>
                INJECTION
              </span>
              <span className={phase === 'INJECTION' ? 'text-[#006B45] font-semibold flex items-center gap-1' : ''}>
                {phase === 'INJECTION' && <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>}
                {phase === 'INJECTION' ? 'LIVE' : 'STAGE 1'}
              </span>
            </div>
            <div className="mt-1 font-telemetry-dense">
              <div className={`font-semibold text-xs ${phase === 'INJECTION' ? 'text-[#003B25] font-bold' : 'text-[#10251B]'}`}>
                {phase === 'INJECTION' ? startedText : `${steamRate} m³/day`}
              </div>
              <div className="text-[#52665C] text-[10px] mt-0.5">
                Duration: {injectionDays} days ({steamRate} m³/d)
              </div>
            </div>
          </div>

          {/* Stage 2: Soak */}
          <div
            className={`rounded-lg p-space-sm flex flex-col justify-between transition-all ${
              phase === 'SOAK'
                ? 'bg-[#EAF7EF] border-2 border-[#00A86B] shadow-xs'
                : 'bg-[#F9FCFA] border border-[#C9DCCF]'
            }`}
          >
            <div className="flex items-center justify-between text-[#52665C] text-[10px] font-label-caps uppercase">
              <span className={phase === 'SOAK' ? 'text-[#003B25] font-bold' : ''}>
                SOAK
              </span>
              <span className={phase === 'SOAK' ? 'text-[#006B45] font-semibold flex items-center gap-1' : ''}>
                {phase === 'SOAK' && <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>}
                {phase === 'SOAK' ? 'LIVE' : 'STAGE 2'}
              </span>
            </div>
            <div className="mt-1 font-telemetry-dense">
              <div className={`font-semibold text-xs ${phase === 'SOAK' ? 'text-[#003B25] font-bold' : 'text-[#10251B]'}`}>
                {phase === 'SOAK' ? startedText : `${soakDays} days`}
              </div>
              <div className="text-[#52665C] text-[10px] mt-0.5">
                {phase === 'SOAK' ? `Soak target: ${soakDays} days` : 'Thermal Diffusion Peak'}
              </div>
            </div>
          </div>

          {/* Stage 3: Production */}
          <div
            className={`rounded-lg p-space-sm flex flex-col justify-between transition-all ${
              phase === 'PRODUCTION'
                ? 'bg-[#EAF7EF] border-2 border-[#00A86B] shadow-xs'
                : 'bg-[#F9FCFA] border border-[#C9DCCF]'
            }`}
          >
            <div className="flex items-center justify-between text-[#003B25] text-[10px] font-label-caps uppercase font-semibold">
              <span className={phase === 'PRODUCTION' ? 'text-[#003B25] font-bold' : 'text-[#52665C]'}>
                PRODUCTION
              </span>
              <span className="flex items-center gap-1 text-[#006B45]">
                {phase === 'PRODUCTION' && <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></span>}
                {phase === 'PRODUCTION' ? 'LIVE' : 'STAGE 3'}
              </span>
            </div>
            <div className="mt-1 font-telemetry-dense">
              <div className="text-[#003B25] font-bold text-xs">
                {phase === 'PRODUCTION' ? startedText : `Target: ${phaseDays} days`}
              </div>
              <div className="text-[#52665C] text-[10px] mt-0.5">
                Target: Day {dayInPhase} of {phaseDays}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CssCycleComponent);
