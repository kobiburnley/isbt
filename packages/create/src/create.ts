import { promises as fs } from 'fs'
export async function create(cwd: string) {
  if (!cwd) {
    throw new Error('process.env.INIT_CWD is empty')
  }

  fs.readdir(cwd)
}
