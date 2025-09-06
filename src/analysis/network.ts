import { BskyAgent } from '@atproto/api'
import CONFIG from '../../config/settings'
import { collectInteractionScores, rankInteractions } from './interactions'

// Build two-hop network starting from central account
export async function expandNetwork(agent: BskyAgent): Promise<string[]> {
  const firstHopScores = await collectInteractionScores(agent)
  const topFirstHop = rankInteractions(firstHopScores)

  const network = new Set<string>(topFirstHop)
  for (const did of topFirstHop) {
    const secondHopScores = await collectInteractionScores(agent)
    const topSecond = rankInteractions(secondHopScores)
    for (const second of topSecond) {
      if (second !== CONFIG.CENTRAL_ACCOUNT.did) {
        network.add(second)
      }
    }
  }
  return Array.from(network)
}
