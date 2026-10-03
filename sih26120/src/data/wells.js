// Synthetic data for Demo Mode
export const initialWellConfig = {
  wellId: 'BW-042',
  reservoir: {
    depth: 1200,          // m
    thickness: 15,        // m
    porosity: 0.28,       // fraction
    permeability: 250,    // mD
    oilSaturation: 0.75,  // fraction
    pressure: 40.2,       // bar
    temperature: 35,      // °C
    oilViscosity: 10000   // cP
  },
  css: {
    steamTemperature: 280, // °C
    steamPressure: 75,     // bar
    steamRate: 45,         // m³/day
    steamVolume: 450,      // m³ (derived from rate * duration ideally, but kept as parameter for demo)
    injectionDuration: 2.5,// days
    soakDuration: 1.5,     // days
    cycleNumber: 3
  },
  srp: {
    pumpDepth: 1100,       // m
    pumpSize: 2.25,        // inches
    pumpSpeed: 10,         // SPM
    strokeLength: 120,     // inches
    motorLoad: 65          // %
  }
};
