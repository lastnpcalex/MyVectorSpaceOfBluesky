import { BskyAgent } from '@atproto/api'
import CONFIG from '../../config/settings'
import { collectInteractionScores, rankInteractions } from '../analysis/interactions'

export async function updateInteractionList() {
  const agent = new BskyAgent({ service: 'https://bsky.social' })
  if (!process.env.BSKY_USERNAME || !process.env.BSKY_PASSWORD) {
    throw new Error('BSKY_USERNAME and BSKY_PASSWORD env vars required')
  }
  await agent.login({
    identifier: process.env.BSKY_USERNAME,
    password: process.env.BSKY_PASSWORD,
  })

  const scores = await collectInteractionScores(agent)
  const topDids = rankInteractions(scores)

  const listRes = await agent.app.bsky.graph.list.create(
    { repo: agent.session?.did ?? '', collection: 'app.bsky.graph.list' },
    {
      name: CONFIG.LIST_NAME,
      description: CONFIG.LIST_DESCRIPTION,
      purpose: 'app.bsky.graph.defs#curatelist',
      createdAt: new Date().toISOString(),
    },
  )
  const listUri = listRes.uri

  for (const did of topDids) {
    await agent.app.bsky.graph.listitem.create(
      { repo: agent.session?.did ?? '', collection: 'app.bsky.graph.listitem' },
      {
        subject: did,
        list: listUri,
        createdAt: new Date().toISOString(),
      },
    )
  }
}
