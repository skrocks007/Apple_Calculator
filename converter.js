// Apple Calculator Unit Converter module (iOS 18 / macOS Sequoia style)

const UnitConverter = {
  categories: {
    length: {
      name: 'Length',
      base: 'm',
      units: {
        m: { name: 'Meters (m)', factor: 1 },
        km: { name: 'Kilometers (km)', factor: 1000 },
        cm: { name: 'Centimeters (cm)', factor: 0.01 },
        mm: { name: 'Millimeters (mm)', factor: 0.001 },
        mi: { name: 'Miles (mi)', factor: 1609.344 },
        yd: { name: 'Yards (yd)', factor: 0.9144 },
        ft: { name: 'Feet (ft)', factor: 0.3048 },
        in: { name: 'Inches (in)', factor: 0.0254 }
      }
    },
    weight: {
      name: 'Weight & Mass',
      base: 'kg',
      units: {
        kg: { name: 'Kilograms (kg)', factor: 1 },
        g: { name: 'Grams (g)', factor: 0.001 },
        mg: { name: 'Milligrams (mg)', factor: 0.000001 },
        lb: { name: 'Pounds (lb)', factor: 0.45359237 },
        oz: { name: 'Ounces (oz)', factor: 0.02834952 },
        t: { name: 'Metric Ton (t)', factor: 1000 },
        st: { name: 'Stone (st)', factor: 6.35029 }
      }
    },
    temperature: {
      name: 'Temperature',
      custom: true,
      units: {
        c: { name: 'Celsius (°C)' },
        f: { name: 'Fahrenheit (°F)' },
        k: { name: 'Kelvin (K)' }
      },
      convert: (val, from, to) => {
        if (from === to) return val;
        let c;
        if (from === 'c') c = val;
        else if (from === 'f') c = (val - 32) * (5 / 9);
        else if (from === 'k') c = val - 273.15;

        if (to === 'c') return c;
        if (to === 'f') return (c * 9 / 5) + 32;
        if (to === 'k') return c + 273.15;
        return val;
      }
    },
    currency: {
      name: 'Currency',
      base: 'USD',
      // Real standard benchmark exchange rates
      units: {
        USD: { name: 'US Dollar ($)', factor: 1 },
        EUR: { name: 'Euro (€)', factor: 1.08 },
        GBP: { name: 'British Pound (£)', factor: 1.29 },
        JPY: { name: 'Japanese Yen (¥)', factor: 0.0066 },
        CAD: { name: 'Canadian Dollar (C$)', factor: 0.72 },
        AUD: { name: 'Australian Dollar (A$)', factor: 0.66 },
        INR: { name: 'Indian Rupee (₹)', factor: 0.012 },
        CHF: { name: 'Swiss Franc (CHF)', factor: 1.14 },
        CNY: { name: 'Chinese Yuan (¥)', factor: 0.14 }
      }
    },
    area: {
      name: 'Area',
      base: 'sqm',
      units: {
        sqm: { name: 'Square Meters (m²)', factor: 1 },
        sqkm: { name: 'Square Kilometers (km²)', factor: 1000000 },
        sqft: { name: 'Square Feet (ft²)', factor: 0.092903 },
        sqmi: { name: 'Square Miles (mi²)', factor: 2589988.11 },
        ac: { name: 'Acres (ac)', factor: 4046.86 },
        ha: { name: 'Hectares (ha)', factor: 10000 }
      }
    },
    volume: {
      name: 'Volume',
      base: 'l',
      units: {
        l: { name: 'Liters (L)', factor: 1 },
        ml: { name: 'Milliliters (mL)', factor: 0.001 },
        gal: { name: 'Gallons US (gal)', factor: 3.78541 },
        qt: { name: 'Quarts US (qt)', factor: 0.946353 },
        pt: { name: 'Pints US (pt)', factor: 0.473176 },
        cup: { name: 'Cups US', factor: 0.236588 },
        floz: { name: 'Fluid Ounces US (fl oz)', factor: 0.0295735 }
      }
    },
    speed: {
      name: 'Speed',
      base: 'kmh',
      units: {
        kmh: { name: 'Kilometers per Hour (km/h)', factor: 1 },
        mph: { name: 'Miles per Hour (mph)', factor: 1.60934 },
        ms: { name: 'Meters per Second (m/s)', factor: 3.6 },
        kn: { name: 'Knots (kn)', factor: 1.852 }
      }
    },
    data: {
      name: 'Data Storage',
      base: 'MB',
      units: {
        B: { name: 'Bytes (B)', factor: 0.000001 },
        KB: { name: 'Kilobytes (KB)', factor: 0.001 },
        MB: { name: 'Megabytes (MB)', factor: 1 },
        GB: { name: 'Gigabytes (GB)', factor: 1000 },
        TB: { name: 'Terabytes (TB)', factor: 1000000 }
      }
    },
    time: {
      name: 'Time',
      base: 's',
      units: {
        s: { name: 'Seconds (s)', factor: 1 },
        min: { name: 'Minutes (min)', factor: 60 },
        h: { name: 'Hours (hr)', factor: 3600 },
        d: { name: 'Days (d)', factor: 86400 },
        wk: { name: 'Weeks (wk)', factor: 604800 },
        yr: { name: 'Years (yr)', factor: 31536000 }
      }
    }
  },

  convert(value, categoryKey, fromUnit, toUnit) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    if (fromUnit === toUnit) return num.toString();

    const cat = this.categories[categoryKey];
    if (!cat) return '0';

    if (cat.custom && cat.convert) {
      const res = cat.convert(num, fromUnit, toUnit);
      return this.formatNumber(res);
    }

    const fromFactor = cat.units[fromUnit]?.factor || 1;
    const toFactor = cat.units[toUnit]?.factor || 1;

    // Convert from source to base, then base to target
    const baseValue = num * fromFactor;
    const result = baseValue / toFactor;

    return this.formatNumber(result);
  },

  formatNumber(val) {
    if (Math.abs(val) < 1e-6 && val !== 0) {
      return val.toExponential(4);
    }
    // Clean float rounding
    const rounded = parseFloat(val.toPrecision(10));
    return rounded.toString();
  }
};

window.UnitConverter = UnitConverter;
