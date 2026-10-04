import React, { useState, useEffect } from 'react';
import { useWellTwin } from '../hooks/useWellTwin';
import StatusBar from '../components/overview/StatusBar';
import ViewHeader from '../components/overview/ViewHeader';
import KpiRow from '../components/overview/KpiRow';
import ProductionForecast from '../components/overview/ProductionForecast';
import DigitalTwinState from '../components/overview/DigitalTwinState';
import CssCycle from '../components/overview/CssCycle';
import ThermalViscosity from '../components/overview/ThermalViscosity';
import Prescriptive from '../components/overview/Prescriptive';
import WellStatusAlerts from '../components/overview/WellStatusAlerts';
import WellPadSchematic from '../components/overview/WellPadSchematic';
import CycleDynamics from '../components/overview/CycleDynamics';
import ModelEstimator from '../components/overview/ModelEstimator';
import ScadaLog from '../components/overview/ScadaLog';
import SoakSetpoint from '../components/overview/SoakSetpoint';

/**
 * Overview Component
 * Layout and composition for the Baghewala Field Oil Twin dashboard.
 * State, physics, and telemetry updates are managed via useWellTwin.
 * Includes initial load skeleton shimmer, responsive grid layouts,
 * and offline status indicators.
 */
export default function Overview() {
  const [isLoading, setIsLoading] = useState(true);

  // Initial load shimmer simulation (450ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const {
    state,
    telemetry,
    derivedMetrics,
    forecastData,
    thermalViscData,
    cyclePTData,
    recommendation,
    isRecShimmering,
    wellStatus,
    toast,
    canRevert,
    backendStatus,
    actions
  } = useWellTwin();

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#FFFFE4] flex flex-col select-none">
        {/* Skeleton Status Bar */}
        <div className="w-full bg-[#FFFFFF]/90 border-b border-[#C9DCCF] px-space-lg py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-32 h-4 bg-[#C9DCCF]/50 rounded animate-pulse"></div>
            <div className="w-24 h-5 bg-[#EAF7EF] rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 h-6 bg-[#EAF7EF] rounded-lg animate-pulse"></div>
            <div className="w-32 h-6 bg-[#FFFFFF] rounded-lg border border-[#C9DCCF]/60 animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="p-space-lg flex flex-col gap-space-lg">
          {/* Header Skeleton */}
          <div className="w-full h-24 bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] p-4 flex items-center justify-between animate-pulse">
            <div className="flex flex-col gap-2">
              <div className="w-48 h-6 bg-[#C9DCCF]/60 rounded"></div>
              <div className="w-64 h-4 bg-[#C9DCCF]/40 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-32 h-8 bg-[#C9DCCF]/40 rounded-lg"></div>
              <div className="w-24 h-8 bg-[#C9DCCF]/40 rounded-lg"></div>
            </div>
          </div>

          {/* KPI Row Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] p-4 flex flex-col justify-between animate-pulse">
                <div className="w-24 h-3 bg-[#C9DCCF]/50 rounded"></div>
                <div className="w-32 h-8 bg-[#C9DCCF]/60 rounded"></div>
                <div className="w-20 h-3 bg-[#C9DCCF]/40 rounded"></div>
              </div>
            ))}
          </div>

          {/* Chart Cards Skeleton */}
          <div className="w-full h-80 bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] p-4 flex flex-col gap-4 animate-pulse">
            <div className="w-48 h-5 bg-[#C9DCCF]/50 rounded"></div>
            <div className="w-full flex-1 bg-[#F5F9F4] rounded-lg"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
            <div className="h-64 bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] p-4 animate-pulse">
              <div className="w-40 h-5 bg-[#C9DCCF]/50 rounded mb-4"></div>
              <div className="w-full h-44 bg-[#F5F9F4] rounded-lg"></div>
            </div>
            <div className="h-64 bg-[#FFFFFF] rounded-xl border border-[#C9DCCF] p-4 animate-pulse">
              <div className="w-40 h-5 bg-[#C9DCCF]/50 rounded mb-4"></div>
              <div className="w-full h-44 bg-[#F5F9F4] rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* Status Bar — sits within DashboardLayout flow */}
      <StatusBar
        wellId={state.wellId}
        simTime={state.simTime}
        mode={state.mode}
        backendStatus={backendStatus}
      />

      <main className="w-full flex-1 bg-[#FFFFE4]">
        <div className="flex flex-col w-full p-space-lg gap-space-lg select-none">
          {/* View Control Sub-Header */}
          <ViewHeader
            wellId={state.wellId}
            mode={state.mode}
            isRefreshing={state.isRefreshing}
            scadaSync={telemetry.scadaSync}
            historyPoints={state.history.points}
            scrubIndex={state.scrubIndex}
            isPlayingPlayback={state.isPlayingPlayback}
            playbackSpeed={state.playbackSpeed}
            actions={actions}
          />

          {/* Top Metric Bar: 4-Column High-Density SCADA Matrix */}
          <KpiRow
            telemetry={telemetry}
            cycle={state.cycle}
            historyPoints={state.history.points}
          />

          {/* Production Forecast Card */}
          <ProductionForecast
            telemetry={telemetry}
            forecastRange={state.forecastRange}
            forecastData={forecastData}
            derivedMetrics={derivedMetrics}
            actions={actions}
          />

          {/* 2-Column Grid: Digital Twin State & Current CSS Cycle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg select-none">
            <DigitalTwinState
              telemetry={telemetry}
              historyPoints={state.history.points}
            />
            <CssCycle
              cycle={state.cycle}
              setpoints={state.setpoints}
              mode={state.mode}
              onAdvancePhase={actions.advancePhase}
            />
          </div>

          {/* Thermal & Viscosity Response Card */}
          <ThermalViscosity
            telemetry={telemetry}
            cycle={state.cycle}
            setpoints={state.setpoints}
            derivedMetrics={derivedMetrics}
            thermalViscData={thermalViscData}
          />

          {/* Primary Workspace Layout (2-Column Grid: 8-col / 4-col) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg select-none">
            <div className="lg:col-span-8">
              <Prescriptive
                recommendation={recommendation}
                isRecShimmering={isRecShimmering}
                canRevert={canRevert}
                telemetry={telemetry}
                setpoints={state.setpoints}
                actions={actions}
              />
            </div>
            <div className="lg:col-span-4">
              <WellStatusAlerts
                telemetry={telemetry}
                wellStatus={wellStatus}
                actions={actions}
              />
            </div>
          </div>

          {/* Secondary Workspace Layout (2-Column Grid: 8-col left / 4-col right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* Left 8-col: Physical Schematic & Cycle Dynamics */}
            <div className="lg:col-span-8 flex flex-col gap-space-lg">
              <WellPadSchematic
                telemetry={telemetry}
                cycle={state.cycle}
                derivedMetrics={derivedMetrics}
                historyPoints={state.history.points}
              />
              <CycleDynamics
                telemetry={telemetry}
                cycle={state.cycle}
                derivedMetrics={derivedMetrics}
                cyclePTData={cyclePTData}
              />
            </div>

            {/* Right 4-col: Model Estimator, SCADA Log, Soak Setpoint */}
            <div className="lg:col-span-4 flex flex-col gap-space-lg">
              <ModelEstimator
                model={state.model}
                actions={actions}
                autocalCountdown={state.autocalCountdown}
              />
              <ScadaLog
                alerts={state.alerts}
                log={state.log}
                actions={actions}
              />
              <SoakSetpoint
                setpoints={state.setpoints}
                cycle={state.cycle}
                actions={actions}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Toast notification overlay */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-lg bg-[#003B25] text-white text-sm font-medium shadow-lg border border-[#C9DCCF]/30 animate-pulse"
        >
          {toast}
        </div>
      )}
    </React.Fragment>
  );
}
