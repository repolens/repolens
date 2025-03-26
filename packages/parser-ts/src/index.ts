import { Project, SyntaxKind } from 'ts-morph'
import type { Chunker, FileInput, ParsedChunk } from '@repolens/types'

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
                parent: cls.getName() ?? '',
                text,
                metadata: { part: index },
              })
            })
          })
        }
      }

      if (node.getKind() === SyntaxKind.TypeAliasDeclaration) {
        const alias = node.asKind(SyntaxKind.TypeAliasDeclaration)
        if (alias?.getName()) {
          const aliasParts = chunker.chunk(alias.getText(), {
            path: file.path,
          })
          aliasParts.forEach((text, index) => {
            chunks.push({
              type: 'type',
              name: alias.getName() ?? '',
              text,
              metadata: { part: index },
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

      if (node.getKind() === SyntaxKind.EnumDeclaration) {
        const enumNode = node.asKind(SyntaxKind.EnumDeclaration)
        if (enumNode?.getName()) {
          const enumParts = chunker.chunk(enumNode.getText(), {
            path: file.path,
          })
          enumParts.forEach((text, index) => {
            chunks.push({
              type: 'enum',
              name: enumNode.getName() ?? '',
              text,
              metadata: { part: index },
            })
          })
        }
      }

      if (node.getKind() === SyntaxKind.VariableDeclaration) {
        const varNode = node.asKind(SyntaxKind.VariableDeclaration)
        if (varNode?.getName()) {
          const varParts = chunker.chunk(varNode.getText(), {
            path: file.path,
          })
          varParts.forEach((text, index) => {
            chunks.push({
              type: 'variable',
              name: varNode.getName() ?? '',
              text,
              metadata: { part: index },
            })
          })
        }
      }

      if (node.getKind() === SyntaxKind.ImportDeclaration) {
        const importNode = node.asKind(SyntaxKind.ImportDeclaration)
        if (importNode?.getModuleSpecifier()) {
          const importParts = chunker.chunk(importNode.getText(), {
            path: file.path,
          })
          importParts.forEach((text, index) => {
            chunks.push({
              type: 'import',
              name: importNode.getModuleSpecifier()?.getText() ?? '',
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
