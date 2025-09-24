import { Provider } from '../types';

// Simple obfuscation for API keys in localStorage (not cryptographically secure, but better than plaintext)
const obfuscate = (text: string): string => {
  return btoa(text.split('').reverse().join(''));
};

const deobfuscate = (obfuscatedText: string): string => {
  try {
    return atob(obfuscatedText).split('').reverse().join('');
  } catch {
    return obfuscatedText; // Return as-is if deobfuscation fails
  }
};

// Sanitize and validate API key formats
export const validateApiKey = (provider: Provider, apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) return false;
  
  // Remove any potential whitespace or hidden characters
  const sanitizedKey = apiKey.trim();
  
  switch (provider) {
    case 'google':
      // Google API keys typically start with 'AIza' and are 39 characters long
      return sanitizedKey.startsWith('AIza') && sanitizedKey.length === 39;
    case 'openai':
      // OpenAI API keys can start with 'sk-' (legacy), 'sk-proj-' (project), or other formats
      // Modern keys can be much longer (up to 200+ characters)
      return (sanitizedKey.startsWith('sk-') || sanitizedKey.startsWith('sk-proj-')) && sanitizedKey.length >= 20;
    case 'azure-openai':
      // Azure OpenAI keys are typically 32 characters long hexadecimal
      return /^[a-f0-9]{32}$/i.test(sanitizedKey);
    case 'bedrock-openai':
      // Bedrock proxy URLs should be valid URLs
      try {
        new URL(sanitizedKey);
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
};

// Mask API key for display (show first 8 and last 4 characters)
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 12) return '••••••••';
  
  const start = apiKey.substring(0, 8);
  const end = apiKey.substring(apiKey.length - 4);
  // Limit middle dots to max 16 for better UI display
  const middleLength = Math.min(16, Math.max(4, apiKey.length - 12));
  const middle = '•'.repeat(middleLength);
  
  return `${start}${middle}${end}`;
};

// Get API key label for each provider
export const getApiKeyLabel = (provider: Provider): string => {
  switch (provider) {
    case 'google':
      return 'Google API Key';
    case 'openai':
      return 'OpenAI API Key';
    case 'azure-openai':
      return 'Azure OpenAI API Key';
    case 'bedrock-openai':
      return 'Bedrock Proxy URL';
    default:
      return 'API Key';
  }
};

// Get API key placeholder for each provider
export const getApiKeyPlaceholder = (provider: Provider): string => {
  switch (provider) {
    case 'google':
      return 'AIzaSy...';
    case 'openai':
      return 'sk-proj-... or sk-...';
    case 'azure-openai':
      return 'abc123def456...';
    case 'bedrock-openai':
      return 'https://your-proxy.example.com/bedrock';
    default:
      return 'Enter your API key...';
  }
};

// Get API key description/help text for each provider
export const getApiKeyDescription = (provider: Provider): string => {
  switch (provider) {
    case 'google':
      return 'Get your API key from the Google AI Studio (https://aistudio.google.com/app/apikey)';
    case 'openai':
      return 'Get your API key from the OpenAI Platform (https://platform.openai.com/api-keys)';
    case 'azure-openai':
      return 'Get your API key from the Azure OpenAI Service in the Azure portal';
    case 'bedrock-openai':
      return 'Provide the URL to your AWS Bedrock OpenAI-compatible proxy service';
    default:
      return 'Obtain your API key from the respective provider';
  }
};

// Store API keys securely in localStorage
export const storeApiKeys = (apiKeys: Record<string, string>): void => {
  try {
    const obfuscatedKeys = Object.entries(apiKeys).reduce((acc, [key, value]) => {
      if (value && typeof value === 'string' && value.trim().length > 0) {
        acc[key] = obfuscate(value.trim()); // Trim whitespace before storing
      }
      return acc;
    }, {} as Record<string, string>);
    
    localStorage.setItem('tamperCheck_apiKeys', JSON.stringify(obfuscatedKeys));
  } catch (error) {
    console.warn('Failed to store API keys:', error);
  }
};

// Retrieve API keys from localStorage
export const retrieveApiKeys = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem('tamperCheck_apiKeys');
    if (!stored) return {};
    
    const obfuscatedKeys = JSON.parse(stored);
    return Object.entries(obfuscatedKeys).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = deobfuscate(value);
      }
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.warn('Failed to retrieve API keys:', error);
    return {};
  }
};

// Clear stored API keys
export const clearApiKeys = (): void => {
  try {
    localStorage.removeItem('tamperCheck_apiKeys');
  } catch (error) {
    console.warn('Failed to clear API keys:', error);
  }
};

// Check if API key is available (either from config or environment)
export const isApiKeyAvailable = (provider: Provider, configApiKey?: string): boolean => {
  // Check user-provided API key first
  if (configApiKey && configApiKey.trim().length > 0) {
    return validateApiKey(provider, configApiKey);
  }
  
  // Check environment variables as fallback
  switch (provider) {
    case 'google':
      return !!import.meta.env.VITE_GOOGLE_API_KEY;
    case 'openai':
      return !!import.meta.env.VITE_OPENAI_API_KEY;
    case 'azure-openai':
      return !!(import.meta.env.VITE_AZURE_OPENAI_API_KEY && import.meta.env.VITE_AZURE_OPENAI_ENDPOINT);
    case 'bedrock-openai':
      return !!import.meta.env.VITE_BEDROCK_PROXY_URL;
    default:
      return false;
  }
};

// Get the effective API key (user-provided or environment)
export const getEffectiveApiKey = (provider: Provider, configApiKey?: string): string | undefined => {
  // Use user-provided API key if valid
  if (configApiKey && configApiKey.trim().length > 0 && validateApiKey(provider, configApiKey)) {
    return configApiKey;
  }
  
  // Fall back to environment variables
  switch (provider) {
    case 'google':
      return import.meta.env.VITE_GOOGLE_API_KEY;
    case 'openai':
      return import.meta.env.VITE_OPENAI_API_KEY;
    case 'azure-openai':
      return import.meta.env.VITE_AZURE_OPENAI_API_KEY;
    case 'bedrock-openai':
      return import.meta.env.VITE_BEDROCK_PROXY_URL;
    default:
      return undefined;
  }
};