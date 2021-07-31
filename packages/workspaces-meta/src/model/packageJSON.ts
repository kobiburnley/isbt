import * as io from 'io-ts'
import type { PackageJSON } from '../codec'

export type PackageJSON = io.TypeOf<typeof PackageJSON>
