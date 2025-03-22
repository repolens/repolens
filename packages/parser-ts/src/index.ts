import { Project, SyntaxKind } from 'ts-morph'

export interface ParsedChunk {
  type: string
  name: string
  text: string
  parent?: string
}

export function parse(content: string): ParsedChunk[] {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('temp.ts', content)

  const chunks: ParsedChunk[] = []

  sourceFile.forEachChild((node) => {
    switch (node.getKind()) {
      case SyntaxKind.FunctionDeclaration:
        const fn = node.asKind(SyntaxKind.FunctionDeclaration)
        if (fn?.getName()) {
          chunks.push({
            type: 'function',
            name: fn.getName() ?? '',
            text: fn.getText(),
          })
        }
        break
      case SyntaxKind.ClassDeclaration:
        const cls = node.asKind(SyntaxKind.ClassDeclaration)
        if (cls?.getName()) {
          chunks.push({
            type: 'class',
            name: cls.getName() ?? '',
            text: cls.getText(),
          })
          cls.getMethods().forEach((method) => {
            chunks.push({
              type: 'method',
              name: method.getName() ?? '',
              parent: cls.getName() ?? '',
              text: method.getText(),
            })
          })
        }
        break
    }
  })

  return chunks
}
