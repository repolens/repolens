import { Project, SyntaxKind } from 'ts-morph'
import type { Chunker, FileInput, ParsedChunk } from '@repo-vector/types'

export function createTSParser(chunker: Chunker) {
  return function parseTS(file: FileInput): ParsedChunk[] {
    const extension = file.path.split('.').pop() ?? 'ts'

    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        allowJs: true,
        jsx: extension === 'tsx' || extension === 'jsx' ? 2 : undefined,
      },
    })

    const sourceFile = project.createSourceFile(
      `temp.${extension}`,
      file.content
    )
    const chunks: ParsedChunk[] = []

    sourceFile.forEachChild((node) => {
      if (node.getKind() === SyntaxKind.FunctionDeclaration) {
        const fn = node.asKind(SyntaxKind.FunctionDeclaration)
        if (fn?.getName()) {
          const parts = chunker.chunk(fn.getText(), { path: file.path })
          parts.forEach((text, index) => {
            chunks.push({
              type: 'function',
              name: fn.getName() ?? '',
              text,
              metadata: { part: index },
            })
          })
        }
      }

      if (node.getKind() === SyntaxKind.ClassDeclaration) {
        const cls = node.asKind(SyntaxKind.ClassDeclaration)
        if (cls?.getName()) {
          const classParts = chunker.chunk(cls.getText(), { path: file.path })
          classParts.forEach((text, index) => {
            chunks.push({
              type: 'class',
              name: cls.getName() ?? '',
              text,
              metadata: { part: index },
            })
          })

          cls.getMethods().forEach((method) => {
            const methodParts = chunker.chunk(method.getText(), {
              path: file.path,
            })
            methodParts.forEach((text, index) => {
              chunks.push({
                type: 'method',
                name: method.getName() ?? '',
                text,
                metadata: { part: index, parent: cls.getName() ?? '' },
              })
            })
          })
        }
      }

      if (node.getKind() === SyntaxKind.InterfaceDeclaration) {
        const int = node.asKind(SyntaxKind.InterfaceDeclaration)
        if (int?.getName()) {
          const interfaceParts = chunker.chunk(int.getText(), {
            path: file.path,
          })
          interfaceParts.forEach((text, index) => {
            chunks.push({
              type: 'interface',
              name: int.getName() ?? '',
              text,
              metadata: { part: index },
            })
          })
        }
      }
    })

    return chunks
  }
}
