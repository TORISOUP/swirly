import { LinkSpecification } from '@swirly/types'

import { Point, Rectangle, RendererContext, RendererResult } from './types.js'
import { createSvgElement } from './util/svg-xml.js'

const trimEndpoint = (
  from: Point,
  to: Point,
  distance: number,
  radius: number
): [Point, Point] => {
  if (distance <= radius * 2) {
    return [from, to]
  }

  const ux = (to.x - from.x) / distance
  const uy = (to.y - from.y) / distance

  return [
    {
      x: from.x + ux * radius,
      y: from.y + uy * radius
    },
    {
      x: to.x - ux * radius,
      y: to.y - uy * radius
    }
  ]
}

const createArrowPoints = (from: Point, to: Point): string => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const length = 12
  const halfWidth = 5
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const px = -uy
  const py = ux
  const base = {
    x: to.x - ux * length,
    y: to.y - uy * length
  }

  const left = {
    x: base.x + px * halfWidth,
    y: base.y + py * halfWidth
  }
  const right = {
    x: base.x - px * halfWidth,
    y: base.y - py * halfWidth
  }

  return `${to.x},${to.y} ${left.x},${left.y} ${right.x},${right.y}`
}

export const renderLink = (
  { document, styles }: RendererContext,
  link: LinkSpecification,
  from: Point,
  to: Point
): RendererResult => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const [start, end] = trimEndpoint(from, to, distance, styles.event_radius!)

  const color = link.styles?.color ?? styles.link_color!
  const strokeWidth = link.styles?.stroke_width ?? styles.link_stroke_width!
  const dashWidth =
    link.styles?.stroke_dash_width ?? styles.link_stroke_dash_width!

  const $group = createSvgElement(document, 'g')
  const attrs: Record<string, any> = {
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    fill: 'none',
    stroke: color,
    'stroke-width': strokeWidth,
    'stroke-linecap': 'round'
  }

  if (link.line === 'dashed') {
    attrs['stroke-dasharray'] = `${dashWidth} ${dashWidth}`
  }

  $group.appendChild(createSvgElement(document, 'line', attrs))

  if (link.direction === 'forward' || link.direction === 'both') {
    $group.appendChild(
      createSvgElement(document, 'polygon', {
        points: createArrowPoints(start, end),
        fill: color
      })
    )
  }

  if (link.direction === 'reverse' || link.direction === 'both') {
    $group.appendChild(
      createSvgElement(document, 'polygon', {
        points: createArrowPoints(end, start),
        fill: color
      })
    )
  }

  const bbox: Rectangle = {
    x1: Math.min(start.x, end.x),
    y1: Math.min(start.y, end.y),
    x2: Math.max(start.x, end.x),
    y2: Math.max(start.y, end.y)
  }

  return {
    element: $group,
    bbox
  }
}
