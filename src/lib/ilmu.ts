import { createOpenAI } from '@ai-sdk/openai';
import OpenAI from 'openai';

// Vercel AI SDK Provider
export const ilmu = createOpenAI({
  apiKey: process.env.ILMU_API_KEY,
  baseURL: 'https://api.ilmu.ai/v1',
});

// Standard OpenAI Client (just in case)
export const ilmuClient = new OpenAI({
  apiKey: process.env.ILMU_API_KEY,
  baseURL: 'https://api.ilmu.ai/v1',
});

// Default models
export const ILMU_MODEL = 'nemo-super'; // High quality model
export const ILMU_FAST_MODEL = 'ilmu-nemo-nano'; // Fast model
