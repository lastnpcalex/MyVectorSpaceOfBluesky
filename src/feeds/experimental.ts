import { BskyAgent } from '@atproto/api'
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import CONFIG from '../../config/settings'
import { expandNetwork } from '../analysis/network'

export const shortname = 'vectorspace-experimental'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  const agent = new BskyAgent({ service: 'https://bsky.social' })
  if (process.env.BSKY_USERNAME && process.env.BSKY_PASSWORD) {
    await agent.login({
      identifier: process.env.BSKY_USERNAME,
      password: process.env.BSKY_PASSWORD,
    })
  }

  const network = await expandNetwork(agent)
  const feed: { post: string }[] = []
  for (const did of network) {
    const { data } = await agent.app.bsky.feed.getAuthorFeed({ actor: did, limit: 5 })
    for (const item of data.feed) {
      feed.push({ post: item.post.uri })
      if (feed.length >= params.limit) break
    }
    if (feed.length >= params.limit) break
  }

  return { cursor: undefined, feed }
}
