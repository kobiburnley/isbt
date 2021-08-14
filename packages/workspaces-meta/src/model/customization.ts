import * as io from 'io-ts'
import type { Customization } from '../codec'

export type Customization = io.TypeOf<typeof Customization>
