import { useState, useEffect } from 'react';
import { wellService } from '../services/wellService';
import { Save, RotateCcw, PlayCircle, AlertCircle } from 'lucide-react';

export default function WellConfiguration() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const data = await wellService.getConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleInputChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: parseFloat(value) || value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await wellService.saveConfig(config);
    if (res.success) {
      setMessage({ type: 'success', text: 'Configuration saved successfully.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setLoading(true);
    const data = await wellService.resetConfig();
    setConfig(data);
    setMessage({ type: 'info', text: 'Configuration reset to defaults.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    setLoading(false);
  };

  const handleInitialize = async () => {
    setSaving(true);
    const res = await wellService.initializeDigitalTwin();
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
    setSaving(false);
  };

  if (loading || !config) {
    return <div className="p-6 text-slate-500 font-medium">Loading configuration...</div>;
  }

  const InputField = ({ label, value, unit, section, field, type = 'number', step = 'any' }) => (
    <div className="flex flex-col mb-3">
      <label className="text-xs font-semibold text-slate-600 mb-1 tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => handleInputChange(section, field, e.target.value)}
          className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block px-3 py-2 pr-12 transition-colors"
        />
        {unit && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-xs text-slate-400 font-medium">{unit}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Well Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Configure virtual well and operational parameters for Demo Simulation.</p>
        </div>
        {message.text && (
          <div className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            <AlertCircle className="w-4 h-4" />
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reservoir Properties */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Reservoir Properties</h2>
          </div>
          <div className="p-5">
            <InputField label="Depth" value={config.reservoir.depth} unit="m" section="reservoir" field="depth" />
            <InputField label="Thickness" value={config.reservoir.thickness} unit="m" section="reservoir" field="thickness" />
            <InputField label="Porosity" value={config.reservoir.porosity} unit="frac" section="reservoir" field="porosity" step="0.01" />
            <InputField label="Permeability" value={config.reservoir.permeability} unit="mD" section="reservoir" field="permeability" />
            <InputField label="Oil Saturation" value={config.reservoir.oilSaturation} unit="frac" section="reservoir" field="oilSaturation" step="0.01" />
            <InputField label="Reservoir Pressure" value={config.reservoir.pressure} unit="bar" section="reservoir" field="pressure" step="0.1" />
            <InputField label="Reservoir Temperature" value={config.reservoir.temperature} unit="°C" section="reservoir" field="temperature" step="0.1" />
            <InputField label="Initial Oil Viscosity" value={config.reservoir.oilViscosity} unit="cP" section="reservoir" field="oilViscosity" />
          </div>
        </div>

        {/* CSS Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">CSS Parameters</h2>
          </div>
          <div className="p-5">
            <InputField label="Steam Temperature" value={config.css.steamTemperature} unit="°C" section="css" field="steamTemperature" />
            <InputField label="Steam Pressure" value={config.css.steamPressure} unit="bar" section="css" field="steamPressure" />
            <InputField label="Steam Injection Rate" value={config.css.steamRate} unit="m³/d" section="css" field="steamRate" />
            <InputField label="Steam Volume" value={config.css.steamVolume} unit="m³" section="css" field="steamVolume" />
            <InputField label="Injection Duration" value={config.css.injectionDuration} unit="days" section="css" field="injectionDuration" step="0.1" />
            <InputField label="Soak Duration" value={config.css.soakDuration} unit="days" section="css" field="soakDuration" step="0.1" />
            <InputField label="Cycle Number" value={config.css.cycleNumber} unit="#" section="css" field="cycleNumber" type="number" step="1" />
          </div>
        </div>

        {/* SRP Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">SRP Parameters</h2>
          </div>
          <div className="p-5">
            <InputField label="Pump Depth" value={config.srp.pumpDepth} unit="m" section="srp" field="pumpDepth" />
            <InputField label="Pump Size" value={config.srp.pumpSize} unit="in" section="srp" field="pumpSize" step="0.25" />
            <InputField label="Pump Speed" value={config.srp.pumpSpeed} unit="SPM" section="srp" field="pumpSpeed" step="0.5" />
            <InputField label="Stroke Length" value={config.srp.strokeLength} unit="in" section="srp" field="strokeLength" />
            <InputField label="Motor Load" value={config.srp.motorLoad} unit="%" section="srp" field="motorLoad" step="0.1" />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:opacity-90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
          <button
            onClick={handleReset}
            disabled={loading || saving}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        
        <button
          onClick={handleInitialize}
          disabled={saving}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-70"
        >
          <PlayCircle className="w-5 h-5" />
          Initialize Digital Twin
        </button>
      </div>
    </div>
  );
}
