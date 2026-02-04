/**
 * Shared API request/response types
 */

// Password Generator
export interface PasswordGeneratorRequest {
  length: number;
  options: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
}

export interface PasswordGeneratorResponse {
  success: boolean;
  passwords: string[];
}

// Song Recommender
export interface SongRecommenderRequest {
  action: 'recommend-songs';
  mood?: string;
  language?: string;
  genres?: string[];
  excludedSongs?: string[];
  model?: string;
}

export interface Song {
  title: string;
  artist: string;
  reason: string;
}

export interface SongRecommenderResponse {
  songs: Song[];
}

// Translate
export interface TranslateRequest {
  input?: string;
  direction?: 'vi-en' | 'en-vi';
  tones?: string[];
  model?: string;
}

export interface TranslateResponse {
  outputText: string;
}

// URL Shortener
export interface UrlShortenerRequest {
  originalUrl: string;
  autoDelete?: boolean;
  ttlDays?: number;
}

export interface UrlShortenerResponse {
  shortUrl: string;
  shortCode?: string;
  originalUrl?: string;
  createdAt?: string;
  expiresAt?: string;
}

// Feedback
export interface FeedbackRequest {
  type: 'bug' | 'feature' | 'general';
  message: string;
  email?: string;
}

export interface FeedbackResponse {
  success: boolean;
}

// Templates
export interface TemplatesRequest {
  filename: string;
}

export interface TemplatesResponse {
  success: boolean;
  content: string;
}

// AI Chat Message (shared across AI routes)
export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
