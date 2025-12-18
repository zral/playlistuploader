/**
 * AI Service for Playlist Generation
 * Supports multiple AI providers with fallback
 */

import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import logger from '../utils/logger.js';
import { buildMessages, PlaylistOptions, AIMessage } from '../utils/aiPrompts.js';

// Configure axios retry for AI API calls
axiosRetry(axios, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 ||
      (error.response?.status !== undefined && error.response.status >= 500 && error.response.status < 600);
  }
});

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ServiceStatus {
  primaryProvider: string;
  fallbackProvider: string;
  configured: {
    openrouter: boolean;
    groq: boolean;
    openai: boolean;
  };
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(messages: AIMessage[], model?: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  logger.info('Calling OpenRouter API', { model: model || 'default' });

  try {
    const response = await axios.post<OpenRouterResponse>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model || process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
        messages: messages,
        temperature: 0.8,
        max_tokens: 1500,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost',
          'X-Title': 'Listify'
        },
        timeout: 30000
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenRouter API');
    }

    return content;
  } catch (error: any) {
    if (error.response) {
      // Log detailed error information from OpenRouter
      logger.error('OpenRouter API error', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });

      // Throw a more descriptive error
      const errorMessage = error.response.data?.error?.message || error.response.data?.error || error.message;
      throw new Error(`OpenRouter API error (${error.response.status}): ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Call Groq API
 */
async function callGroq(messages: AIMessage[], model?: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  logger.info('Calling Groq API', { model: model || 'default' });

  const response = await axios.post<GroqResponse>(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: model || process.env.GROQ_MODEL || 'llama3-70b-8192',
      messages: messages,
      temperature: 0.8,
      max_tokens: 1500,
      top_p: 0.9
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  if (!response.data.choices || response.data.choices.length === 0) {
    throw new Error('No response from Groq API');
  }

  const content = response.data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from Groq API');
  }

  return content;
}

/**
 * Call OpenAI API directly
 */
async function callOpenAI(messages: AIMessage[], model?: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  logger.info('Calling OpenAI API', { model: model || 'default' });

  const response = await axios.post<OpenRouterResponse>(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model || 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.8,
      max_tokens: 1500,
      top_p: 0.9
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  if (!response.data.choices || response.data.choices.length === 0) {
    throw new Error('No response from OpenAI API');
  }

  const content = response.data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI API');
  }

  return content;
}

export interface ParsedPlaylist {
  playlistName: string;
  playlist: string;
}

/**
 * Parse and validate AI response
 */
function parsePlaylistResponse(content: string): ParsedPlaylist {
  const allLines = content.split('\n').map(line => line.trim());

  // Extract playlist name (first non-empty line)
  let playlistName = 'My Playlist';
  let songStartIndex = 0;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    if (line && line.length > 0) {
      // First non-empty line is the playlist name (if it doesn't contain " - ")
      if (!line.includes(' - ')) {
        playlistName = line;
        songStartIndex = i + 1;
        break;
      } else {
        // First line is already a song, use default name
        break;
      }
    }
  }

  // Parse songs (skip playlist name and any blank lines)
  const lines = allLines
    .slice(songStartIndex)
    .filter(line => line.length > 0)
    .map(line => {
      // Remove numbering like "1. ", "1) ", "- ", "* "
      return line.replace(/^[\d]+[\.\)]\s*/, '')
                 .replace(/^[\-\*]\s*/, '')
                 .trim();
    })
    .filter(line => {
      // Validate format: "Artist - Title"
      return line.includes(' - ') && line.split(' - ').length === 2;
    });

  if (lines.length === 0) {
    throw new Error('AI response contained no valid songs in "Artist - Title" format');
  }

  logger.info('Parsed AI playlist response', {
    playlistName,
    totalSongs: lines.length,
    firstSong: lines[0],
    lastSong: lines[lines.length - 1]
  });

  return {
    playlistName,
    playlist: lines.join('\n')
  };
}

/**
 * Generate playlist using AI
 * @param {string} description - Playlist description
 * @param {object} options - { songCount?, durationMinutes? }
 * @returns {ParsedPlaylist} Object with playlistName and playlist
 */
export async function generatePlaylist(description: string, options: PlaylistOptions = {}): Promise<ParsedPlaylist> {
  const { songCount, durationMinutes } = options;

  // Validation
  if (!description || description.trim().length === 0) {
    throw new Error('Playlist description is required');
  }

  if (!songCount && !durationMinutes) {
    throw new Error('Either songCount or durationMinutes must be provided');
  }

  const maxSongs = parseInt(process.env.AI_MAX_SONGS_PER_REQUEST || '50');
  const maxDuration = parseInt(process.env.AI_MAX_DURATION_MINUTES || '180');

  if (songCount && (songCount < 1 || songCount > maxSongs)) {
    throw new Error(`Song count must be between 1 and ${maxSongs}`);
  }

  if (durationMinutes && (durationMinutes < 5 || durationMinutes > maxDuration)) {
    throw new Error(`Duration must be between 5 and ${maxDuration} minutes`);
  }

  // Build messages
  const messages = buildMessages(description, { songCount, durationMinutes });

  // Determine provider
  const provider = process.env.AI_PROVIDER || 'openrouter';
  const fallbackProvider = process.env.AI_FALLBACK_PROVIDER;

  let content: string;
  let usedProvider = provider;

  try {
    // Try primary provider
    if (provider === 'openrouter') {
      content = await callOpenRouter(messages);
    } else if (provider === 'groq') {
      content = await callGroq(messages);
    } else if (provider === 'openai') {
      content = await callOpenAI(messages);
    } else {
      throw new Error(`Unknown AI provider: ${provider}`);
    }
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'AI playlist generation - primary provider',
      provider: provider
    });

    // Try fallback provider
    if (fallbackProvider && fallbackProvider !== provider) {
      logger.info('Attempting fallback provider', { fallbackProvider });
      usedProvider = fallbackProvider;

      try {
        if (fallbackProvider === 'openrouter') {
          content = await callOpenRouter(messages);
        } else if (fallbackProvider === 'groq') {
          content = await callGroq(messages);
        } else if (fallbackProvider === 'openai') {
          content = await callOpenAI(messages);
        } else {
          throw new Error('Invalid fallback provider');
        }
      } catch (fallbackError) {
        logger.logError(fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)), {
          context: 'AI playlist generation - fallback provider',
          provider: fallbackProvider
        });
        throw new Error('AI service temporarily unavailable. Please try again later.');
      }
    } else {
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }
  }

  // Parse and validate response
  const result = parsePlaylistResponse(content);

  logger.info('AI playlist generated successfully', {
    provider: usedProvider,
    description: description.substring(0, 50),
    playlistName: result.playlistName,
    songCount: result.playlist.split('\n').length
  });

  return result;
}

/**
 * Get AI service status
 */
export function getServiceStatus(): ServiceStatus {
  return {
    primaryProvider: process.env.AI_PROVIDER || 'openrouter',
    fallbackProvider: process.env.AI_FALLBACK_PROVIDER || 'none',
    configured: {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      openai: !!process.env.OPENAI_API_KEY
    }
  };
}
