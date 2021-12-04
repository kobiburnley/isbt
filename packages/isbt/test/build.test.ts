import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'

jest.setTimeout(15000)

describe('build', () => {
  it('runs command', async () => {
    await Promise.all([
      runIsbtCommandOnFixture('workspace-1', 'build'),
      runIsbtCommandOnFixture('bundle-browser', 'build'),
    ])
  })
})
