export const BETA_MODE = process.env.NEXT_PUBLIC_BETA_MODE === 'true'
export const BETA_EXPERT_SLOTS = parseInt(process.env.NEXT_PUBLIC_BETA_EXPERT_SLOTS || '20', 10)

export const PRICES = {
  guided: 29,
  human_assisted: 79,
}

export function getBetaDisplayPrice(tier: 'guided' | 'human_assisted') {
  return {
    original: PRICES[tier],
    current: BETA_MODE ? 0 : PRICES[tier],
    isBeta: BETA_MODE,
  }
}
