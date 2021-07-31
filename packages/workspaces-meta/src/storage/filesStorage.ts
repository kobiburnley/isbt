interface Options {
  cwd: string
}

export type GetPatternDirsOptions = Options
export type GetPatternFilesOptions = Options

export interface FilesStorage {
  resolvePackageJSON: (
    name: string,
    options: { paths: string[] },
  ) => Promise<string>
  resolvePackageDir: (
    name: string,
    options: { paths: string[] },
  ) => Promise<string>
  getPatternDirs: (
    patterns: string[],
    options: GetPatternDirsOptions,
  ) => Promise<string[]>
  getPatternFiles: (
    patterns: string[],
    options: GetPatternFilesOptions,
  ) => Promise<string[]>
}
