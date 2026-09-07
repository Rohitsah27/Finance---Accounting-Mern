import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_ENTITIES = [
  {
    id: 'ENT-MINE',
    name: 'My Business',
    businessType: 'mga',
    typeLabel: 'MGA / Program Manager',
    desc: 'Delegated underwriting authority, binder invoicing, bordereau cash settlement.',
    icon: '📙',
    isMine: true
  },
  {
    id: 'ENT-CAR-01',
    name: 'Southlake Insurance Co.',
    businessType: 'carrier',
    typeLabel: 'Insurance Carrier',
    desc: 'Risk-bearing underwriter, NAIC Schedule P, bordereau receivable match.',
    icon: '🛡️',
    isMine: false
  },
  {
    id: 'ENT-MGA-01',
    name: 'NTA Program Administrators',
    businessType: 'mga',
    typeLabel: 'Managing General Agent',
    desc: 'Program management override fee revenue, retail broker settlement.',
    icon: '🏢',
    isMine: false
  },
  {
    id: 'ENT-AGY-01',
    name: 'HIT Agency Group',
    businessType: 'agency',
    typeLabel: 'Retail Broker / Producer',
    desc: 'Direct customer premium collection, earned retail brokerage commission.',
    icon: '💼',
    isMine: false
  },
  {
    id: 'ENT-REIN-01',
    name: 'Starlight Re / Treaty Pool',
    businessType: 'reinsurer',
    typeLabel: 'Reinsurance Carrier',
    desc: 'Assumed quota-share cessions, treaty retrocession, catastrophe reserve modeling.',
    icon: '🌐',
    isMine: false
  },
  {
    id: 'INS-AYUSHI',
    name: 'Ayushi Fleet Logistics',
    businessType: 'general-business',
    typeLabel: 'Commercial Policyholder',
    desc: 'Commercial trucking primary fleet insured invoiced for gross premium.',
    icon: '🚛',
    isMine: false
  }
];

const DEFAULT_CONFIG = {
  companyName: 'Veridex Financial Enterprise',
  businessType: 'carrier',
  activeEntityId: 'ENT-CAR-01',
  v_setup_complete: true,
  secondaryEntities: DEFAULT_ENTITIES,
};

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [tenantConfig, setTenantConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tenant_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CONFIG;
  });

  const [entities] = useState(DEFAULT_ENTITIES);

  useEffect(() => {
    localStorage.setItem('v_tenant_config', JSON.stringify(tenantConfig));
  }, [tenantConfig]);

  const activeEntity = entities.find(e => e.id === tenantConfig.activeEntityId) || entities[1];

  const updateTenantConfig = (patch) => {
    setTenantConfig(prev => ({
      ...prev,
      ...patch
    }));
  };

  const switchEntity = (entityId) => {
    const found = entities.find(e => e.id === entityId);
    if (found) {
      setTenantConfig(prev => ({
        ...prev,
        activeEntityId: entityId,
        businessType: found.businessType,
      }));
    }
  };

  return (
    <ConfigContext.Provider value={{
      tenantConfig,
      entities,
      activeEntity,
      updateTenantConfig,
      switchEntity
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
