import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'
import { PassThrough } from 'stream'
import { EventEmitter } from 'events'

jest.useFakeTimers()
jest.setTimeout(15000)

describe('start', () => {
  it('runs command', async () => {
    const stdout = new PassThrough()
    const noErrorsPromise = new Promise<void>((resolve) => {
      let data = ''
      stdout.on('data', (e) => {
        data += e.toString()
        if (data.includes('Found 0 errors. Watching for file changes.')) {
          resolve()
        }
      })
    })
    const events = new EventEmitter()
    runIsbtCommandOnFixture('workspace-1', 'start', {
      stdout,
      events,
    })
    await noErrorsPromise
    events.emit('kill')
  })
})
