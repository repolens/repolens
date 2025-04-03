// packages/parsers/src/parsers/typescript.ts

import { Project, SyntaxKind } from 'ts-morph'
import { SemanticParser, mergeChunksByTokenLimit } from '@repolens/core'
import type { ParsedChunk, LensData } from '@repolens/core'

export class TypeScriptParser extends SemanticParser {
  supports(file: LensData): boolean {
    const name = file.metadata?.name as string | undefined
    return /\.(ts|tsx|js|jsx)$/.test(name ?? '')
  }

  parse(files: LensData[]): ParsedChunk[] {
    const allChunks: ParsedChunk[] = []

    for (const file of files) {
      const baseMeta = {
        ...file.metadata,
        parserType: 'typescript' as const,
      }

      const extension =
        (file.metadata?.path as string)?.split('.').pop() ?? 'ts'

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
      const rawChunks: ParsedChunk[] = []

      const push = (
        type: string,
        name: string,
        content: string,
        extra?: Record<string, unknown>
      ) => {
        rawChunks.push({
          content,
          metadata: { ...baseMeta, type, name, ...extra },
        })
      }

      sourceFile.forEachChild((node) => {
        if (node.getKind() === SyntaxKind.FunctionDeclaration) {
          const fn = node.asKind(SyntaxKind.FunctionDeclaration)
          if (fn?.getName() && fn.getText())
            push('function', fn.getName() ?? '', fn.getText())
        }

        if (node.getKind() === SyntaxKind.ClassDeclaration) {
          const cls = node.asKind(SyntaxKind.ClassDeclaration)
          if (cls?.getName() && cls.getText()) {
            push('class', cls.getName() ?? '', cls.getText())
            cls.getMethods().forEach((method) => {
              if (method.getName() && method.getText()) {
                push('method', method.getName(), method.getText(), {
                  parent: cls.getName(),
                })
              }
            })
          }
        }

        if (node.getKind() === SyntaxKind.TypeAliasDeclaration) {
          const alias = node.asKind(SyntaxKind.TypeAliasDeclaration)
          if (alias?.getName()) push('type', alias.getName(), alias.getText())
        }

        if (node.getKind() === SyntaxKind.InterfaceDeclaration) {
          const int = node.asKind(SyntaxKind.InterfaceDeclaration)
          if (int?.getName()) push('interface', int.getName(), int.getText())
        }

        if (node.getKind() === SyntaxKind.EnumDeclaration) {
          const e = node.asKind(SyntaxKind.EnumDeclaration)
          if (e?.getName()) push('enum', e.getName(), e.getText())
        }

        if (node.getKind() === SyntaxKind.VariableStatement) {
          const vs = node.asKind(SyntaxKind.VariableStatement)
          const declarations = vs?.getDeclarationList().getDeclarations()
          if (vs?.getText()) {
            declarations?.forEach((d) => {
              if (d.getName()) push('variable', d.getName(), vs.getText())
            })
          }
        }

        if (node.getKind() === SyntaxKind.ImportDeclaration) {
          const imp = node.asKind(SyntaxKind.ImportDeclaration)
          const mod = imp?.getModuleSpecifier()?.getText()
          if (mod && imp) {
            push('import', mod.replace(/['"]/g, ''), imp.getText())
          }
        }
      })

      allChunks.push(
        ...mergeChunksByTokenLimit(
          rawChunks,
          this.maxTokens,
          baseMeta,
          'typescript'
        )
      )
    }

    return allChunks
  }
}

export function createTSParser(maxTokens: number = 8000) {
  return new TypeScriptParser(maxTokens)
}
