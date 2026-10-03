import React from 'react';
import { WELL_PROFILES } from '../../lib/twinModel';

/**
 * ViewHeader Component
 * Controlled well selector, LIVE/PLAYBACK toggle, playback scrubber controls,
 * SCADA sync indicator, and refresh button.
 */
function ViewHeaderComponent({
  wellId,
  mode,
  isRefreshing,
  scadaSync,
  historyPoints = [],
  scrubIndex,
  isPlayingPlayback,
  playbackSpeed,
  actions
}) {
  const profile = WELL_PROFILES[wellId] || WELL_PROFILES['BW-017'];
  const statusBadge = profile.statusBadge || `${wellId} // THERMAL`;
  const pointsCount = historyPoints.length;
  const currentScrub = scrubIndex !== null ? scrubIndex : Math.max(0, pointsCount - 1);
  const currentScrubPoint = historyPoints[currentScrub];

  return (
    <div className="flex flex-col gap-3 bg-[#FFFFFF] px-space-xl py-space-lg rounded-xl border border-[#C9DCCF] shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-lg">
        {/* Title & Status Badge */}
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <span className="w-1.5 h-4 bg-[#00A86B] rounded-full"></span>
            <h1 className="font-headline-lg text-headline-lg text-[#10251B] tracking-tight font-semibold">
              Overview
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps border border-[#C9DCCF]">
              {statusBadge}
            </span>
          </div>
          <p className="font-body-md text-body-md text-[#52665C] mt-1 font-normal">
            {profile.operatingMode || 'Well-to-Surface Operating Intelligence'}
          </p>
        </div>

        {/* View Controls Strip */}
        <div className="flex flex-wrap items-center gap-space-md">
          {/* Well Selector (Controlled Select) */}
          <div className="relative">
            <label htmlFor="well-selector" className="sr-only">Select Well Profile</label>
            <select
              id="well-selector"
              value={wellId}
              onChange={(e) => actions.setWellId(e.target.value)}
              aria-label="Select Well Profile"
              className="appearance-none bg-[#FFFFFF] text-[#10251B] font-telemetry-data text-telemetry-data px-space-md py-1.5 pr-8 rounded-lg border border-[#C9DCCF] focus:outline-none focus:border-[#00A86B] cursor-pointer"
            >
              <option value="BW-017">BW-017 (Baghewala Field)</option>
              <option value="BW-012">BW-012 (Observation)</option>
              <option value="BW-004">BW-004 (Standby)</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#52665C] pointer-events-none text-sm">
              unfold_more
            </span>
          </div>

          {/* Mode Switch: LIVE / PLAYBACK */}
          <div className="flex items-center bg-[#EAF7EF] p-1 rounded-lg border border-[#C9DCCF] gap-0.5" role="group" aria-label="Operating Mode">
            <button
              id="mode-live"
              onClick={() => actions.setMode('LIVE')}
              aria-pressed={mode === 'LIVE'}
              aria-label="Switch to Live mode"
              className={`px-space-md py-1 rounded-md font-label-caps text-label-caps transition-all cursor-pointer ${
                mode === 'LIVE'
                  ? 'bg-[#00A86B] text-white'
                  : 'text-[#52665C] hover:text-[#10251B]'
              }`}
            >
              LIVE
            </button>
            <button
              id="mode-playback"
              onClick={() => actions.setMode('PLAYBACK')}
              aria-pressed={mode === 'PLAYBACK'}
              aria-label="Switch to Playback mode"
              className={`px-space-md py-1 rounded-md font-label-caps text-label-caps transition-all cursor-pointer ${
                mode === 'PLAYBACK'
                  ? 'bg-[#00A86B] text-white'
                  : 'text-[#52665C] hover:text-[#10251B]'
              }`}
            >
              PLAYBACK
            </button>
          </div>

          {/* SCADA Sync Status */}
          <div className="flex items-center gap-space-xs px-space-md py-1.5 bg-[#EAF7EF] rounded-lg border border-[#C9DCCF]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                mode === 'LIVE' ? 'bg-[#00A86B] animate-pulse' : 'bg-[#52665C]'
              }`}
            ></span>
            <span className="font-telemetry-dense text-telemetry-dense text-[#52665C]">
              SCADA SYNC:{' '}
              <span className={`font-medium ${mode === 'LIVE' ? 'text-[#006B45]' : 'text-[#52665C]'}`}>
                {mode === 'LIVE' ? scadaSync : 'PAUSED'}
              </span>
            </span>
          </div>

          {/* Refresh State Vector Button */}
          <button
            onClick={actions.handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh State Vector"
            className={`flex items-center justify-center p-2 bg-[#FFFFFF] hover:bg-[#EAF7EF] rounded-lg text-[#10251B] transition-colors border border-[#C9DCCF] ${
              isRefreshing ? 'opacity-70 cursor-wait' : 'cursor-pointer'
            }`}
            title="Refresh State Vector"
          >
            <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Playback Scrubber Bar (Expanded when in PLAYBACK mode) */}
      {mode === 'PLAYBACK' && (
        <div className="mt-1 pt-3 border-t border-[#C9DCCF]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FCF9] p-3 rounded-lg border border-[#C9DCCF]">
          <div className="flex items-center gap-2">
            <button
              onClick={actions.togglePlaybackPlay}
              className="w-8 h-8 flex items-center justify-center bg-[#00A86B] hover:bg-[#006B45] text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              title={isPlayingPlayback ? 'Pause Replay' : 'Play Replay'}
            >
              <span className="material-symbols-outlined text-sm">
                {isPlayingPlayback ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-[#FFFFFF] p-0.5 rounded-lg border border-[#C9DCCF] gap-0.5">
              {[1, 4, 16].map(speed => (
                <button
                  key={speed}
                  onClick={() => actions.setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded text-[10px] font-metric-value transition-all cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-[#006B45] text-white'
                      : 'text-[#52665C] hover:text-[#10251B]'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <span className="text-[#52665C] font-telemetry-dense text-xs ml-1">
              Replay Timeline:
            </span>
          </div>

          {/* Timeline Scrubber Slider */}
          <div className="flex-1 flex items-center gap-3 px-2">
            <span className="text-[10px] font-telemetry-dense text-[#52665C] whitespace-nowrap">
              {historyPoints[0]?.timestamp?.substring(11, 19) || 'Start'}
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(0, pointsCount - 1)}
              value={currentScrub}
              onChange={(e) => actions.scrubPlayback(parseInt(e.target.value, 10))}
              className="w-full accent-[#00A86B] cursor-pointer"
            />
            <span className="text-[10px] font-telemetry-dense text-[#52665C] whitespace-nowrap">
              {historyPoints[pointsCount - 1]?.timestamp?.substring(11, 19) || 'Live'}
            </span>
          </div>

          {/* Current Scrubbed Time Badge */}
          <div className="px-2.5 py-1 bg-[#FFFFFF] border border-[#00A86B]/40 rounded-lg flex items-center gap-1.5 shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]"></span>
            <span className="font-telemetry-dense text-xs text-[#10251B] font-semibold">
              {currentScrubPoint?.timestamp || 'Replay Point'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(ViewHeaderComponent);
