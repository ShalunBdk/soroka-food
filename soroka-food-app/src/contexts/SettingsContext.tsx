import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import type { SiteSettings } from '../types';

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.settings.getPublic();
        setSettings(data);

        // Update document title once
        if (data?.siteName) {
          document.title = data.siteName;
        }
      } catch (err) {
        console.error('Error loading site settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []); // Load only once on mount

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
