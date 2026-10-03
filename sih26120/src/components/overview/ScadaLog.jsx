import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * ScadaLog Component
 * Industrial telemetry and alarm event stream with alarm acknowledgement,
 * filtering (ALL / INFO / WARN / DATA / VALVE), and intelligent auto-scroll management.
 */
function ScadaLogComponent({ log = [], actions }) {
  const [filter, setFilter] = useState('ALL');
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const logContainerRef = useRef(null);

  // Compute live count of unacknowledged WARN/CRITICAL alarm entries
  const unacknowledgedAlarms = useMemo(() => {
    return log.filter((item) => {
      const type = (item.type || '').toUpperCase();
      const isAlarm = type === 'WARN' || type === 'CRITICAL' || type === 'ALARM';
      return isAlarm && !item.acknowledged;
    });
  }, [log]);

  const activeAlarmsCount = unacknowledgedAlarms.length;

  // Filter the log stream based on active filter button
  const filteredLog = useMemo(() => {
    return log.filter((item) => {
      if (filter === 'ALL') return true;
      const type = (item.type || '').toUpperCase();
      if (filter === 'WARN') {
        return type === 'WARN' || type === 'CRITICAL' || type === 'ALARM';
      }
      return type === filter;
    });
  }, [log, filter]);

  // Handle user scroll detection: if user scrolls away from bottom, pause auto-scroll
  const handleScroll = () => {
    const el = logContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 35;
    setUserScrolledUp(!isAtBottom);
  };

  // Auto-scroll to bottom on new entries unless user has scrolled up
  useEffect(() => {
    const el = logContainerRef.current;
    if (!el || userScrolledUp) return;
    el.scrollTop = el.scrollHeight;
  }, [log.length, userScrolledUp]);

  // Function to snap back to bottom and resume auto-scroll
  const scrollToBottom = () => {
    const el = logContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setUserScrolledUp(false);
  };

  const handleAcknowledge = () => {
    if (activeAlarmsCount === 0) return;
    actions?.acknowledgeAlarms?.();
  };

  return (
    <div className="flex flex-col bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] overflow-hidden shadow-sm select-none">
      {/* Header with Title and Filter Buttons */}
      <div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[#006B45] text-base">notifications</span>
          <span className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs font-semibold">
            SCADA TELEMETRY &amp; ALARM LOG
          </span>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 font-telemetry-dense text-[10px]">
          {['ALL', 'INFO', 'WARN', 'DATA', 'VALVE'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                filter === f
                  ? 'bg-[#00A86B] text-white font-semibold shadow-xs'
                  : 'bg-[#EAF7EF] text-[#52665C] hover:text-[#10251B]'
              }`}
              aria-label={`Filter log entries by ${f}`}
              aria-pressed={filter === f}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed Container */}
      <div className="relative">
        <div
          ref={logContainerRef}
          onScroll={handleScroll}
          className="p-space-md flex flex-col gap-2 max-h-[320px] overflow-y-auto font-telemetry-dense text-telemetry-dense scroll-smooth"
          tabIndex={0}
          aria-label="SCADA Telemetry and Alarm Event Log"
        >
          {filteredLog.length === 0 ? (
            <div className="text-center py-8 text-[#52665C] text-xs">
              No entries matching filter <strong className="text-[#003B25]">[{filter}]</strong>.
            </div>
          ) : (
            filteredLog.map((item) => {
              const type = (item.type || '').toUpperCase();
              const isInfo = type === 'INFO' || type === 'SYNC';
              const isWarn = type === 'WARN' || type === 'CRITICAL' || type === 'ALARM';
              const isValve = type === 'VALVE' || type === 'CYCLE';
              const isAcknowledged = item.acknowledged;

              const borderColor = isInfo
                ? 'border-l-[rgb(37,99,235)]'
                : isWarn
                ? isAcknowledged
                  ? 'border-l-[rgb(245,158,11)]/40'
                  : 'border-l-[rgb(245,158,11)]'
                : isValve
                ? 'border-l-[#00A86B]'
                : 'border-l-[#003B25]';

              const badgeColor = isInfo
                ? 'text-[rgb(37,99,235)]'
                : isWarn
                ? isAcknowledged
                  ? 'text-[rgb(245,158,11)]/70'
                  : 'text-[rgb(245,158,11)]'
                : isValve
                ? 'text-[#00A86B]'
                : 'text-[#003B25]';

              return (
                <div
                  key={item.id}
                  className={`p-space-sm bg-[#F7FAF8] rounded-lg border-l-2 ${borderColor} border-y border-r border-[#C9DCCF] flex flex-col gap-1 shadow-2xs transition-all ${
                    isAcknowledged ? 'opacity-65' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isWarn && !isAcknowledged && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[rgb(245,158,11)] animate-ping"></span>
                      )}
                      <span className={`${badgeColor} font-semibold text-xs`}>
                        {item.code || `[${type}]`} {item.title}
                      </span>
                      {isAcknowledged && (
                        <span className="text-[9px] px-1 py-0.2 bg-[#EAF7EF] text-[#52665C] rounded font-label-caps">
                          ACK
                        </span>
                      )}
                    </div>
                    <span className="text-[#52665C] text-[10px]">{item.time}</span>
                  </div>
                  <p className="text-[#10251B] text-[11px] leading-tight">
                    {item.message || item.text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Floating "Scroll to newest" button if user scrolled up */}
        {userScrolledUp && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-2 right-4 px-2.5 py-1 bg-[#003B25] text-white text-[10px] font-telemetry-dense rounded-full shadow-md hover:bg-[#002D1A] flex items-center gap-1 transition-all cursor-pointer animate-bounce"
            aria-label="Resume auto-scroll to newest entries"
          >
            <span className="material-symbols-outlined text-xs">arrow_downward</span>
            <span>New events</span>
          </button>
        )}
      </div>

      {/* Acknowledge Footer Button Strip */}
      <div className="p-space-sm bg-[#FFFFFF] border-t border-[#C9DCCF] flex items-center justify-between">
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={activeAlarmsCount === 0}
          aria-label={
            activeAlarmsCount > 0
              ? `Acknowledge all ${activeAlarmsCount} active alarms`
              : 'All active alarms acknowledged'
          }
          className={`w-full py-1.5 text-center bg-[#EAF7EF] text-[#003B25] font-label-caps text-label-caps rounded-lg transition-colors border border-[#006B45] ${
            activeAlarmsCount === 0
              ? 'opacity-50 cursor-default'
              : 'hover:bg-[#D9F2E6] cursor-pointer'
          }`}
        >
          {activeAlarmsCount > 0
            ? `ACKNOWLEDGE ALL ACTIVE ALARMS (${activeAlarmsCount})`
            : 'ALL ALARMS ACKNOWLEDGED'}
        </button>
      </div>
    </div>
  );
}

export default React.memo(ScadaLogComponent);
