import { updateInteractionList } from '../src/lists/updater'

updateInteractionList().catch((err) => {
  console.error(err)
  process.exit(1)
})
