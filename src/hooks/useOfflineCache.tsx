import { useState, useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";

interface CacheConfig {
  key: string;
  refreshInterval?: number;
}

export const useOfflineCache = <T,>(
  fetchFn: () => Promise<T>,
  config: CacheConfig
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSync, setNeedsSync] = useState(false);
  const isOnline = useOnlineStatus();

  const loadFromCache = () => {
    const cached = localStorage.getItem(config.key);
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch (error) {
        console.error("Error parsing cache:", error);
      }
    }
  };

  const saveToCache = (newData: T) => {
    localStorage.setItem(config.key, JSON.stringify(newData));
    localStorage.setItem(`${config.key}_timestamp`, Date.now().toString());
  };

  const fetchAndCache = async () => {
    try {
      setLoading(true);
      const newData = await fetchFn();
      setData(newData);
      saveToCache(newData);
      setNeedsSync(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (!isOnline) {
        loadFromCache();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromCache();
    
    if (isOnline) {
      fetchAndCache();
    } else {
      setLoading(false);
    }
  }, [config.key]);

  useEffect(() => {
    if (isOnline && needsSync) {
      fetchAndCache();
    }
  }, [isOnline, needsSync]);

  useEffect(() => {
    if (!isOnline && data) {
      setNeedsSync(true);
    }
  }, [isOnline]);

  return { data, loading, needsSync, refresh: fetchAndCache };
};
