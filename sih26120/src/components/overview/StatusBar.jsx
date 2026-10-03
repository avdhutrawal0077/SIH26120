import React from 'react';

/**
 * StatusBar Component
 * Shows live ticking clock (or scrubbed time in playback), well ID chips,
 * prototype demonstration badge, and offline fallback chip when backend is unavailable.
 */
function StatusBarComponent({ wellId, simTime, mode, backendStatus = 'connected' }) {
  const isOffline = backendStatus === 'offline';

  return (
    <div className="w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#C9DCCF] px-space-lg py-2 flex items-center justify-between select-none">
      <div className="flex items-center gap-space-lg">
        <div className="flex items-center gap-space-xs font-telemetry-data text-telemetry-data">
          <span className="text-[#52665C]">OIL TWIN</span>
          <span className="text-[#C9DCCF]">&gt;</span>
          <span className="text-[#10251B] font-semibold">Overview</span>
        </div>
        <div className="h-4 w-px bg-[#C9DCCF]"></div>
        <div className="flex items-center gap-2">
          <span className="px-space-md py-1 bg-[#EAF7EF] border border-[#C9DCCF] rounded-full font-label-caps text-label-caps text-[#003B25] tracking-wider">
            Field: Baghewala Field
          </span>
          <span className="px-space-md py-1 bg-[#EAF7EF] border border-[#C9DCCF] rounded-full font-label-caps text-label-caps text-[#003B25] tracking-wider">
            Well: {wellId}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-space-md">
        {/* Backend Offline Indicator Chip */}
        {isOffline && (
          <div className="flex items-center gap-1.5 px-space-md py-1 bg-[#FFF1F2] border border-[#FECDD3] rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse"></span>
            <span className="font-telemetry-dense text-telemetry-dense text-[#9F1239] font-medium">
              BACKEND OFFLINE, USING SIMULATION
            </span>
          </div>
        )}

        {/* Prototype Demonstration / Replay Badge */}
        <div className="flex items-center gap-1.5 px-space-md py-1 bg-[#EAF7EF] border border-[#C9DCCF] rounded-lg">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              mode === 'LIVE' ? 'bg-[#00A86B] animate-pulse' : 'bg-[#52665C]'
            }`}
          ></span>
          <span className="font-telemetry-dense text-telemetry-dense text-[#003B25]">
            {mode === 'LIVE'
              ? 'Prototype Simulation — Demonstration Data'
              : 'Historical Playback Replay'}
          </span>
        </div>

        {/* Live / Playback Clock */}
        <div className="flex items-center gap-space-xs px-space-md py-1 bg-[#FFFFFF] border border-[#C9DCCF] rounded-lg">
          <span className="material-symbols-outlined text-[#52665C] text-xs">schedule</span>
          <span className="font-telemetry-dense text-telemetry-dense text-[#52665C] tracking-wider">
            {simTime}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(StatusBarComponent);
