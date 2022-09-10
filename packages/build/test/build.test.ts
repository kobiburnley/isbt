import { runIsbtCommandOnFixture } from './runIsbtCommandOnFixture'

jest.setTimeout(15000)

describe('build', () => {
  it('runs command on bundle-browser', async () => {
    await runIsbtCommandOnFixture('bundle-browser', 'build')
  })
})
