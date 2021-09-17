import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'

jest.setTimeout(15000)

describe('build', () => {
  it('runs command', async () => {
    await runIsbtCommandOnFixture('workspace-1', 'build')
  })
})
