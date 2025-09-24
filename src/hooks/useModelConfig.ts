import { useState, useEffect } from 'react';
import type { ModelConfig, Provider } from '../types';
import { retrieveApiKeys, storeApiKeys } from '../utils/apiKeyUtils';

const DEFAULT_CONFIG: ModelConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  parameters: {
    modelType: 'gpt-4o',
    parameters: {
      temperature: 0.1,
      maxTokens: 4000,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  },
  apiKeys: {}
};

export const useModelConfig = () => {
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage if available
    let loadedConfig = DEFAULT_CONFIG;
    
    try {
      const saved = localStorage.getItem('tamperCheck_modelConfig');
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        loadedConfig = parsedConfig;
      }
    } catch (error) {
      console.warn('Failed to load model config from localStorage:', error);
    }
    
    // Load API keys separately
    try {
      const apiKeys = retrieveApiKeys();
      if (Object.keys(apiKeys).length > 0) {
        loadedConfig = {
          ...loadedConfig,
          apiKeys: {
            google: apiKeys.google || '',
            openai: apiKeys.openai || '',
            azureOpenai: apiKeys.azureOpenai || '',
            bedrockProxy: apiKeys.bedrockProxy || ''
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load API keys from localStorage:', error);
    }
    
    setConfig(loadedConfig);
    setIsLoaded(true);
  }, []);

  const updateConfig = (newConfig: ModelConfig) => {
    setConfig(newConfig);
    try {
      // Store model config (excluding API keys)
      const { apiKeys, ...configWithoutKeys } = newConfig;
      localStorage.setItem('tamperCheck_modelConfig', JSON.stringify(configWithoutKeys));
      
      // Store API keys separately if they exist
      if (apiKeys) {
        const keysToStore = Object.entries(apiKeys).reduce((acc, [key, value]) => {
          if (value && value.trim().length > 0) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string>);
        
        if (Object.keys(keysToStore).length > 0) {
          storeApiKeys(keysToStore);
        }
      }
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