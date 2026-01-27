/**
 * Prompt Cache and Storage
 * 
 * Provides in-memory caching and optional persistence for generated prompts.
 * This allows reuse of prompts without regenerating them, and tracking of prompt usage.
 */

import type { StoredPrompt, ProcessedPrompt, PromptTemplateType } from './types';

/**
 * In-memory cache for prompts
 */
const promptCache = new Map<string, StoredPrompt>();

/**
 * Generate a unique cache key from template info and input hash
 */
function generateCacheKey(templateId: string, inputHash: string): string {
  return `${templateId}:${inputHash}`;
}

/**
 * Generate a unique ID for stored prompts
 */
function generatePromptId(): string {
  return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store a processed prompt in the cache
 */
export function cachePrompt(
  processed: ProcessedPrompt,
  variables: Record<string, unknown>
): StoredPrompt {
  const cacheKey = generateCacheKey(processed.template.id, processed.hash);
  
  // Check if already cached
  const existing = promptCache.get(cacheKey);
  if (existing) {
    // Update use count and last used time
    existing.useCount++;
    existing.lastUsedAt = new Date().toISOString();
    return existing;
  }
  
  // Create new stored prompt
  const stored: StoredPrompt = {
    id: generatePromptId(),
    templateId: processed.template.id,
    templateVersion: processed.template.version,
    inputHash: processed.hash,
    variables,
    promptText: processed.text,
    generatedAt: new Date().toISOString(),
    useCount: 1,
    lastUsedAt: new Date().toISOString(),
  };
  
  promptCache.set(cacheKey, stored);
  return stored;
}

/**
 * Get a cached prompt if it exists
 */
export function getCachedPrompt(
  templateId: string,
  inputHash: string
): StoredPrompt | null {
  const cacheKey = generateCacheKey(templateId, inputHash);
  const cached = promptCache.get(cacheKey);
  
  if (cached) {
    // Update usage stats
    cached.useCount++;
    cached.lastUsedAt = new Date().toISOString();
    return cached;
  }
  
  return null;
}

/**
 * Get all cached prompts
 */
export function getAllCachedPrompts(): StoredPrompt[] {
  return Array.from(promptCache.values());
}

/**
 * Get cached prompts by template type
 */
export function getCachedPromptsByType(type: PromptTemplateType): StoredPrompt[] {
  return Array.from(promptCache.values()).filter(p => 
    p.templateId.startsWith(type)
  );
}

/**
 * Get most used prompts
 */
export function getMostUsedPrompts(limit: number = 10): StoredPrompt[] {
  return Array.from(promptCache.values())
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, limit);
}

/**
 * Get recently used prompts
 */
export function getRecentPrompts(limit: number = 10): StoredPrompt[] {
  return Array.from(promptCache.values())
    .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
    .slice(0, limit);
}

/**
 * Clear a specific prompt from cache
 */
export function clearCachedPrompt(templateId: string, inputHash: string): boolean {
  const cacheKey = generateCacheKey(templateId, inputHash);
  return promptCache.delete(cacheKey);
}

/**
 * Clear all cached prompts
 */
export function clearAllCache(): void {
  promptCache.clear();
}

/**
 * Clear cached prompts older than specified age (in milliseconds)
 */
export function clearOldPrompts(maxAge: number): number {
  const now = Date.now();
  let cleared = 0;
  
  for (const [key, prompt] of promptCache.entries()) {
    const age = now - new Date(prompt.lastUsedAt).getTime();
    if (age > maxAge) {
      promptCache.delete(key);
      cleared++;
    }
  }
  
  return cleared;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalPrompts: number;
  totalUses: number;
  byType: Record<string, number>;
  oldestPrompt: string | null;
  newestPrompt: string | null;
} {
  const prompts = Array.from(promptCache.values());
  
  const byType: Record<string, number> = {};
  let totalUses = 0;
  let oldest: StoredPrompt | null = null;
  let newest: StoredPrompt | null = null;
  
  for (const prompt of prompts) {
    const type = prompt.templateId.split('-')[0];
    byType[type] = (byType[type] || 0) + 1;
    totalUses += prompt.useCount;
    
    if (!oldest || new Date(prompt.generatedAt) < new Date(oldest.generatedAt)) {
      oldest = prompt;
    }
    if (!newest || new Date(prompt.generatedAt) > new Date(newest.generatedAt)) {
      newest = prompt;
    }
  }
  
  return {
    totalPrompts: prompts.length,
    totalUses,
    byType,
    oldestPrompt: oldest?.generatedAt || null,
    newestPrompt: newest?.generatedAt || null,
  };
}

/**
 * Export cache as JSON (for persistence)
 */
export function exportCache(): string {
  const prompts = Array.from(promptCache.values());
  return JSON.stringify(prompts, null, 2);
}

/**
 * Import cache from JSON (for persistence)
 */
export function importCache(json: string): number {
  try {
    const prompts: StoredPrompt[] = JSON.parse(json);
    let imported = 0;
    
    for (const prompt of prompts) {
      const cacheKey = generateCacheKey(prompt.templateId, prompt.inputHash);
      if (!promptCache.has(cacheKey)) {
        promptCache.set(cacheKey, prompt);
        imported++;
      }
    }
    
    return imported;
  } catch (error) {
    console.error('Failed to import cache:', error);
    return 0;
  }
}
