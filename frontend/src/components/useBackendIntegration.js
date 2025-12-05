import { useState, useCallback } from 'react';

const useBackendIntegration = () => {
  const [loading, setLoading] = useState(false);

  const callApi = useCallback(async (endpoint, data) => {
    console.log(`[Backend Call] Attempting to hit: /api/${endpoint}`);
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`[Backend Call] Success for ${endpoint}.`);
      return { success: true, mockData: `Processed result for ${endpoint}` };
    } catch (error) {
      console.error(`[Backend Error] Failed to process ${endpoint}:`, error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { callApi, loading };
};

export default useBackendIntegration;
