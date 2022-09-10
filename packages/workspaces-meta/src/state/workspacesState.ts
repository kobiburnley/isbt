import { WorkspacesConfigState } from './workspacesConfigState'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import {
  EnvironmentStorage,
  FilesStorage,
  PackageJSONStorage,
  TSConfigStorage,
} from '../storage'
import { WorkspaceState } from './workspaceState'
import { Customization } from '../model'

export interface WorkspacesStateParams {
  readonly customization: Customization
  readonly tsconfigStorage: TSConfigStorage
  readonly packageJSONStorage: PackageJSONStorage
  readonly environmentStorage: EnvironmentStorage
  readonly filesStorage: FilesStorage
  readonly root?: string
}

export class WorkspacesState {
  readonly customization: Customization
  readonly tsconfigStorage: TSConfigStorage
  readonly packageJSONStorage: PackageJSONStorage
  readonly environmentStorage: EnvironmentStorage
  readonly filesStorage: FilesStorage

  root: string | null | undefined = null

  config: WorkspacesConfigState
  readonly workspacesMap = observable.map<string, WorkspaceState>([], {
    deep: false,
  })

  cwd = ''

  constructor(params: WorkspacesStateParams) {
    this.customization = params.customization
    this.tsconfigStorage = params.tsconfigStorage
    this.packageJSONStorage = params.packageJSONStorage
    this.environmentStorage = params.environmentStorage
    this.filesStorage = params.filesStorage
    this.root = params.root

    this.config = new WorkspacesConfigState({
      envState: this,
      packageJSONStorage: this.packageJSONStorage,
    })

    makeObservable(this, {
      cwd: observable.ref,
      root: observable.ref,
      workspaces: computed,
      submitTSConfig: action,
      submitRootTSConfig: action,
      effectiveWorkspaces: computed,
    })
  }

  get workspaces() {
    return Array.from(this.workspacesMap.values())
  }

  get effectiveWorkspaces() {
    const { root, workspaces, workspacesMap } = this
    if (root) {
      const rootWorkspace = workspacesMap.get(root)

      if (rootWorkspace) {
        const { dependenciesDeep } = rootWorkspace
        return workspaces.filter(
          (w) => w.name === root || dependenciesDeep.has(w.name),
        )
      }
    }
    return workspaces
  }

  async init() {
    const {
      environmentStorage,
      filesStorage,
      config,
      workspacesMap,
      packageJSONStorage,
      root,
    } = this

    this.cwd = await environmentStorage.getCwd()

    await config.init()

    const dirs = await filesStorage.getPatternDirs(config.patterns, {
      cwd: this.cwd,
    })

    const workspacesMapEntries = await Promise.all(
      dirs.map(async (dir) => {
        const workspace = new WorkspaceState({
          customization: this.customization,
          filesStorage: this.filesStorage,
          tsconfigStorage: this.tsconfigStorage,
          workspacesState: this,
          dir,
          packageJSONStorage,
        })

        await workspace.init()

        return [workspace.name, workspace] as [string, WorkspaceState]
      }),
    )

    runInAction(() => {
      workspacesMap.replace(new Map(workspacesMapEntries))
    })

    await Promise.all(
      this.workspaces.map((workspace) => workspace.initDependencies()),
    )

    runInAction(() => {
      if (!root) {
        return
      }

      const rootWorkspace = workspacesMap.get(root)

      if (!rootWorkspace) {
        return
      }
    })
  }

  async submitRootTSConfig() {
    const { tsconfigStorage, customization, cwd, effectiveWorkspaces } = this
    const { tsconfig: tsconfigCustomization } = customization
    const { outDir, esmName, cjsName } = tsconfigCustomization

    console.log({
      effectiveWorkspaces: effectiveWorkspaces.map((a) => a.name),
    })

    const tsconfigDefaults = {
      compilerOptions: {
        outDir,
      },
      include: undefined,
      references: effectiveWorkspaces.flatMap((workspace) => [
        {
          path: tsconfigStorage.getProjectReferencePath({
            from: cwd,
            to: workspace.dir,
            tsconfig: `tsconfig.${esmName}.json`,
          }),
        },
        {
          path: tsconfigStorage.getProjectReferencePath({
            from: cwd,
            to: workspace.dir,
            tsconfig: `tsconfig.${cjsName}.json`,
          }),
        },
      ]),
    }

    await tsconfigStorage.updateOrCreate(
      this.cwd,
      [
        tsconfigDefaults,
        {
          extends: tsconfigCustomization.extends,
          exclude: ['node_modules', ...this.config.patterns],
        },
      ],
      {
        ...tsconfigCustomization,
        path: `tsconfig.${esmName}.json`,
      },
    )
  }

  async submitTSConfig() {
    const { effectiveWorkspaces } = this
    await Promise.all([
      this.submitRootTSConfig(),
      ...effectiveWorkspaces.map((workspace) => workspace.submitTSConfig()),
    ])
  }
}
