import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const SettingsContext = createContext({ institutionName: 'Institución Educativa', logoUrl: null });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ institutionName: 'Institución Educativa', logoUrl: null });

  const fetchSettings = async () => {
    try {
      const { data } = await client.get('/settings');
      setSettings({ institutionName: data.institution_name, logoUrl: data.logo_url });
    } catch {}
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, refresh: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
