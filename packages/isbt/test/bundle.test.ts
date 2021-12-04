import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'

jest.setTimeout(15000)

describe('bundle', () => {
  it('runs command', async () => {
    await Promise.all([
      runIsbtCommandOnFixture('bundle-node/packages/bundle-node', 'bundle'),
      runIsbtCommandOnFixture(
        'bundle-browser/packages/bundle-browser',
        'bundle',
      ),
    ])
  })
})
