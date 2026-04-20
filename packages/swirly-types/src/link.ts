import { LinkStyles } from './styles.js'

export type LinkEndpointSpecification = {
  stream?: string
  message: string
}

export type LinkSpecification = {
  from: LinkEndpointSpecification
  to: LinkEndpointSpecification
  line: 'solid' | 'dashed'
  direction: 'none' | 'forward' | 'reverse' | 'both'
  layer?: 'back' | 'front'
  priority?: number
  styles?: LinkStyles
}
