/**
 * Spam filter utility
 * Checks comments for spam patterns
 */

interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

// Common spam keywords (can be extended)
const SPAM_KEYWORDS = [
  'viagra', 'cialis', 'casino', 'poker', 'lottery', 'winner',
  'click here', 'buy now', 'free money', 'earn money',
  'make money online', 'work from home', 'weight loss',
  'dating', 'xxx', 'porn', 'sex', 'adult'
];

// Russian spam keywords
const RUSSIAN_SPAM_KEYWORDS = [
  'виагра', 'казино', 'заработок', 'кредит', 'займ',
  'ставки', 'букмекер', 'порно', 'секс', 'знакомства',
  'продвижение сайта', 'раскрутка сайта'
];

const ALL_SPAM_KEYWORDS = [...SPAM_KEYWORDS, ...RUSSIAN_SPAM_KEYWORDS];

/**
 * Check if text contains spam keywords
 */
function containsSpamKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ALL_SPAM_KEYWORDS.some(keyword => lowerText.includes(keyword));
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
function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  if (letters.length < 10) return false; // Too short to judge

  const uppercase = text.replace(/[^A-ZА-ЯЁ]/g, '');
  return uppercase.length / letters.length > 0.8; // 80% uppercase
}

/**
 * Main spam check function
 */
export function checkForSpam(text: string, author: string, email?: string): SpamCheckResult {
  // Check for spam keywords
  if (containsSpamKeywords(text)) {
    return { isSpam: true, reason: 'Contains spam keywords' };
  }

  // Check for too many URLs (more than 2)
  const urlCount = countUrls(text);
  if (urlCount > 2) {
    return { isSpam: true, reason: `Contains ${urlCount} URLs` };
  }

  // Check for repetitive text
  if (isRepetitive(text)) {
    return { isSpam: true, reason: 'Repetitive text pattern' };
  }

  // Check for all caps
  if (isAllCaps(text)) {
    return { isSpam: true, reason: 'All caps text' };
  }

  // Check for very short comments with URLs
  if (text.length < 20 && urlCount > 0) {
    return { isSpam: true, reason: 'Very short comment with URL' };
  }

  // Check author name for spam patterns
  if (containsSpamKeywords(author)) {
    return { isSpam: true, reason: 'Spam keywords in author name' };
  }

  return { isSpam: false };
}

/**
 * Check for duplicate comment (same text from same author)
 */
export async function checkDuplicateComment(
  text: string,
  author: string,
  prisma: any
): Promise<boolean> {
  const recentDuplicate = await prisma.comment.findFirst({
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
