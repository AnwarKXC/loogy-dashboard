import type { CategoryTreeNode } from '~/types'

export interface FlattenedCategory extends CategoryTreeNode {
  depth: number
  path: string
}

export function flattenCategoryTree(nodes: CategoryTreeNode[], depth = 0, lineage: string[] = []): FlattenedCategory[] {
  const result: FlattenedCategory[] = []

  for (const node of nodes) {
    const currentLineage = [...lineage, node.name]
    const path = currentLineage.join(' / ')

    result.push({
      ...node,
      depth,
      path
    })

    if (node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, depth + 1, currentLineage))
    }
  }

  return result
}
