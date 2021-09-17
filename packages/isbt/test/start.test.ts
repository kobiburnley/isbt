import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'
import { PassThrough } from 'stream'
import { EventEmitter } from 'events'

jest.setTimeout(15000)

describe('start', () => {
  it('runs command', async () => {
    const stdout = new PassThrough()
    const events = new EventEmitter()

    const noErrorsPromise = new Promise<void>((resolve, reject) => {
      let data = ''

      setTimeout(() => {
        if (!data.includes('Found 0 errors. Watching for file changes.')) {
          events.emit('kill')
          reject(new Error(data))
        }
      })

      stdout.on('data', (e) => {
        data += e.toString()
        if (data.includes('Found 0 errors. Watching for file changes.')) {
          events.emit('kill')
          resolve()
        }
      })
    })
    runIsbtCommandOnFixture('workspace-1', 'start', {
      stdout,
      events,
    })
    await noErrorsPromise
  })
})
