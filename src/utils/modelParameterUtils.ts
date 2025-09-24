import { 
  ModelType, 
  ModelParameterConfig, 
  StandardModelParameters, 
  GPT5ModelParameters, 
  ReasoningModelParameters 
} from '../types';

// Model categorization
export const MODEL_CATEGORIES = {
  'gpt-4o': {
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-vision-preview'],
    type: 'gpt-4o' as ModelType,
    endpoint: 'chat/completions',
    description: 'Standard GPT-4o models with vision capabilities'
  },
  'gpt-5': {
    models: ['gpt-5', 'gpt-5-mini', 'gpt-4.1-mini', 'gpt-4.1-nano'],
    type: 'gpt-5' as ModelType,
    endpoint: 'chat/completions',
    description: 'GPT-5 series models requiring max_completion_tokens'
  },
  'o-series': {
    models: ['o4-mini', 'o3'],
    type: 'o-series' as ModelType,
    endpoint: 'responses',
    description: 'Advanced reasoning models with chain-of-thought capabilities'
  },
  'legacy': {
    models: ['model-router'],
    type: 'legacy' as ModelType,
    endpoint: 'chat/completions',
    description: 'Legacy and specialized routing models'
  }
};

// Default parameter configurations for each model type
export const DEFAULT_PARAMETERS = {
  'gpt-4o': {
    temperature: 0.1,
    maxTokens: 4000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0
  } as StandardModelParameters,
  
  'gpt-5': {
    temperature: 0.1,
    maxCompletionTokens: 4000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
    responseFormat: { type: 'json_object' as const }
  } as GPT5ModelParameters,
  
  'o-series': {
    temperature: 0.1, // Not actually used by API, but kept for interface compatibility
    maxOutputTokens: 4000,
    reasoningEffort: 'medium' as const,
    reasoningStrategy: 'default' as const // Kept for UI, but not sent to API
  } as ReasoningModelParameters,
  
  'legacy': {
    temperature: 0.1,
    maxTokens: 4000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0
  } as StandardModelParameters
};

// Parameter constraints for validation
export const PARAMETER_CONSTRAINTS = {
  temperature: { min: 0, max: 2, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.1 },
  frequencyPenalty: { min: -2, max: 2, step: 0.1 },
  presencePenalty: { min: -2, max: 2, step: 0.1 },
  maxTokens: { min: 1, max: 32768, step: 1 },
  maxCompletionTokens: { min: 1, max: 32768, step: 1 },
  maxOutputTokens: { min: 1, max: 32768, step: 1 }
};

// Get model type from model name
export const getModelType = (modelName: string): ModelType => {
  for (const [_, category] of Object.entries(MODEL_CATEGORIES)) {
    if (category.models.includes(modelName)) {
      return category.type;
    }
  }
  return 'legacy'; // Default fallback
};

// Get model category info
export const getModelCategory = (modelName: string) => {
  for (const [key, category] of Object.entries(MODEL_CATEGORIES)) {
    if (category.models.includes(modelName)) {
      return { key, ...category };
    }
  }
  return { key: 'legacy', ...MODEL_CATEGORIES.legacy };
};

// Get default parameters for a model
export const getDefaultParametersForModel = (modelName: string): ModelParameterConfig => {
  const modelType = getModelType(modelName);
  return {
    modelType,
    parameters: DEFAULT_PARAMETERS[modelType]
  };
};

// Validate parameter values
export const validateParameter = (paramName: string, value: number): { isValid: boolean; message?: string } => {
  const constraint = PARAMETER_CONSTRAINTS[paramName as keyof typeof PARAMETER_CONSTRAINTS];
  if (!constraint) {
    return { isValid: true };
  }
  
  if (value < constraint.min || value > constraint.max) {
    return { 
      isValid: false, 
      message: `Value must be between ${constraint.min} and ${constraint.max}` 
    };
  }
  
  return { isValid: true };
};

// Get available parameters for a model type
export const getAvailableParameters = (modelType: ModelType): string[] => {
  const baseParams = ['temperature', 'topP', 'frequencyPenalty', 'presencePenalty'];
  
  switch (modelType) {
    case 'gpt-4o':
    case 'legacy':
      return [...baseParams, 'maxTokens'];
    case 'gpt-5':
      return [...baseParams, 'maxCompletionTokens', 'responseFormat'];
    case 'o-series':
      // O-series models don't support temperature, topP, frequency/presence penalties
      return ['maxOutputTokens', 'reasoningEffort', 'reasoningStrategy'];
    default:
      return baseParams;
  }
};

// Get parameter display info
export const getParameterInfo = (paramName: string) => {
  const info = {
    temperature: {
      label: 'Temperature',
      description: 'Controls randomness. Lower values = more focused, higher values = more creative',
      type: 'number',
      constraint: PARAMETER_CONSTRAINTS.temperature
    },
    topP: {
      label: 'Top P',
      description: 'Nucleus sampling parameter. Alternative to temperature',
      type: 'number',
      constraint: PARAMETER_CONSTRAINTS.topP
    },
    frequencyPenalty: {
      label: 'Frequency Penalty',
      description: 'Penalizes frequent tokens. Positive values reduce repetition',
      type: 'number',
      constraint: PARAMETER_CONSTRAINTS.frequencyPenalty
    },
    presencePenalty: {
      label: 'Presence Penalty',
      description: 'Penalizes tokens that have appeared. Positive values encourage new topics',
      type: 'number',
      constraint: PARAMETER_CONSTRAINTS.presencePenalty
    },
    maxTokens: {
      label: 'Max Tokens',
      description: 'Maximum number of tokens in the response',
      type: 'number',
      constraint: PARAMETER_CONSTRAINTS.maxTokens
    },
    maxCompletionTokens: {
      label: 'Max Completion Tokens',
      description: 'Maximum tokens for GPT-5 models (replaces max_tokens)',
      type: 'number',
      constraint: PARAMETER_CONSTRAINTS.maxCompletionTokens
    },
    maxOutputTokens: {
      label: 'Max Output Tokens',
      description: 'Maximum tokens for reasoning models output',
      type: 'number',
      constraint: PARAMETER_CONSTRAINTS.maxOutputTokens
    },
    reasoningEffort: {
      label: 'Reasoning Effort',
      description: 'Level of reasoning depth for O-series models',
      type: 'select',
      options: [
        { value: 'low', label: 'Low - Fast processing' },
        { value: 'medium', label: 'Medium - Balanced approach' },
        { value: 'high', label: 'High - Deep reasoning' }
      ]
    },
    reasoningStrategy: {
      label: 'Reasoning Strategy',
      description: 'Approach for reasoning models',
      type: 'select',
      options: [
        { value: 'default', label: 'Default - Standard reasoning' },
        { value: 'thorough', label: 'Thorough - Comprehensive analysis' },
        { value: 'creative', label: 'Creative - Alternative approaches' }
      ]
    },
    responseFormat: {
      label: 'Response Format',
      description: 'Output format for the response',
      type: 'select',
      options: [
        { value: 'text', label: 'Text - Plain text response' },
        { value: 'json_object', label: 'JSON Object - Structured response' }
      ]
    }
  };
  
  return info[paramName as keyof typeof info] || { label: paramName, description: '', type: 'number' };
};

// Create parameter configuration for API
export const createAPIParameterConfig = (config: ModelParameterConfig) => {
  const { modelType, parameters } = config;
  
  const baseConfig = {
    temperature: parameters.temperature,
    top_p: parameters.topP,
    frequency_penalty: parameters.frequencyPenalty,
    presence_penalty: parameters.presencePenalty
  };
  
  switch (modelType) {
    case 'gpt-4o':
    case 'legacy':
      const standardParams = parameters as StandardModelParameters;
      return {
        ...baseConfig,
        max_tokens: standardParams.maxTokens
      };
      
    case 'gpt-5':
      const gpt5Params = parameters as GPT5ModelParameters;
      return {
        ...baseConfig,
        max_completion_tokens: gpt5Params.maxCompletionTokens,
        response_format: gpt5Params.responseFormat
      };
      
    case 'o-series':
      const reasoningParams = parameters as ReasoningModelParameters;
      return {
        // O-series models only support these parameters based on current API
        max_output_tokens: reasoningParams.maxOutputTokens,
        reasoning: {
          effort: reasoningParams.reasoningEffort
          // Note: strategy parameter not supported in current API
        }
        // Note: temperature, top_p, frequency_penalty, presence_penalty are NOT supported
      };
      
    default:
      return baseConfig;
  }
};