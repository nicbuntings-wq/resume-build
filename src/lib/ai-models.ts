/**
 * Centralized AI Model Management
 * This file contains all AI model and provider configurations used throughout the application
 */

import { ServiceName } from './types'

// ========================
// Type Definitions
// ========================

export interface AIProvider {
  id: ServiceName
  name: string
  apiLink: string
  logo?: string
  envKey: string
  sdkInitializer: string
  unstable?: boolean
}

export interface AIModel {
  id: string
  name: string
  provider: ServiceName
  features: {
    isFree?: boolean
    isRecommended?: boolean
    isUnstable?: boolean
    maxTokens?: number
    supportsVision?: boolean
    supportsTools?: boolean
    isPro?: boolean
  }
  availability: {
    requiresApiKey: boolean
    requiresPro: boolean
  }
}

export interface ApiKey {
  service: ServiceName
  key: string
  addedAt: string
}

export interface AIConfig {
  model: string
  apiKeys: ApiKey[]
}

export interface GroupedModels {
  provider: ServiceName
  name: string
  models: AIModel[]
}

// ========================
// Provider Configurations
// ========================

export const PROVIDERS: Partial<Record<ServiceName, AIProvider>> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiLink: 'https://platform.openai.com/api-keys',
    logo: '/logos/chat-gpt-logo.png',
    envKey: 'OPENAI_API_KEY',
    sdkInitializer: 'openai',
    unstable: false
  }
}

// ========================
// Model Definitions
// ========================

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'Pro: Newest Model', // <— UI label
    provider: 'openai',
    features: {
      isPro: true,
      isRecommended: true,
      isUnstable: false,
      maxTokens: 128000,
      supportsVision: true,
      supportsTools: true
    },
    availability: { requiresApiKey: true, requiresPro: true }
  },
  {
    id: 'gpt-4.1-nano',
    name: 'Free: Older Model', // <— UI label
    provider: 'openai',
    features: {
      isFree: true,
      isUnstable: false,
      maxTokens: 128000,
      supportsVision: false,
      supportsTools: true
    },
    // NOTE: server still needs OPENAI_API_KEY even for "free" users,
    // but you can keep requiresApiKey=false if your UI gating expects it.
    availability: { requiresApiKey: true, requiresPro: false }
  }
]
// ========================
// Default Model Configuration
// ========================

export const DEFAULT_MODELS = {
  PRO_USER: 'gpt-4o',
  FREE_USER: 'gpt-4.1-nano'
} as const

// ========================
// Model Designations for Different Use Cases
// ========================

/**
 * Designated models for specific use cases throughout the application.
 * Change these to update which models are used globally.
 */
export const MODEL_DESIGNATIONS = {
  // Cheap/fast for parsing etc.
  FAST_CHEAP:      'gpt-4.1-nano',
  FAST_CHEAP_FREE: 'gpt-4.1-nano',

  // Frontier/balanced → use 4o everywhere for paid
  FRONTIER:     'gpt-4o',
  FRONTIER_ALT: 'gpt-4o',
  BALANCED:     'gpt-4o',

  // Vision → 4o supports vision
  VISION: 'gpt-4o',

  // Defaults by user type
  DEFAULT_PRO:  'gpt-4o',
  DEFAULT_FREE: 'gpt-4.1-nano'
} as const
// Type for model designations
export type ModelDesignation = keyof typeof MODEL_DESIGNATIONS

// ========================
// Utility Functions
// ========================

/**
 * Get all providers as an array
 */
export function getProvidersArray(): AIProvider[] {
  return Object.values(PROVIDERS)
}

/**
 * Get a model by its ID
 */
export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(model => model.id === id)
}

/**
 * Get a provider by its ID
 */
export function getProviderById(id: ServiceName): AIProvider | undefined {
  return PROVIDERS[id]
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: ServiceName): AIModel[] {
  return AI_MODELS.filter(model => model.provider === provider)
}

/**
 * Check if a provider has its API key set in the environment
 */
function providerEnabledInEnv(p: ServiceName): boolean {
  const envKey = PROVIDERS[p]?.envKey
  return !!(envKey && process.env[envKey])
}

/**
 * Check if a model is available for a user
 */
export function isModelAvailable(
  modelId: string,
  isPro: boolean,
  apiKeys: ApiKey[]
): boolean {
  // Pro users have access to all models
  if (isPro) return true

  const model = getModelById(modelId)
  if (!model) return false

  // Free model (gpt-4.1-nano)
  if (model.features.isFree) return true

  // Check if this is an OpenRouter model (contains forward slash)
  if (modelId.includes('/')) {
    return apiKeys.some(key => key.service === 'openrouter')
  }

  // Check if user has the required API key
  return apiKeys.some(key => key.service === model.provider)
}

/**
 * Get the default model for a user type
 */
export function getDefaultModel(isPro: boolean): string {
  return isPro ? DEFAULT_MODELS.PRO_USER : DEFAULT_MODELS.FREE_USER
}

/**
 * Get the provider for a model
 */
export function getModelProvider(modelId: string): AIProvider | undefined {
  const model = getModelById(modelId)
  if (!model) return undefined
  return getProviderById(model.provider)
}

/**
 * Group models by provider for display
 */
export function groupModelsByProvider(): GroupedModels[] {
  const providerOrder: ServiceName[] = ['openai']; // only OpenAI now
  const grouped = new Map<ServiceName, AIModel[]>();

  AI_MODELS.forEach(model => {
    if (!grouped.has(model.provider)) grouped.set(model.provider, []);
    grouped.get(model.provider)!.push(model);
  });

  return providerOrder
    .map(providerId => {
      const provider = getProviderById(providerId);
      if (!provider) return null;
      return {
        provider: providerId,
        name: provider.name,
        models: grouped.get(providerId) || []
      };
    })
    .filter((group): group is GroupedModels => group !== null && group.models.length > 0);
}

/**
 * Get selectable models for a user
 */
export function getSelectableModels(isPro: boolean, apiKeys: ApiKey[]): AIModel[] {
  return AI_MODELS
    .filter(model => providerEnabledInEnv(model.provider))   // NEW: only show if env key exists
    .filter(model => isModelAvailable(model.id, isPro, apiKeys))
}

/**
 * Determine which SDK to use for a model
 */
export function getModelSDKConfig(modelId: string): { provider: AIProvider; modelId: string } | undefined {
  const model = getModelById(modelId)
  if (!model) return undefined
  
  const provider = getProviderById(model.provider)
  if (!provider) return undefined
  
  return { provider, modelId }
}
