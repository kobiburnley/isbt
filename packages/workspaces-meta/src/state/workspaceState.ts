import { Customization, PackageJSON } from '../model'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { FilesStorage, PackageJSONStorage, TSConfigStorage } from '../storage'
import { isNone, none, Option, some } from 'fp-ts/Option'

export interface WorkspaceStateParams {
  readonly customization: Customization
  readonly filesStorage: FilesStorage
  readonly tsconfigStorage: TSConfigStorage
  readonly packageJSONStorage: PackageJSONStorage
  readonly workspacesState: {
    workspacesMap: Map<string, WorkspaceState>
  }
  readonly dir: string
}

export class WorkspaceState {
  readonly customization: Customization
  readonly filesStorage: FilesStorage
  readonly tsconfigStorage: TSConfigStorage
  readonly packageJSONStorage: PackageJSONStorage

  readonly workspacesState: {
    workspacesMap: Map<string, WorkspaceState>
  }
  dir: string
  packageJSONOption: Option<PackageJSON> = none
  rawDependenciesPathsOption: Option<Map<string, string>> = none

  constructor(params: WorkspaceStateParams) {
    this.customization = params.customization
    this.filesStorage = params.filesStorage
    this.tsconfigStorage = params.tsconfigStorage
    this.packageJSONStorage = params.packageJSONStorage
    this.workspacesState = params.workspacesState
    this.dir = params.dir

    makeObservable(this, {
      packageJSONOption: observable.ref,
      packageJSON: computed,
      rawDependenciesPathsOption: observable.ref,
      rawDependenciesPaths: computed,
      dir: observable.ref,
      rawDependencies: computed,
      dependencies: computed,
      initDependencies: action,
      name: computed,
      init: action,
      submitTSConfig: action,
    })
  }

  get packageJSON() {
    if (isNone(this.packageJSONOption)) {
      throw new Error(
        'Invalid access to WorkspaceState.packageJSON, init() must be called first',
      )
    }

    return this.packageJSONOption.value
  }

  get rawDependenciesPaths() {
    if (isNone(this.rawDependenciesPathsOption)) {
      throw new Error(
        'Invalid access to WorkspaceState.rawDependenciesPaths, init() must be called first',
      )
    }

    return this.rawDependenciesPathsOption.value
  }

  get name() {
    return this.packageJSON.name
  }

  async init() {
    const { packageJSONStorage, dir } = this
    const packageJSON = await packageJSONStorage.read(dir)
    runInAction(() => {
      this.packageJSONOption = some(packageJSON)
    })
  }

  async initDependencies() {
    const { rawDependencies, filesStorage } = this

    const rawDependenciesPathsEntries = await Promise.all(
      rawDependencies.map(
        async (workspace) =>
          [
            workspace.name,
            await filesStorage.resolvePackageDir(workspace.name, {
              paths: [this.dir],
            }),
          ] as const,
      ),
    )

    runInAction(() => {
      this.rawDependenciesPathsOption = some(
        new Map(rawDependenciesPathsEntries),
      )
    })
  }

  get dependencies() {
    const { rawDependencies, rawDependenciesPaths } = this

    return rawDependencies.filter(
      (workspace) => workspace.dir === rawDependenciesPaths.get(workspace.name),
    )
  }

  get rawDependencies() {
    const {
      packageJSON,
      workspacesState: { workspacesMap },
    } = this

    return Object.entries({
      ...packageJSON.dependencies,
      ...packageJSON.devDependencies,
      ...packageJSON.peerDependencies,
    })
      .map(([name, version]) => workspacesMap.get(name))
      .filter((workspace): workspace is WorkspaceState => workspace != null)
  }

  async submitTSConfig() {
    const { tsconfigStorage, customization, dir } = this
    const { tsconfig: tsconfigCustomization } = customization
    const { esmName, cjsName, outDir } = tsconfigCustomization

    const baseTSConfigRelative = await tsconfigStorage.getRelativeExtends(dir, {
      base: tsconfigCustomization.base,
    })

    const tsconfigDefaults = {
      extends: baseTSConfigRelative,
      compilerOptions: {
        rootDir: tsconfigCustomization.rootDir,
      },
      include: [
        tsconfigCustomization.rootDir,
        `"${tsconfigCustomization.rootDir}/**/*.json"`,
      ],
    }

    await tsconfigStorage.updateOrCreate(
      dir,
      [
        {
          extends: tsconfigCustomization.extends,
          include: tsconfigCustomization.include,
        },
      ],
      {
        path: tsconfigCustomization.base,
      },
    )

    await Promise.all([
      tsconfigStorage.updateOrCreate(
        dir,
        [
          tsconfigDefaults,
          {
            compilerOptions: {
              outDir: `${outDir}/${cjsName}`,
              target: 'ES6',
              module: 'CommonJS',
            },
            references: this.dependencies.map((workspace) => ({
              path: workspace.dir,
            })),
          },
        ],
        {
          path: `tsconfig.${cjsName}.json`,
        },
      ),
      tsconfigStorage.updateOrCreate(
        dir,
        [
          tsconfigDefaults,
          {
            compilerOptions: {
              ...tsconfigDefaults.compilerOptions,
              outDir: `${outDir}/${esmName}`,
              target: 'ES5',
              module: 'ESNext',
            },
            references: this.dependencies.flatMap((workspace) => [
              {
                path: tsconfigStorage.getProjectReferencePath({
                  from: dir,
                  to: workspace.dir,
                  tsconfig: `tsconfig.${esmName}.json`,
                }),
              },
              {
                path: tsconfigStorage.getProjectReferencePath({
                  from: dir,
                  to: workspace.dir,
                  tsconfig: `tsconfig.${cjsName}.json`,
                }),
              },
            ]),
          },
        ],
        {
          path: `tsconfig.${esmName}.json`,
        },
      ),
    ])
  }
}
