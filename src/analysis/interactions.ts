import { BskyAgent } from '@atproto/api'
import CONFIG from '../../config/settings'

export interface InteractionScores {
  [did: string]: number
}

const WEIGHTS = {
  reply: 3,
  like: 1,
  repost: 2,
  quote: 2,
} as const

// fetch interactions for central account and compute scores
export async function collectInteractionScores(
  agent: BskyAgent,
  since = new Date(Date.now() - CONFIG.ANALYSIS_PERIOD_DAYS * 24 * 60 * 60 * 1000),
): Promise<InteractionScores> {
  const scores: InteractionScores = {}
  // TODO: Implement API calls to collect replies, likes, reposts and quotes
  // from CONFIG.CENTRAL_ACCOUNT.did since the provided date
  return scores
}

export function rankInteractions(scores: InteractionScores): string[] {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, CONFIG.TOP_USERS_COUNT)
    .map(([did]) => did)
}
