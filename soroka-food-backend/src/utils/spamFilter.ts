/**
 * Spam filter utility
 * Checks comments for spam patterns
 */

import prisma from '../config/database';

interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

interface SpamFilterSettings {
  customKeywords: string[];
  enableKeywordFilter: boolean;
  enableUrlFilter: boolean;
  enableCapsFilter: boolean;
  enableRepetitiveFilter: boolean;
  enableDuplicateFilter: boolean;
  maxUrls: number;
  capsPercentage: number;
}

// Common spam keywords (built-in)
const DEFAULT_SPAM_KEYWORDS = [
  'viagra', 'cialis', 'casino', 'poker', 'lottery', 'winner',
  'click here', 'buy now', 'free money', 'earn money',
  'make money online', 'work from home', 'weight loss',
  'dating', 'xxx', 'porn', 'sex', 'adult'
];

// Russian spam keywords (built-in)
const DEFAULT_RUSSIAN_SPAM_KEYWORDS = [
  'виагра', 'казино', 'заработок', 'кредит', 'займ',
  'ставки', 'букмекер', 'порно', 'секс', 'знакомства',
  'продвижение сайта', 'раскрутка сайта'
];

const DEFAULT_KEYWORDS = [...DEFAULT_SPAM_KEYWORDS, ...DEFAULT_RUSSIAN_SPAM_KEYWORDS];

/**
 * Get spam filter settings from database
 */
async function getSpamFilterSettings(): Promise<SpamFilterSettings> {
  let settings = await prisma.spamFilterSettings.findUnique({
    where: { id: 1 }
  });

  // Create default settings if not exist
  if (!settings) {
    settings = await prisma.spamFilterSettings.create({
      data: {
        id: 1,
        customKeywords: [],
        enableKeywordFilter: true,
        enableUrlFilter: true,
        enableCapsFilter: true,
        enableRepetitiveFilter: true,
        enableDuplicateFilter: true,
        maxUrls: 2,
        capsPercentage: 80
      }
    });
  }

  return {
    customKeywords: settings.customKeywords,
    enableKeywordFilter: settings.enableKeywordFilter,
    enableUrlFilter: settings.enableUrlFilter,
    enableCapsFilter: settings.enableCapsFilter,
    enableRepetitiveFilter: settings.enableRepetitiveFilter,
    enableDuplicateFilter: settings.enableDuplicateFilter,
    maxUrls: settings.maxUrls,
    capsPercentage: settings.capsPercentage
  };
}

/**
 * Check if text contains spam keywords
 */
function containsSpamKeywords(text: string, customKeywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  const allKeywords = [...DEFAULT_KEYWORDS, ...customKeywords.map(k => k.toLowerCase())];
  return allKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Count URLs in text
 */
function countUrls(text: string): number {
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|ru|net|org|info|biz|co)[^\s]*)/gi;
  const matches = text.match(urlPattern);
  return matches ? matches.length : 0;
}

/**
 * Check if text is repetitive (same characters or words repeated)
 */
function isRepetitive(text: string): boolean {
  // Check for repeated characters (e.g., "aaaaaaa", "!!!!!!")
  const repeatedChars = /(.)\1{5,}/;
  if (repeatedChars.test(text)) return true;

  // Check for repeated words
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);

  // If more than 70% of words are duplicates
  if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
    return true;
  }

  return false;
}

/**
 * Check if text is all caps (spam indicator)
 */
function isAllCaps(text: string, capsPercentage: number): boolean {
  const letters = text.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  if (letters.length < 10) return false; // Too short to judge

  const uppercase = text.replace(/[^A-ZА-ЯЁ]/g, '');
  return uppercase.length / letters.length > (capsPercentage / 100);
}

/**
 * Main spam check function
 */
export async function checkForSpam(text: string, author: string, email?: string): Promise<SpamCheckResult> {
  const settings = await getSpamFilterSettings();

  // Check for spam keywords
  if (settings.enableKeywordFilter && containsSpamKeywords(text, settings.customKeywords)) {
    return { isSpam: true, reason: 'Contains spam keywords' };
  }

  // Check author name for spam patterns
  if (settings.enableKeywordFilter && containsSpamKeywords(author, settings.customKeywords)) {
    return { isSpam: true, reason: 'Spam keywords in author name' };
  }

  // Check for too many URLs
  if (settings.enableUrlFilter) {
    const urlCount = countUrls(text);
    if (urlCount > settings.maxUrls) {
      return { isSpam: true, reason: `Contains ${urlCount} URLs (max ${settings.maxUrls})` };
    }

    // Check for very short comments with URLs
    if (text.length < 20 && urlCount > 0) {
      return { isSpam: true, reason: 'Very short comment with URL' };
    }
  }

  // Check for repetitive text
  if (settings.enableRepetitiveFilter && isRepetitive(text)) {
    return { isSpam: true, reason: 'Repetitive text pattern' };
  }

  // Check for all caps
  if (settings.enableCapsFilter && isAllCaps(text, settings.capsPercentage)) {
    return { isSpam: true, reason: 'Excessive caps text' };
  }

  return { isSpam: false };
}

/**
 * Check for duplicate comment (same text from same author)
 */
export async function checkDuplicateComment(
  text: string,
  author: string,
  prismaClient: any
): Promise<boolean> {
  const settings = await getSpamFilterSettings();

  // If duplicate filter is disabled, skip check
  if (!settings.enableDuplicateFilter) {
    return false;
  }

  const recentDuplicate = await prismaClient.comment.findFirst({
    where: {
      text,
      author,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });

  return !!recentDuplicate;
}
