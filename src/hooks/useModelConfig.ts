import { useState, useEffect } from 'react';
import type { ModelConfig, Provider } from '../types';

const DEFAULT_CONFIG: ModelConfig = {
  provider: 'google',
  model: 'gemini-2.5-flash',
  parameters: {
    modelType: 'gpt-4o',
    parameters: {
      temperature: 0.1,
      maxTokens: 4000,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  }
};

export const useModelConfig = () => {
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('tamperCheck_modelConfig');
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        setConfig(parsedConfig);
      }
    } catch (error) {
      console.warn('Failed to load model config from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  const updateConfig = (newConfig: ModelConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('tamperCheck_modelConfig', JSON.stringify(newConfig));
    } catch (error) {
      console.warn('Failed to save model config to localStorage:', error);
    }
  };

  return {
    config,
    setConfig: updateConfig,
    isLoaded
  };
};