export type ProviderKey = 'openai' | 'anthropic' | 'google' | 'local';

export const DEFAULT_PROVIDER_MODELS: Record<ProviderKey, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4.1', 'o3-mini'],
  anthropic: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
  local: ['llama-3.1-8b', 'mistral-7b-instruct', 'phi-3-mini'],
};

export const STORAGE_KEYS = {
  provider: 'nexira_provider',
  defaultModel: 'nexira_default_model',
  modelsEnabled: 'nexira_models_enabled',
  customModels: 'nexira_models_custom',
} as const;

