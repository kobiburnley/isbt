import {
  GetProjectReferencePathOptions,
  TSConfigReadOrCreateOptions,
  TSConfigStorage,
  TSConfigUpdateOrCreateOptions,
} from '../storage'
import { defaultsDeep } from 'lodash'
import path from 'path'
import { promises as fs, readFileSync } from 'fs'
import { TSConfig } from '../model'
import { readConfigFile } from 'typescript'

export class TSConfigStorageNode implements TSConfigStorage {
  async readOrCreate(
    cwd: string,
    options: TSConfigReadOrCreateOptions,
  ): Promise<TSConfig> {
    try {
      const { config, error } = readConfigFile(
        path.join(cwd, options.path),
        (path1) => readFileSync(path1, 'utf8'),
      )

      if (error) {
        throw error
      }

      return config
    } catch (e) {
      console.log(e)

      const tsconfig: TSConfig = {}

      await fs.writeFile(
        path.join(cwd, options.path),
        JSON.stringify(tsconfig, null, 2),
      )

      return tsconfig
    }
  }

  async getRelativeExtends(cwd: string, options: { base: string }) {
    const baseTSConfigPath = path.relative(cwd, path.join(cwd, options.base))

    return baseTSConfigPath.startsWith('.')
      ? baseTSConfigPath
      : `./${baseTSConfigPath}`
  }

  getProjectReferencePath({
    from,
    to,
    tsconfig,
  }: GetProjectReferencePathOptions) {
    return path.relative(from, path.join(to, tsconfig))
  }

  async updateOrCreate(
    cwd: string,
    patches: Partial<TSConfig>[],
    options: TSConfigUpdateOrCreateOptions,
  ) {
    const existingOrEmpty = await this.readOrCreate(cwd, options)
    const newTSConfig = defaultsDeep(
      existingOrEmpty,
      ...patches.map((patch) => ({
        ...patch,
        references: patch?.references?.map((reference) => ({
          path: path.isAbsolute(reference.path)
            ? path.relative(cwd, path.join(reference.path, options.path))
            : reference.path,
        })),
      })),
    )

    await fs.writeFile(
      path.join(cwd, options.path),
      JSON.stringify(newTSConfig, null, 2),
    )

    return newTSConfig
  }
}
