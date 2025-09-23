import React from 'react';
import { 
  ModelParameterConfig, 
  ModelType,
  StandardModelParameters,
  GPT5ModelParameters,
  ReasoningModelParameters 
} from '../types';
import { 
  getAvailableParameters, 
  getParameterInfo, 
  validateParameter,
  PARAMETER_CONSTRAINTS 
} from '../utils/modelParameterUtils';

interface ModelParameterControlsProps {
  parameterConfig: ModelParameterConfig;
  onChange: (config: ModelParameterConfig) => void;
}

export const ModelParameterControls: React.FC<ModelParameterControlsProps> = ({
  parameterConfig,
  onChange
}) => {
  const { modelType, parameters } = parameterConfig;
  const availableParams = getAvailableParameters(modelType);

  const handleParameterChange = (paramName: string, value: any) => {
    let updatedParameters = { ...parameters };

    // Handle different parameter types
    if (paramName === 'responseFormat') {
      const gpt5Params = updatedParameters as GPT5ModelParameters;
      gpt5Params.responseFormat = { type: value };
      updatedParameters = gpt5Params;
    } else if (paramName === 'reasoningEffort') {
      const reasoningParams = updatedParameters as ReasoningModelParameters;
      reasoningParams.reasoningEffort = value;
      updatedParameters = reasoningParams;
    } else if (paramName === 'reasoningStrategy') {
      const reasoningParams = updatedParameters as ReasoningModelParameters;
      reasoningParams.reasoningStrategy = value;
      updatedParameters = reasoningParams;
    } else {
      // Handle numeric parameters
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      (updatedParameters as any)[paramName] = numericValue;
    }

    onChange({
      modelType,
      parameters: updatedParameters
    });
  };

  const renderNumberInput = (paramName: string, value: number) => {
    const paramInfo = getParameterInfo(paramName);
    const constraint = 'constraint' in paramInfo ? paramInfo.constraint : undefined;
    const validation = validateParameter(paramName, value);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">
            {paramInfo.label}
          </label>
          <span className="text-xs text-gray-400">
            {constraint ? `${constraint.min}-${constraint.max}` : ''}
          </span>
        </div>
        <input
          type="number"
          value={value}
          onChange={(e) => handleParameterChange(paramName, e.target.value)}
          min={constraint?.min}
          max={constraint?.max}
          step={constraint?.step}
          className={`w-full bg-gray-600 border rounded-lg p-2 text-gray-200 text-sm focus:ring-2 focus:border-transparent transition ${
            validation.isValid 
              ? 'border-gray-500 focus:ring-cyan-500' 
              : 'border-red-500 focus:ring-red-500'
          }`}
        />
        <p className="text-xs text-gray-400">{paramInfo.description}</p>
        {!validation.isValid && (
          <p className="text-xs text-red-400">{validation.message}</p>
        )}
      </div>
    );
  };

  const renderSelectInput = (paramName: string, value: any) => {
    const paramInfo = getParameterInfo(paramName);
    const options = 'options' in paramInfo ? paramInfo.options || [] : [];

    let currentValue = value;
    if (paramName === 'responseFormat' && typeof value === 'object') {
      currentValue = value.type;
    }

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          {paramInfo.label}
        </label>
        <select
          value={currentValue}
          onChange={(e) => handleParameterChange(paramName, e.target.value)}
          className="w-full bg-gray-600 border border-gray-500 rounded-lg p-2 text-gray-200 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400">{paramInfo.description}</p>
      </div>
    );
  };

  const renderParameterControl = (paramName: string) => {
    const paramInfo = getParameterInfo(paramName);
    const value = (parameters as any)[paramName];

    if (paramInfo.type === 'select') {
      return renderSelectInput(paramName, value);
    } else {
      return renderNumberInput(paramName, value);
    }
  };

  if (availableParams.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">
          Model Parameters
        </h3>
        <p className="text-sm text-gray-400">
          Configure parameters for {modelType} model type. 
          {modelType === 'o-series' && ' Reasoning models use advanced chain-of-thought processing. Note: Temperature and sampling parameters are not supported.'}
          {modelType === 'gpt-5' && ' GPT-5 models use max_completion_tokens parameter.'}
          {modelType === 'gpt-4o' && ' Standard GPT-4o models with vision capabilities.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableParams.map((paramName) => (
          <div key={paramName}>
            {renderParameterControl(paramName)}
          </div>
        ))}
      </div>

      {/* Parameter Summary */}
      <div className="mt-4 p-3 bg-gray-600 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Current Configuration</h4>
        <div className="text-xs text-gray-400 space-y-1">
          {modelType === 'gpt-4o' || modelType === 'legacy' ? (
            <p><strong>Token Limit:</strong> {(parameters as StandardModelParameters).maxTokens}</p>
          ) : modelType === 'gpt-5' ? (
            <p><strong>Completion Tokens:</strong> {(parameters as GPT5ModelParameters).maxCompletionTokens}</p>
          ) : modelType === 'o-series' ? (
            <>
              <p><strong>Output Tokens:</strong> {(parameters as ReasoningModelParameters).maxOutputTokens}</p>
              <p><strong>Reasoning:</strong> {(parameters as ReasoningModelParameters).reasoningEffort} effort</p>
            </>
          ) : null}
          <p><strong>Temperature:</strong> {parameters.temperature} (creativity level)</p>
          {parameters.topP !== undefined && <p><strong>Top P:</strong> {parameters.topP}</p>}
        </div>
      </div>
    </div>
  );
};