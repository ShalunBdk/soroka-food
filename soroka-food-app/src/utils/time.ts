/**
 * Format minutes to human-readable time string
 * Examples:
 * 30 → "30 мин"
 * 60 → "1 ч"
 * 90 → "1 ч 30 мин"
 * 125 → "2 ч 5 мин"
 */
export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${mins} мин`;
};
