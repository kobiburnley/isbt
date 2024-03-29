import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'

jest.setTimeout(15000)

describe('build', () => {
  it('runs command on workspace-1', async () => {
    await runIsbtCommandOnFixture('workspace-1', 'build')
  })

  it('runs command on bundle-browser', async () => {
    await runIsbtCommandOnFixture('bundle-browser', 'build')
  })
})
