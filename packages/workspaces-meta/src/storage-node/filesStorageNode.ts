import {
  FilesStorage,
  GetPatternDirsOptions,
  GetPatternFilesOptions,
} from '../storage'
import globby from 'globby'
import path from 'path'
import { promises as fs } from 'fs'

export class FilesStorageNode implements FilesStorage {
  resolvePackageJSON(
    name: string,
    options: { paths: string[] },
  ): Promise<string> {
    return Promise.resolve(require.resolve(`${name}/package.json`, options))
  }

  async resolvePackageDir(
    name: string,
    options: { paths: string[] },
  ): Promise<string> {
    const packageJSONPath = await this.resolvePackageJSON(name, options)

    return path.dirname(packageJSONPath)
  }

  async getPatternDirs(patterns: string[], options: GetPatternDirsOptions) {
    const globPatterns: string[] = []

    const dirs = (
      await Promise.all(
        patterns.map(async (pattern) => {
          const patternAsPath = path.join(options.cwd, pattern)
          const stat = await fs.stat(patternAsPath).catch(() => null)
          if (stat?.isDirectory()) {
            return patternAsPath
          }
          globPatterns.push(pattern)
          return null
        }),
      )
    ).filter((p): p is string => p != null)

    const resolvedDirs = await globby(globPatterns, {
      onlyDirectories: true,
      absolute: true,
      deep: 1,
      cwd: options.cwd,
    })

    return [...dirs, ...resolvedDirs]
  }

  async getPatternFiles(
    pattern: string | string[],
    options: GetPatternFilesOptions,
  ) {
    return globby(pattern, {
      onlyFiles: true,
      absolute: true,
      ...options,
    })
  }
}
