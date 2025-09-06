import { BskyAgent } from '@atproto/api'
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import CONFIG from '../../config/settings'
import { collectInteractionScores, rankInteractions } from '../analysis/interactions'

export const shortname = 'vectorspace'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  const agent = new BskyAgent({ service: 'https://bsky.social' })
  if (process.env.BSKY_USERNAME && process.env.BSKY_PASSWORD) {
    await agent.login({
      identifier: process.env.BSKY_USERNAME,
      password: process.env.BSKY_PASSWORD,
    })
  }

  const scores = await collectInteractionScores(agent)
  const topDids = rankInteractions(scores)

  const feed: { post: string }[] = []
  for (const did of topDids) {
    const { data } = await agent.app.bsky.feed.getAuthorFeed({ actor: did, limit: 10 })
    for (const item of data.feed) {
      feed.push({ post: item.post.uri })
      if (feed.length >= params.limit) break
    }
    if (feed.length >= params.limit) break
  }

  return { cursor: undefined, feed }
}
