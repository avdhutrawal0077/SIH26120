import React, { useEffect, useRef } from 'react';

/**
 * WellStatusAlerts Component
 * Diagnostic status and threshold watch indicators evaluated via the rule engine.
 * Reflects real live thresholds: Wellhead pressure tolerance, motor load,
 * heel pressure containment limit (8.75 MPa), and caprock integrity index.
 */
function WellStatusAlertsComponent({
  telemetry = {},
  wellStatus = {},
  actions
}) {
  const items = wellStatus.items || [
    {
      id: 'steam_inj',
      title: 'Steam injection within operating range',
      detail: `Wellhead pressure steady at ${telemetry.whPressure || '2.15'} MPa (Tolerance ±0.2)`,
      status: 'OK'
    },
    {
      id: 'srp_load',
      title: 'SRP load within acceptable range',
      detail: `Motor load ${telemetry.motorLoad || 58}% nominal · Rod tension ${telemetry.rodLoad || '7.8'} klb safe`,
      status: 'OK'
    },
    {
      id: 'res_press',
      title: 'Reservoir pressure approaching target limit',
      detail: `Heel zone at ${telemetry.heelPressure || '8.42'} MPa (Upper threshold 8.75 MPa)`,
      status: 'WATCH'
    },
    {
      id: 'caprock',
      title: 'Caprock containment envelope secure',
      detail: 'Containment index 98.2% (Threshold 95.0%)',
      status: 'OK'
    }
  ];

  const overallCondition = wellStatus.overallCondition || 'NORMAL COND';
  const overallBadgeColor = wellStatus.overallBadgeColor || 'bg-[#EAF7EF] text-[#006B45] border-[#C9DCCF]';
  const okCount = wellStatus.okCount ?? 3;
  const watchCount = wellStatus.watchCount ?? 1;
  const critCount = wellStatus.critCount ?? 0;
  const interlockPass = wellStatus.interlockPass || 'Pass';
  const interlockColor = wellStatus.interlockColor || 'text-[#006B45]';

  // Track individual rule status changes and write log entries
  const prevStatusesRef = useRef({});
  useEffect(() => {
    items.forEach((item) => {
      const prevStatus = prevStatusesRef.current[item.id];
      if (prevStatus && prevStatus !== item.status) {
        const isEscalation = item.status === 'CRITICAL' || (item.status === 'WATCH' && prevStatus === 'OK');
        const timeStr = telemetry.timestamp ? telemetry.timestamp.substring(11, 19) : new Date().toTimeString().substring(0, 8);
        actions?.appendLog?.({
          id: Date.now() + Math.random(),
          time: timeStr,
          type: isEscalation ? 'WARN' : 'INFO',
          code: isEscalation ? '[WARN]' : '[INFO]',
          title: item.title,
          text: `${item.detail}. Diagnostic threshold status transitioned from ${prevStatus} to ${item.status}.`
        });
      }
      prevStatusesRef.current[item.id] = item.status;
    });
  }, [items, telemetry.timestamp, actions]);

  return (
    <div className="flex flex-col bg-[#FFFFFF] border border-[#C9DCCF] rounded-xl overflow-hidden shadow-sm select-none">
      {/* Header */}
      <div className="h-10 px-space-lg bg-[#F5F9F4] border-b border-[#C9DCCF] flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[#00A86B] text-base">verified</span>
          <h3 className="font-headline-md text-headline-md text-[#10251B] uppercase tracking-wide text-xs font-semibold">
            Well Operating Status &amp; Alerts
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full font-label-caps text-label-caps border transition-all ${overallBadgeColor}`}
        >
          {overallCondition}
        </span>
      </div>

      {/* Diagnostic Status Items List */}
      <div className="p-space-lg flex flex-col gap-space-sm justify-between flex-1">
        <div className="flex flex-col gap-2.5">
          {items.map((item) => {
            const isOk = item.status === 'OK';
            const isWatch = item.status === 'WATCH';

            const borderColor = isOk
              ? 'border-l-[#00A86B]'
              : isWatch
              ? 'border-l-[rgb(245,158,11)]'
              : 'border-l-[#DC2626]';

            const iconName = isOk
              ? 'check_circle'
              : isWatch
              ? 'warning'
              : 'error';

            const iconColor = isOk
              ? 'text-[#00A86B]'
              : isWatch
              ? 'text-[rgb(245,158,11)]'
              : 'text-[#DC2626]';

            return (
              <div
                key={item.id}
                className={`p-2.5 bg-[#F9FCFA] rounded-lg border-l-2 ${borderColor} border-y border-r border-[#C9DCCF] flex items-center gap-2.5 shadow-xs transition-colors`}
              >
                <span className={`material-symbols-outlined ${iconColor} text-base shrink-0`}>
                  {iconName}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[#10251B] text-xs font-medium leading-tight">
                    {item.title}
                  </span>
                  <span className="text-[#52665C] font-telemetry-dense text-[10px] mt-0.5">
                    {item.detail}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="pt-space-sm border-t border-[#C9DCCF]/60 flex items-center justify-between text-[#52665C] font-telemetry-dense text-[11px]">
          <span>
            Safety interlock check:{' '}
            <strong className={`font-semibold ${interlockColor}`}>{interlockPass}</strong>
          </span>
          <span className="text-[#10251B] font-metric-value">
            {okCount} OK {watchCount > 0 ? `/ ${watchCount} WATCH` : ''} {critCount > 0 ? `/ ${critCount} CRITICAL` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(WellStatusAlertsComponent);
