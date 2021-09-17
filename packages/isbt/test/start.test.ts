import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'
import { PassThrough } from 'stream'

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
    runIsbtCommandOnFixture('workspace-1', 'start', { stdout })
    await noErrorsPromise
  })
})
