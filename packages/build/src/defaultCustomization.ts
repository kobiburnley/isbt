import { WorkspacesStateParams } from '@isbt/workspaces-meta'

export const defaultCustomization: WorkspacesStateParams['customization'] = {
  tsconfig: {
    extends: '@isbt/build/tsconfig.base.json',
    base: 'tsconfig.json',
    outDir: 'dist',
    rootDir: 'src',
    include: ['src', 'test'],
    cjsName: 'cjs',
    esmName: 'esm',
  },
}
