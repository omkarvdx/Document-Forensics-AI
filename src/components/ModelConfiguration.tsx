import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsIcon } from './icons/SettingsIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { LoadingScreen } from './LoadingScreen';
import { ModelConfig, Provider } from '../types';
import { ModelParameterControls } from './ModelParameterControls';
import { getDefaultParametersForModel, getModelCategory } from '../utils/modelParameterUtils';
import { 
  validateApiKey, 
  maskApiKey, 
  getApiKeyLabel, 
  getApiKeyPlaceholder, 
  getApiKeyDescription,
  isApiKeyAvailable,
  storeApiKeys,
  retrieveApiKeys,
  clearApiKeys
} from '../utils/apiKeyUtils';

const PROVIDER_CONFIGS = {
  google: {
    name: 'Google (Gemini)',
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-exp'],
    description: 'Google\'s Gemini multimodal models with advanced forensic analysis capabilities.'
  },
  openai: {
    name: 'OpenAI',
    models: [
      // GPT-5 Series (Latest)
      'gpt-5',
      'gpt-5-mini',
      // GPT-4.1 Series
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      // GPT-4o Series
      'gpt-4o',
      'gpt-4o-mini',
      // O-Series (Reasoning Models)
      'o4-mini',
      'o3',
      // Legacy Vision Models
      'gpt-4-vision-preview',
      // Meta Models
      'model-router'
    ],
    description: 'OpenAI\'s latest GPT models including GPT-5, GPT-4.1, o-series reasoning models with deep research capabilities, and vision-enabled models.'
  },
  'azure-openai': {
    name: 'Azure OpenAI',
    models: [
      // GPT-5 Series
      'gpt-5',
      'gpt-5-mini',
      // GPT-4.1 Series
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      // GPT-4o Series
      'gpt-4o',
      'gpt-4o-mini',
      // O-Series
      'o4-mini',
      'o3',
      // Legacy Models
      'gpt-4-vision-preview'
    ],
    description: 'Azure-hosted OpenAI models with enterprise-grade security and compliance, including latest GPT-5 and reasoning models with deep research capabilities.'
  },
  'bedrock-openai': {
    name: 'AWS Bedrock (OpenAI proxy)',
    models: [
      'gpt-5',
      'gpt-5-mini',
      'gpt-4o',
      'gpt-4o-mini',
      'o4-mini',
      'o3'
    ],
    description: 'AWS Bedrock with OpenAI-compatible models through server-side proxy, featuring latest multimodal and deep research reasoning capabilities.'
  }
};

// Model categories for better organization in dropdown
const MODEL_CATEGORIES = {
  'gpt-5-series': {
    label: 'GPT-5 Series (Latest)',
    models: ['gpt-5', 'gpt-5-mini'],
    description: 'Most powerful models with advanced vision and reasoning capabilities'
  },
  'gpt-4.1-series': {
    label: 'GPT-4.1 Series',
    models: ['gpt-4.1-mini', 'gpt-4.1-nano'],
    description: 'Enhanced GPT-4 architecture with vision capabilities'
  },
  'gpt-4o-series': {
    label: 'GPT-4o Series',
    models: ['gpt-4o', 'gpt-4o-mini'],
    description: 'Optimized multimodal models for vision and text processing'
  },
  'o-series': {
    label: 'O-Series (Reasoning)',
    models: ['o4-mini', 'o3'],
    description: 'Advanced reasoning models with multimodal chain-of-thought capabilities'
  },
  'legacy': {
    label: 'Legacy & Specialized',
    models: ['gpt-4-vision-preview', 'model-router'],
    description: 'Earlier vision models and meta-routing capabilities'
  }
};

export const ModelConfiguration: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ModelConfig>({
    provider: 'openai',
    model: 'gpt-4o-mini',
    azureDeployment: '',
    parameters: undefined,
    apiKeys: {}
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState(false);

  useEffect(() => {
    // Simulate loading and load saved configuration
    const loadConfig = async () => {
      // Load model configuration
      const savedConfig = localStorage.getItem('tamperCheck_modelConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(parsedConfig);
        } catch (error) {
          console.error('Error loading saved configuration:', error);
        }
      }
      
      // Load API keys separately
      const savedApiKeys = retrieveApiKeys();
      if (Object.keys(savedApiKeys).length > 0) {
        setConfig(prev => ({
          ...prev,
          apiKeys: {
            google: savedApiKeys.google || '',
            openai: savedApiKeys.openai || '',
            azureOpenai: savedApiKeys.azureOpenai || '',
            bedrockProxy: savedApiKeys.bedrockProxy || ''
          }
        }));
      }
      
      // Show loading screen for better UX
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };
    
    loadConfig();
  }, []);

  const handleProviderChange = (provider: string) => {
    const selectedModel = PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS].models[0];
    const newConfig = {
      ...config,
      provider: provider as Provider,
      model: selectedModel,
      azureDeployment: provider === 'azure-openai' ? config.azureDeployment : '',
      parameters: ['openai', 'azure-openai', 'bedrock-openai'].includes(provider) 
        ? getDefaultParametersForModel(selectedModel)
        : undefined
    };
    setConfig(newConfig);
  };

  const handleModelChange = (model: string) => {
    const newConfig = {
      ...config,
      model,
      parameters: ['openai', 'azure-openai', 'bedrock-openai'].includes(config.provider)
        ? getDefaultParametersForModel(model)
        : undefined
    };
    setConfig(newConfig);
  };

  const handleSave = () => {
    // Save model configuration (excluding API keys)
    const { apiKeys, ...configWithoutKeys } = config;
    localStorage.setItem('tamperCheck_modelConfig', JSON.stringify(configWithoutKeys));
    
    // Save API keys separately with obfuscation
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
    
    setIsSaved(true);
    
    // Show saved message briefly, then navigate back
    setTimeout(() => {
      setIsSaved(false);
      navigate('/');
    }, 1500);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleApiKeyChange = (provider: Provider, value: string) => {
    setConfig(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider === 'azure-openai' ? 'azureOpenai' : provider === 'bedrock-openai' ? 'bedrockProxy' : provider]: value
      }
    }));
  };

  const getApiKeyForProvider = (provider: Provider): string => {
    if (!config.apiKeys) return '';
    
    switch (provider) {
      case 'google':
        return config.apiKeys.google || '';
      case 'openai':
        return config.apiKeys.openai || '';
      case 'azure-openai':
        return config.apiKeys.azureOpenai || '';
      case 'bedrock-openai':
        return config.apiKeys.bedrockProxy || '';
      default:
        return '';
    }
  };

  const handleClearApiKeys = () => {
    // Clear API keys from storage
    clearApiKeys();
    
    // Clear API keys from current config state
    setConfig(prev => ({
      ...prev,
      apiKeys: {}
    }));
  };

  const currentProviderConfig = PROVIDER_CONFIGS[config.provider as keyof typeof PROVIDER_CONFIGS];

  // Get model info for display
  const getModelInfo = (modelName: string) => {
    for (const [categoryKey, category] of Object.entries(MODEL_CATEGORIES)) {
      if (category.models.includes(modelName)) {
        return {
          category: category.label,
          description: category.description
        };
      }
    }
    return { category: 'Standard', description: 'Standard model capabilities' };
  };

  const selectedModelInfo = getModelInfo(config.model);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-300 hover:text-cyan-400 transition"
              >
                 <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Analysis</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-6 w-6 text-cyan-400" />
              <h1 className="text-xl font-bold text-cyan-400">Model Configuration</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">AI Model Configuration</h2>
              <p className="text-gray-400">
                Configure your preferred AI provider and model for document forensics analysis.
                Changes will be saved locally and applied to all future analyses.
              </p>
            </div>

            {/* Provider Selection */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-200 mb-4">
                AI Provider
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(PROVIDER_CONFIGS).map(([key, provider]) => (
                  <div
                    key={key}
                    onClick={() => handleProviderChange(key)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      config.provider === key
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-200">{provider.name}</h3>
                      {config.provider === key && (
                        <CheckCircleIcon className="h-5 w-5 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{provider.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-200 mb-4">
                Model Selection
              </label>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-3">
                  <strong>{currentProviderConfig.name}:</strong> {currentProviderConfig.description}
                </p>
                
                {/* Current Model Info */}
                <div className="mb-4 p-3 bg-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-cyan-400">{selectedModelInfo.category}</span>
                    <span className="text-xs text-gray-400">{config.model}</span>
                  </div>
                  <p className="text-xs text-gray-300">{selectedModelInfo.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Available Models ({currentProviderConfig.models.length} models)
                  </label>
                  <select
                    value={config.model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  >
                    {Object.entries(MODEL_CATEGORIES).map(([categoryKey, category]) => {
                      const availableModels = category.models.filter(model => 
                        currentProviderConfig.models.includes(model)
                      );
                      
                      if (availableModels.length === 0) return null;
                      
                      return (
                        <optgroup key={categoryKey} label={category.label}>
                          {availableModels.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    
                    {/* Any models not in categories */}
                    {currentProviderConfig.models
                      .filter(model => !Object.values(MODEL_CATEGORIES).some(cat => cat.models.includes(model)))
                      .map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Azure Deployment (only for Azure OpenAI) */}
            {config.provider === 'azure-openai' && (
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-200 mb-4">
                  Azure Deployment
                </label>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3">
                    Specify your Azure OpenAI deployment name for the selected model.
                  </p>
                  <input
                    type="text"
                    value={config.azureDeployment}
                    onChange={(e) => setConfig({ ...config, azureDeployment: e.target.value })}
                    placeholder={`e.g., ${config.model}-deployment`}
                    className="w-full bg-gray-600 border border-gray-500 rounded-lg p-3 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  />
                </div>
              </div>
            )}

            {/* API Key Configuration (Optional) */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-200">
                  API Key Configuration (Optional)
                </h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition flex items-center space-x-1"
                  >
                    <span>{showApiKeys ? 'Hide' : 'Show'} API Keys</span>
                    <span className={`transform transition-transform ${showApiKeys ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {Object.values(config.apiKeys || {}).some(key => key && key.trim().length > 0) && (
                    <button
                      onClick={handleClearApiKeys}
                      className="text-sm text-red-400 hover:text-red-300 transition flex items-center space-x-1"
                      title="Clear all saved API keys"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Clear API Keys</span>
                    </button>
                  )}
                </div>
              </div>
              
              {showApiKeys && (
                <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-gray-300 mb-4">
                    Provide your own API keys to override environment variables. 
                    API keys are stored locally with basic obfuscation for security.
                  </p>
                  
                  {/* Current Provider API Key */}
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-600 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          {getApiKeyLabel(config.provider)} {isApiKeyAvailable(config.provider, getApiKeyForProvider(config.provider)) ? '✅' : '❌'}
                        </label>
                        {getApiKeyForProvider(config.provider) && (
                          <span className="text-xs text-gray-400">
                            {maskApiKey(getApiKeyForProvider(config.provider))}
                          </span>
                        )}
                      </div>
                      <input
                        type="password"
                        value={getApiKeyForProvider(config.provider)}
                        onChange={(e) => handleApiKeyChange(config.provider, e.target.value)}
                        placeholder={getApiKeyPlaceholder(config.provider)}
                        className={`w-full bg-gray-700 border rounded-lg p-3 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 transition ${
                          getApiKeyForProvider(config.provider) && !validateApiKey(config.provider, getApiKeyForProvider(config.provider))
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-500 focus:border-cyan-500'
                        }`}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {getApiKeyDescription(config.provider)}
                      </p>
                      {getApiKeyForProvider(config.provider) && !validateApiKey(config.provider, getApiKeyForProvider(config.provider)) && (
                        <p className="text-xs text-red-400 mt-1">
                          ⚠️ Invalid API key format
                        </p>
                      )}
                    </div>
                    
                    {/* Environment Variable Fallback Status */}
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Environment Variable Status</h4>
                      <div className="space-y-1 text-xs">
                        {config.provider === 'google' && (
                          <p className={import.meta.env.VITE_GOOGLE_API_KEY ? 'text-green-400' : 'text-red-400'}>
                            VITE_GOOGLE_API_KEY: {import.meta.env.VITE_GOOGLE_API_KEY ? '✅ Set' : '❌ Not Set'}
                          </p>
                        )}
                        {config.provider === 'openai' && (
                          <p className={import.meta.env.VITE_OPENAI_API_KEY ? 'text-green-400' : 'text-red-400'}>
                            VITE_OPENAI_API_KEY: {import.meta.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Not Set'}
                          </p>
                        )}
                        {config.provider === 'azure-openai' && (
                          <>
                            <p className={import.meta.env.VITE_AZURE_OPENAI_API_KEY ? 'text-green-400' : 'text-red-400'}>
                              VITE_AZURE_OPENAI_API_KEY: {import.meta.env.VITE_AZURE_OPENAI_API_KEY ? '✅ Set' : '❌ Not Set'}
                            </p>
                            <p className={import.meta.env.VITE_AZURE_OPENAI_ENDPOINT ? 'text-green-400' : 'text-red-400'}>
                              VITE_AZURE_OPENAI_ENDPOINT: {import.meta.env.VITE_AZURE_OPENAI_ENDPOINT ? '✅ Set' : '❌ Not Set'}
                            </p>
                          </>
                        )}
                        {config.provider === 'bedrock-openai' && (
                          <p className={import.meta.env.VITE_BEDROCK_PROXY_URL ? 'text-green-400' : 'text-red-400'}>
                            VITE_BEDROCK_PROXY_URL: {import.meta.env.VITE_BEDROCK_PROXY_URL ? '✅ Set' : '❌ Not Set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Model Parameters (only for OpenAI models) */}
            {['openai', 'azure-openai', 'bedrock-openai'].includes(config.provider) && config.parameters && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-200">
                    Model Parameters
                  </h3>
                  <button
                    onClick={() => {
                      const defaultParams = getDefaultParametersForModel(config.model);
                      setConfig({ ...config, parameters: defaultParams });
                    }}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Reset to Defaults
                  </button>
                </div>
                <ModelParameterControls
                  parameterConfig={config.parameters}
                  onChange={(parameters) => setConfig({ ...config, parameters })}
                />
              </div>
            )}

            {/* API Endpoint Information */}
            {['openai', 'azure-openai', 'bedrock-openai'].includes(config.provider) && config.parameters && (
              <div className="mb-8 p-4 bg-indigo-900/20 border border-indigo-600/30 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-400 mb-2">API Configuration</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  {(() => {
                    const category = getModelCategory(config.model);
                    return (
                      <>
                        <p><strong>🔗 Endpoint:</strong> {category.endpoint === 'responses' ? '/v1/responses' : '/v1/chat/completions'}</p>
                        <p><strong>🏷️ Model Type:</strong> {category.type}</p>
                        <p><strong>📝 Description:</strong> {category.description}</p>
                        {category.type === 'gpt-5' && (
                          <p><strong>⚠️ Parameter:</strong> Uses max_completion_tokens (not max_tokens)</p>
                        )}
                        {category.type === 'o-series' && (
                          <p><strong>🧠 Special:</strong> Supports reasoning effort and strategy configuration</p>
                        )}
                      </>
                    );
                  })()} 
                </div>
              </div>
            )}

            {/* Model Features Notice */}
            <div className="mb-8 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Model Capabilities</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p><strong>✨ Latest Models:</strong> GPT-5 series offers the most advanced vision and reasoning capabilities</p>
                <p><strong>🧠 O-Series:</strong> Specialized reasoning models with integrated image chain-of-thought</p>
                <p><strong>👁️ Vision Support:</strong> All listed models support image analysis for document forensics</p>
                <p><strong>⚡ Performance:</strong> Mini variants provide faster processing for well-defined tasks</p>
              </div>
            </div>

            {/* Environment Variables Notice */}
            <div className="mb-8 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
              <h3 className="text-lg font-semibold text-amber-400 mb-2">API Configuration</h3>
              <p className="text-sm text-gray-300 mb-3">
                You can either provide API keys in the configuration above or set environment variables. 
                If both are provided, user-provided API keys take precedence:
              </p>
              <div className="bg-gray-800 p-3 rounded text-xs font-mono text-gray-300">
                {config.provider === 'google' && (
                  <>VITE_GOOGLE_API_KEY=your_google_api_key</>
                )}
                {config.provider === 'openai' && (
                  <>
                    VITE_OPENAI_API_KEY=your_openai_api_key<br/>
                    VITE_OPENAI_MODEL={config.model}
                  </>
                )}
                {config.provider === 'azure-openai' && (
                  <>
                    VITE_AZURE_OPENAI_API_KEY=your_azure_key<br/>
                    VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com<br/>
                    VITE_AZURE_OPENAI_DEPLOYMENT={config.azureDeployment || `${config.model}-deployment`}
                  </>
                )}
                {config.provider === 'bedrock-openai' && (
                  <>VITE_BEDROCK_PROXY_URL=https://your-proxy.example.com/bedrock</>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {isSaved ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};