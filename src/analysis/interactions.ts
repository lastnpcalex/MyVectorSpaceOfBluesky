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

function extractQuotedDid(embed: any): string | undefined {
  if (!embed) return undefined
  if (embed.$type === 'app.bsky.embed.record#view') {
    const rec = (embed as any).record
    return rec?.author?.did
  }
  if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
    const rec = (embed as any).record?.record
    return rec?.author?.did
  }
  return undefined
}

// fetch interactions for central account and compute scores
export async function collectInteractionScores(
  agent: BskyAgent,
  since = new Date(Date.now() - CONFIG.ANALYSIS_PERIOD_DAYS * 24 * 60 * 60 * 1000),
): Promise<InteractionScores> {
  const scores: InteractionScores = {}
  const inbound = new Set<string>()
  const outbound = new Set<string>()

  const addScore = (did: string, weight: number, dir: 'in' | 'out') => {
    if (!did || did === CONFIG.CENTRAL_ACCOUNT.did) return
    scores[did] = (scores[did] || 0) + weight
    if (dir === 'in') inbound.add(did)
    else outbound.add(did)
  }

  // likes from central account
  let cursor: string | undefined
  let done = false
  while (!done) {
    const { data } = await agent.app.bsky.feed.getActorLikes({
      actor: CONFIG.CENTRAL_ACCOUNT.did,
      cursor,
      limit: 100,
    })
    for (const item of data.feed) {
      const likedAt = new Date(item.post.indexedAt)
      if (likedAt < since) {
        done = true
        break
      }
      addScore(item.post.author.did, WEIGHTS.like, 'out')
    }
    cursor = data.cursor
    if (!cursor) break
  }

  // posts from central account (replies, quotes, reposts)
  cursor = undefined
  done = false
  while (!done) {
    const { data } = await agent.app.bsky.feed.getAuthorFeed({
      actor: CONFIG.CENTRAL_ACCOUNT.did,
      cursor,
      limit: 100,
    })
    for (const item of data.feed) {
      const ts =
        item.reason?.$type === 'app.bsky.feed.defs#reasonRepost'
          ? new Date((item.reason as any).indexedAt)
          : new Date(item.post.indexedAt)
      if (ts < since) {
        done = true
        break
      }

      // replies by central account
      if (
        item.post.author.did === CONFIG.CENTRAL_ACCOUNT.did &&
        item.reply?.parent &&
        (item.reply.parent as any).author?.did
      ) {
        addScore((item.reply.parent as any).author.did, WEIGHTS.reply, 'out')
      }

      // quotes by central account
      if (item.post.author.did === CONFIG.CENTRAL_ACCOUNT.did) {
        const quoted = extractQuotedDid(item.post.embed)
        if (quoted) addScore(quoted, WEIGHTS.quote, 'out')
      }

      // reposts by central account
      if (item.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
        addScore(item.post.author.did, WEIGHTS.repost, 'out')
      }
    }
    cursor = data.cursor
    if (!cursor) break
  }

  // replies and quotes to central account via notifications
  cursor = undefined
  done = false
  while (!done) {
    const { data } = await agent.app.bsky.notification.listNotifications({
      limit: 100,
      cursor,
    })
    for (const notif of data.notifications) {
      const ts = new Date(notif.indexedAt)
      if (ts < since) {
        done = true
        break
      }
      if (notif.reason === 'reply') {
        addScore(notif.author.did, WEIGHTS.reply, 'in')
      } else if (notif.reason === 'quote') {
        addScore(notif.author.did, WEIGHTS.quote, 'in')
      }
    }
    cursor = data.cursor
    if (!cursor) break
  }

  // boost scores for mutual interactions
  for (const did of Object.keys(scores)) {
    if (inbound.has(did) && outbound.has(did)) {
      scores[did] = Math.round(scores[did] * 1.5)
    }
  }

  return scores
}

export function rankInteractions(scores: InteractionScores): string[] {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, CONFIG.TOP_USERS_COUNT)
    .map(([did]) => did)
}
