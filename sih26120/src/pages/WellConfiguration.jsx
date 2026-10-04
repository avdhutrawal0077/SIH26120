import { useState, useEffect, useCallback } from 'react';
import { wellService } from '../services/wellService';
import { Save, RotateCcw, PlayCircle, AlertCircle } from 'lucide-react';

/**
 * InputField — declared at module scope so React never sees it as a
 * new component type across re-renders.  This is the root cause fix for
 * input focus being lost after every keystroke.
 *
 * We keep raw text in the parent `localValues` map and only commit a
 * parsed numeric value to `config` on blur, so that:
 *   - "1234" can be typed digit by digit without blur.
 *   - Intermediate states like "12.", "-", or "" don't collapse to 0.
 *   - Paste works seamlessly.
 */
function InputField({ id, label, rawValue, unit, onChange, onBlur, step = 'any' }) {
  return (
    <div className="flex flex-col mb-3">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600 mb-1 tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          step={step}
          value={rawValue}
          onChange={onChange}
          onBlur={onBlur}
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
}

/**
 * Normalise backend reservoir field names to the frontend contract.
 * Backend uses: initialPressure / initialTemperature / initialViscosity
 * Frontend uses: pressure / temperature / oilViscosity
 */
function normaliseConfig(raw) {
  if (!raw || !raw.reservoir) return raw;
  const r = raw.reservoir;
  return {
    ...raw,
    reservoir: {
      depth:         r.depth,
      thickness:     r.thickness,
      porosity:      r.porosity,
      permeability:  r.permeability,
      oilSaturation: r.oilSaturation,
      pressure:      r.pressure      ?? r.initialPressure      ?? 42,
      temperature:   r.temperature   ?? r.initialTemperature   ?? 40,
      oilViscosity:  r.oilViscosity  ?? r.initialViscosity     ?? 10000,
    }
  };
}

/**
 * Convert frontend reservoir shape back to what the backend Pydantic model expects.
 * We send both alias pairs so legacy and new backend fields both work.
 */
function denormaliseConfig(cfg) {
  const r = cfg.reservoir;
  return {
    ...cfg,
    reservoir: {
      depth:              r.depth,
      thickness:          r.thickness,
      porosity:           r.porosity,
      permeability:       r.permeability,
      oilSaturation:      r.oilSaturation,
      // Primary backend field names (Pydantic model)
      initialPressure:    r.pressure,
      initialTemperature: r.temperature,
      initialViscosity:   r.oilViscosity,
      // Also send as aliases in case frontend fallback reads them
      pressure:           r.pressure,
      temperature:        r.temperature,
      oilViscosity:       r.oilViscosity,
    }
  };
}

/** Convert a config tree to a flat map of "section.field" -> string for local input state */
function configToLocalValues(cfg) {
  const flat = {};
  if (!cfg) return flat;
  for (const section of Object.keys(cfg)) {
    if (typeof cfg[section] === 'object' && cfg[section] !== null) {
      for (const field of Object.keys(cfg[section])) {
        flat[`${section}.${field}`] = String(cfg[section][field]);
      }
    }
  }
  return flat;
}

export default function WellConfiguration() {
  const [config, setConfig] = useState(null);
  const [localValues, setLocalValues] = useState({});   // raw string values for controlled inputs
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState({ type: '', text: '' });

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const raw  = await wellService.getConfig();
    const data = normaliseConfig(raw);
    setConfig(data);
    setLocalValues(configToLocalValues(data));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * While typing: update only the raw string shown in the input.
   * Config state is NOT updated here — no re-mount of InputField, focus preserved.
   */
  const handleRawChange = (section, field, value) => {
    setLocalValues(prev => ({ ...prev, [`${section}.${field}`]: value }));
  };

  /**
   * On blur: commit the parsed numeric value (or keep previous if invalid).
   */
  const handleBlurCommit = (section, field) => {
    const raw = localValues[`${section}.${field}`] ?? '';
    const parsed = field === 'cycleNumber' ? parseInt(raw, 10) : parseFloat(raw);
    const committed = isNaN(parsed) ? (config[section][field] ?? 0) : parsed;

    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: committed }
    }));
    // Also normalise the displayed string to the committed value
    setLocalValues(prev => ({ ...prev, [`${section}.${field}`]: String(committed) }));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = denormaliseConfig(config);
    const res = await wellService.saveConfig(payload);
    if (res && res.success) {
      setMessage({ type: 'success', text: 'Configuration saved successfully.' });
    } else {
      setMessage({ type: 'error', text: 'Save failed. Check console.' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    setSaving(false);
  };

  const handleReset = async () => {
    setLoading(true);
    const res  = await wellService.resetConfig();
    const raw  = res.data || res;
    const data = normaliseConfig(raw);
    setConfig(data);
    setLocalValues(configToLocalValues(data));
    setMessage({ type: 'info', text: 'Configuration reset to defaults.' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    setLoading(false);
  };

  const handleInitialize = async () => {
    setSaving(true);
    const res = await wellService.initializeDigitalTwin();
    if (res && res.success) {
      setMessage({ type: 'success', text: res.message || 'Digital Twin initialized.' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    setSaving(false);
  };

  if (loading || !config) {
    return <div className="p-6 text-slate-500 font-medium">Loading configuration...</div>;
  }

  /** Helper to build InputField props from a section/field pair */
  const field = (label, section, f, unit, step = 'any') => ({
    id:       `cfg-${section}-${f}`,
    label,
    rawValue: localValues[`${section}.${f}`] ?? String(config[section]?.[f] ?? ''),
    unit,
    step,
    onChange: (e) => handleRawChange(section, f, e.target.value),
    onBlur:   ()  => handleBlurCommit(section, f),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Well Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Configure virtual well and operational parameters for the Digital Twin simulation.</p>
        </div>
        {message.text && (
          <div className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2
            ${message.type === 'success' ? 'bg-green-100 text-green-800' :
              message.type === 'error'   ? 'bg-red-100 text-red-800'     :
              'bg-blue-100 text-blue-800'}`}>
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
            <InputField {...field('Depth',                'reservoir', 'depth',        'm')} />
            <InputField {...field('Net Pay Thickness',    'reservoir', 'thickness',    'm')} />
            <InputField {...field('Porosity',             'reservoir', 'porosity',     'frac', '0.01')} />
            <InputField {...field('Permeability',         'reservoir', 'permeability', 'mD')} />
            <InputField {...field('Oil Saturation',       'reservoir', 'oilSaturation','frac', '0.01')} />
            <InputField {...field('Initial Pressure',     'reservoir', 'pressure',     'bar',  '0.1')} />
            <InputField {...field('Initial Temperature',  'reservoir', 'temperature',  '°C',   '0.1')} />
            <InputField {...field('Initial Oil Viscosity','reservoir', 'oilViscosity', 'cP')} />
          </div>
        </div>

        {/* CSS Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">CSS Parameters</h2>
          </div>
          <div className="p-5">
            <InputField {...field('Steam Temperature',    'css', 'steamTemperature', '°C')} />
            <InputField {...field('Steam Pressure',       'css', 'steamPressure',    'bar')} />
            <InputField {...field('Steam Injection Rate', 'css', 'steamRate',        'm³/d')} />
            <InputField {...field('Steam Volume',         'css', 'steamVolume',      'm³')} />
            <InputField {...field('Injection Duration',   'css', 'injectionDuration','days', '0.1')} />
            <InputField {...field('Soak Duration',        'css', 'soakDuration',     'days', '0.1')} />
            <InputField {...field('Cycle Number',         'css', 'cycleNumber',      '#',    '1')} />
          </div>
        </div>

        {/* SRP Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">SRP Parameters</h2>
          </div>
          <div className="p-5">
            <InputField {...field('Pump Depth',    'srp', 'pumpDepth',    'm')} />
            <InputField {...field('Pump Size',     'srp', 'pumpSize',     'in',  '0.25')} />
            <InputField {...field('Pump Speed',    'srp', 'pumpSpeed',    'SPM', '0.5')} />
            <InputField {...field('Stroke Length', 'srp', 'strokeLength', 'in')} />
            <InputField {...field('Motor Load',    'srp', 'motorLoad',    '%',   '0.1')} />
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
            Reset to Defaults
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
