import { useEffect, useState } from 'react';
import { getSiteSettings, SITE_SETTINGS_DEFAULTS } from '../services/productService';

export default function useSiteSettings() {
  const [settings, setSettings] = useState(SITE_SETTINGS_DEFAULTS);

  useEffect(() => {
    let active = true;

    getSiteSettings()
      .then((data) => {
        if (!active || !data) return;
        setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return settings;
}
