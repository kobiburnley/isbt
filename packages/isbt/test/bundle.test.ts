import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'

jest.setTimeout(15000)

describe('bundle', () => {
  it('runs command', async () => {
    await runIsbtCommandOnFixture('bundle-node', 'bundle')
  })
})
