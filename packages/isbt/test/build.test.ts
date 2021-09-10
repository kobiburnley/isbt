import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'

describe('build', () => {
  it('runs command', async () => {
    await runIsbtCommandOnFixture('workspace-1', 'build')
  })
})
