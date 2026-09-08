import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = {
  default: {
    id: 'default',
    name: 'Default Orange',
    color: '#F97316',
    brand: '#F97316',
    brandDark: '#EA6A08',
    brandLight: '#FFF7ED',
    gradient: 'linear-gradient(135deg, #F97316, #F59E0B)'
  },
  blue: {
    id: 'blue',
    name: 'Ocean Blue',
    color: '#2563EB',
    brand: '#2563EB',
    brandDark: '#1D4ED8',
    brandLight: '#EFF6FF',
    gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    color: '#059669',
    brand: '#059669',
    brandDark: '#047857',
    brandLight: '#ECFDF5',
    gradient: 'linear-gradient(135deg, #059669, #10B981)'
  },
  purple: {
    id: 'purple',
    name: 'Amethyst Purple',
    color: '#7C3AED',
    brand: '#7C3AED',
    brandDark: '#6D28D9',
    brandLight: '#F5F3FF',
    gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)'
  }
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('v_theme_color') || 'default';
  });

  const [density, setDensity] = useState(() => {
    return localStorage.getItem('v_density') || 'comfortable';
  });

  const [scale, setScale] = useState(() => {
    return parseInt(localStorage.getItem('v_ui_scale') || '100', 10);
  });

  const [isZebra, setIsZebra] = useState(() => {
    return localStorage.getItem('v_table_zebra') === 'true';
  });

  const [isGrid, setIsGrid] = useState(() => {
    return localStorage.getItem('v_table_grid') === 'true';
  });

  // Manual override for the sidebar's Insurance Flow Simulator link.
  // Tri-state: null means "no explicit preference yet" — Sidebar.jsx then
  // falls back to a role default (hidden for carrier, shown otherwise).
  // Once the user actually flips the Density panel switch, it becomes an
  // explicit true/false that wins regardless of role.
  const [showGlSimulation, setShowGlSimulation] = useState(() => {
    const stored = localStorage.getItem('v_show_gl_simulation');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return null;
  });

  // Apply Theme
  useEffect(() => {
    const t = THEMES[currentTheme] || THEMES.default;
    const root = document.documentElement;
    root.style.setProperty('--color-brand', t.brand);
    root.style.setProperty('--color-brand-dark', t.brandDark);
    root.style.setProperty('--color-brand-light', t.brandLight);
    root.style.setProperty('--color-brand-gradient', t.gradient);
    localStorage.setItem('v_theme_color', currentTheme);
  }, [currentTheme]);

  // Apply Density
  useEffect(() => {
    document.body.setAttribute('data-density', density);
    document.documentElement.setAttribute('data-density', density);
    ['density-spacious', 'density-comfortable', 'density-compact', 'density-condensed'].forEach(cls => {
      document.body.classList.remove(cls);
      document.documentElement.classList.remove(cls);
    });
    document.body.classList.add(`density-${density}`);
    document.documentElement.classList.add(`density-${density}`);
    localStorage.setItem('v_density', density);
  }, [density]);

  // Apply UI Scale
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-scale', String(scale));
    root.style.setProperty('--ui-scale', String(scale / 100));
    root.style.setProperty('--font-scale', String(scale / 100));
    document.body.style.setProperty('--ui-scale', String(scale / 100));
    document.body.style.setProperty('--font-scale', String(scale / 100));
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.zoom = String(scale / 100);
    }
    localStorage.setItem('v_ui_scale', String(scale));
  }, [scale]);

  // Apply Zebra Striping
  useEffect(() => {
    document.documentElement.setAttribute('data-table-zebra', isZebra ? 'true' : 'false');
    document.body.setAttribute('data-table-zebra', isZebra ? 'true' : 'false');
    if (isZebra) {
      document.body.classList.add('table-zebra');
      document.documentElement.classList.add('table-zebra');
    } else {
      document.body.classList.remove('table-zebra');
      document.documentElement.classList.remove('table-zebra');
    }
    localStorage.setItem('v_table_zebra', String(isZebra));
  }, [isZebra]);

  // Apply Column Gridlines
  useEffect(() => {
    document.documentElement.setAttribute('data-table-grid', isGrid ? 'true' : 'false');
    document.body.setAttribute('data-table-grid', isGrid ? 'true' : 'false');
    if (isGrid) {
      document.body.classList.add('table-gridlines');
      document.documentElement.classList.add('table-gridlines');
    } else {
      document.body.classList.remove('table-gridlines');
      document.documentElement.classList.remove('table-gridlines');
    }
    localStorage.setItem('v_table_grid', String(isGrid));
  }, [isGrid]);

  // Persist the Insurance Flow Simulator override — only once it's an
  // explicit true/false; leave storage untouched while it's still null so a
  // later role-default change (if any) keeps applying until the user
  // actually picks a preference.
  useEffect(() => {
    if (showGlSimulation !== null) {
      localStorage.setItem('v_show_gl_simulation', String(showGlSimulation));
    }
  }, [showGlSimulation]);

  const changeTheme = (key) => {
    if (THEMES[key]) setCurrentTheme(key);
  };

  const applyDensity = (val) => {
    setDensity(val);
  };

  const applyScale = (val) => {
    setScale(val);
  };

  const stepScale = (delta) => {
    setScale(prev => {
      const next = prev + delta;
      return Math.min(125, Math.max(80, next));
    });
  };

  const resetDensityDefaults = () => {
    setDensity('comfortable');
    setScale(100);
    setIsZebra(false);
    setIsGrid(false);
    setShowGlSimulation(null);
    localStorage.removeItem('v_show_gl_simulation');
  };

  const toggleZebra = (val) => {
    setIsZebra(typeof val === 'boolean' ? val : !isZebra);
  };

  const toggleGrid = (val) => {
    setIsGrid(typeof val === 'boolean' ? val : !isGrid);
  };

  const toggleGlSimulation = (val) => {
    setShowGlSimulation(typeof val === 'boolean' ? val : !showGlSimulation);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        changeTheme,
        themes: THEMES,
        density,
        applyDensity,
        scale,
        applyScale,
        stepScale,
        resetDensityDefaults,
        isZebra,
        toggleZebra,
        isGrid,
        toggleGrid,
        showGlSimulation,
        toggleGlSimulation
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
