import {
  DiagramContent,
  DiagramSpecification,
  DiagramStyles,
  LinkSpecification
} from '@swirly/types'

export const createDiagramSpecification = (
  content: DiagramContent,
  styles: DiagramStyles,
  links: LinkSpecification[] = []
): DiagramSpecification => ({
  content,
  links,
  styles
})
