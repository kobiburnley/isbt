import {
  TSConfigReadOrCreateOptions,
  TSConfigStorage,
  TSConfigUpdateOrCreateOptions,
} from '../storage'
import { defaultsDeep } from 'lodash'
import path from 'path'
import { promises as fs } from 'fs'
import { TSConfig } from '../model'

export class TSConfigStorageNode implements TSConfigStorage {
  async readOrCreate(
    cwd: string,
    options: TSConfigReadOrCreateOptions,
  ): Promise<TSConfig> {
    try {
      return require(require.resolve(options.path, {
        paths: [cwd],
      }))
    } catch (_) {
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
          path: reference.path.startsWith('.')
            ? reference.path
            : path.relative(cwd, path.join(reference.path, options.path)),
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
