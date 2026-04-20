import { LinkEndpointSpecification, LinkSpecification } from '@swirly/types'

import { Parser, ParserContext } from '../types.js'

const reHeader = /^\[links\]$/
const reLink = /^(\S+)\s+(\S+)\s+(\S+)(?:\s+\[(.*)\])?$/

const CONNECTORS = new Set([
  '--',
  '-.-',
  '-->',
  '-.->',
  '<--',
  '<-.-',
  '<-->',
  '<-.->'
])

const parseEndpoint = (raw: string): LinkEndpointSpecification => {
  const dot = raw.lastIndexOf('.')
  if (dot < 0) {
    return { message: raw }
  }
  return {
    stream: raw.slice(0, dot),
    message: raw.slice(dot + 1)
  }
}

const parseStyleValue = (value: string): string | number => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? value : parsed
}

const parseLinkOptions = (
  raw: string | undefined
): Pick<LinkSpecification, 'layer' | 'priority' | 'styles'> => {
  if (raw == null || raw.trim() === '') {
    return {}
  }

  const styles: LinkSpecification['styles'] = {}
  let layer: LinkSpecification['layer']
  let priority: number | undefined

  for (const part of raw.split(/\s*,\s*/)) {
    const [name, value] = part.split(/\s*=\s*/, 2)
    switch (name) {
      case 'layer':
        if (value === 'back' || value === 'front') {
          layer = value
        }
        break
      case 'priority':
      case 'z':
      case 'z_index':
        priority = Number(parseStyleValue(value))
        break
      case 'color':
        styles.color = String(parseStyleValue(value))
        break
      case 'width':
      case 'stroke_width':
        styles.stroke_width = Number(parseStyleValue(value))
        break
      case 'dash_width':
      case 'stroke_dash_width':
        styles.stroke_dash_width = Number(parseStyleValue(value))
        break
    }
  }

  return {
    layer,
    priority,
    styles: Object.keys(styles).length > 0 ? styles : undefined
  }
}

const getDirection = (connector: string): LinkSpecification['direction'] => {
  const reverse = connector.startsWith('<')
  const forward = connector.endsWith('>')

  switch (true) {
    case reverse && forward:
      return 'both'
    case reverse:
      return 'reverse'
    case forward:
      return 'forward'
    default:
      return 'none'
  }
}

const match = (line: string): boolean => reHeader.test(line)

const run = (lines: readonly string[], ctx: ParserContext) => {
  const [, ...linkLines] = lines
  for (const line of linkLines) {
    const matched = reLink.exec(line.trim())
    if (matched == null) {
      throw new Error(`Invalid link: ${line}`)
    }

    const [, from, connector, to, options] = matched
    if (!CONNECTORS.has(connector)) {
      throw new Error(`Invalid link connector: ${connector}`)
    }
    const linkOptions = parseLinkOptions(options)
    ctx.links.push({
      from: parseEndpoint(from),
      to: parseEndpoint(to),
      line: connector.includes('.') ? 'dashed' : 'solid',
      direction: getDirection(connector),
      ...linkOptions
    })
  }
}

export const linksParser: Parser = {
  match,
  run
}
