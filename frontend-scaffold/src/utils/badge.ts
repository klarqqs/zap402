export type BadgeTier = 'new' | 'bronze' | 'silver' | 'gold' | 'diamond';

/**
 * Maps a numeric credit score to a membership tier.
 * 
 * @param score - Credit score (0-100)
 * @returns {BadgeTier} The determined tier
 */
export const getTierFromScore = (score: number | string): BadgeTier => {
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  
  if (numericScore >= 80) return 'diamond';
  if (numericScore >= 60) return 'gold';
  if (numericScore >= 40) return 'silver';
  if (numericScore >= 20) return 'bronze';
  return 'new';
};
