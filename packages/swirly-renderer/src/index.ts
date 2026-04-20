import { lightStyles } from '@swirly/theme-default-light'
import {
  DiagramRendering,
  DiagramSpecification,
  LinkEndpointSpecification,
  LinkSpecification,
  OperatorSpecification,
  RendererOptions,
  StreamSpecification
} from '@swirly/types'

import { renderLink } from './link.js'
import { renderOperator } from './operator.js'
import { renderStream } from './stream/full.js'
import {
  Point,
  RendererContext,
  RendererResult,
  UpdatableRendererResult
} from './types.js'
import { mergeStyles } from './util/merge-styles.js'
import {
  createSvgDocument,
  createSvgElement,
  setSvgDimensions
} from './util/svg-xml.js'
import { translate } from './util/transform.js'

const isOperator = (item: StreamSpecification | OperatorSpecification) =>
  item.kind === 'O'

const isStream = (item: StreamSpecification | OperatorSpecification) =>
  !isOperator(item)

type MessageAnchor = Point & {
  stream?: string
  message: string
}

const isNextMessage = ({ notification }: StreamSpecification['messages'][0]) =>
  notification.kind === 'N'

const countPriors = (
  stream: StreamSpecification,
  message: StreamSpecification['messages'][0],
  index: number
): number => {
  let count = 0
  for (let i = 0; i < index; ++i) {
    const prior = stream.messages[i]
    if (isNextMessage(prior) && prior.frame === message.frame) {
      ++count
    }
  }
  return count
}

const collectMessageAnchors = (
  ctx: RendererContext,
  stream: StreamSpecification,
  y: number,
  bboxY: number
): MessageAnchor[] => {
  const { styles, streamHeight, streamTitleEnabled } = ctx
  const s = mergeStyles(styles, stream.styles, 'stream_')
  const titleOffset = streamTitleEnabled ? s.title_width! : 0
  const streamFrame = stream.frame ?? 0
  const anchors: MessageAnchor[] = []

  for (let i = 0; i < stream.messages.length; ++i) {
    const message = stream.messages[i]
    if (message.id == null || !isNextMessage(message)) {
      continue
    }

    anchors.push({
      stream: stream.id,
      message: message.id,
      x: titleOffset + (streamFrame + message.frame) * styles.frame_width!,
      y:
        y -
        bboxY +
        streamHeight / 2 +
        countPriors(stream, message, i) * styles.stacking_height!
    })
  }

  return anchors
}

const resolveEndpoint = (
  anchors: readonly MessageAnchor[],
  endpoint: LinkEndpointSpecification
): MessageAnchor | null => {
  const matches = anchors.filter(
    (anchor) =>
      anchor.message === endpoint.message &&
      (endpoint.stream == null || anchor.stream === endpoint.stream)
  )
  return matches.length === 1 ? matches[0] : null
}

const compareLinkPriority = (a: LinkSpecification, b: LinkSpecification) =>
  (a.priority ?? 0) - (b.priority ?? 0)

export const renderMarbleDiagram = (
  spec: DiagramSpecification,
  options: RendererOptions = {}
): DiagramRendering => {
  const styles = {
    ...lightStyles,
    ...options.styles,
    ...spec.styles
  }

  const document = createSvgDocument(options.DOMParser)
  const $svg = document.documentElement

  const $group = createSvgElement(document, 'g')
  translate($group, styles.canvas_padding!, styles.canvas_padding!)
  $svg.appendChild($group)

  const streamHeight = Math.max(
    styles.event_radius! * 2,
    styles.completion_height!,
    styles.error_size!
  )

  const streamTitleEnabled = spec.content.some(
    (item) => isStream(item) && item.title != null && item.title !== ''
  )

  const ctx: RendererContext = {
    DOMParser: options.DOMParser,
    document,
    styles,
    streamHeight,
    streamTitleEnabled
  }

  const updaters = []
  const anchors: MessageAnchor[] = []

  let minX = 0
  let maxX = 0
  let y = 0
  for (const item of spec.content) {
    const rendererResult: RendererResult = isOperator(item)
      ? renderOperator(ctx, item as OperatorSpecification)
      : renderStream(ctx, item as StreamSpecification)
    const { element, bbox, update } = rendererResult as UpdatableRendererResult

    translate(element, 0, y - bbox.y1)
    $group.appendChild(element)

    minX = Math.min(minX, bbox.x1)
    maxX = Math.max(maxX, bbox.x2)

    if (isStream(item)) {
      anchors.push(
        ...collectMessageAnchors(ctx, item as StreamSpecification, y, bbox.y1)
      )
    }

    const height = bbox.y2 - bbox.y1
    y += height + styles.stream_spacing!

    if (update != null) {
      updaters.push(update)
    }
  }

  if (spec.links != null && spec.links.length > 0) {
    const $backLinks = createSvgElement(document, 'g')
    const $frontLinks = createSvgElement(document, 'g')
    const links = spec.links.slice().sort(compareLinkPriority)

    for (const link of links) {
      const from = resolveEndpoint(anchors, link.from)
      const to = resolveEndpoint(anchors, link.to)
      if (from == null || to == null) {
        continue
      }

      const { element, bbox } = renderLink(ctx, link, from, to)
      const $links = link.layer === 'front' ? $frontLinks : $backLinks
      $links.appendChild(element)
      minX = Math.min(minX, bbox.x1)
      maxX = Math.max(maxX, bbox.x2)
    }

    if ($backLinks.firstChild != null) {
      $group.insertBefore($backLinks, $group.firstChild)
    }
    if ($frontLinks.firstChild != null) {
      $group.appendChild($frontLinks)
    }
  }

  const dx = minX < 0 ? -minX : 0
  translate($group, dx, 0)

  const innerWidth = Math.max(maxX - minX, styles.minimum_width!)
  const innerHeight = Math.max(
    y - styles.stream_spacing!,
    styles.minimum_height!
  )

  const width = styles.canvas_padding! + innerWidth + styles.canvas_padding!
  const height = styles.canvas_padding! + innerHeight + styles.canvas_padding!

  setSvgDimensions($svg, width, height)

  const bgColor = styles.background_color!
  if (bgColor !== '' && bgColor !== 'transparent') {
    const $bg = createSvgElement(document, 'rect', {
      x: 0,
      y: 0,
      width,
      height,
      fill: bgColor
    })
    $svg.insertBefore($bg, $svg.firstChild)
  }

  for (const update of updaters) {
    update({
      width: innerWidth,
      height: innerHeight,
      dx
    })
  }

  return {
    document,
    width,
    height
  }
}
