// packages/parsers/src/createTSParser.ts

import { Project, SyntaxKind } from 'ts-morph'
import type { Chunker } from '@repolens/types/chunker'
import type { Parser, ParsedChunk } from '@repolens/types/parser'
import { FetchedFile } from '@repolens/types/fetcher'

export function createTSParser(chunker: Chunker): Parser {
  return {
    parse(files: FetchedFile[]): ParsedChunk[] {
      const semanticChunks: ParsedChunk[] = []

      for (const file of files) {
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

        sourceFile.forEachChild((node) => {
          const baseMeta = {
            file: {
              path: file.path,
              name: file.name,
              sha: file.sha,
              repo: file.repo,
              owner: file.owner,
            },
            parserType: 'typescript' as const,
          }

          const pushChunk = (
            type: string,
            name: string,
            text: string,
            extra?: Record<string, unknown>
          ) => {
            semanticChunks.push({
              text,
              metadata: {
                ...baseMeta,
                type,
                name,
                ...extra,
                part: 0, // will be rewritten by TokenChunker
              },
            })
          }

          if (node.getKind() === SyntaxKind.FunctionDeclaration) {
            const fn = node.asKind(SyntaxKind.FunctionDeclaration)
            const name = fn?.getName()
            const text = fn?.getText()
            if (name && text) {
              pushChunk('function', name, text)
            }
          }

          if (node.getKind() === SyntaxKind.ClassDeclaration) {
            const cls = node.asKind(SyntaxKind.ClassDeclaration)
            const name = cls?.getName()
            const text = cls?.getText()
            if (name && text) {
              pushChunk('class', name, text)

              cls?.getMethods().forEach((method) => {
                const name = method.getName()
                const text = method.getText()
                if (name && text) {
                  pushChunk('method', name, text, { parent: cls.getName() })
                }
              })
            }
          }

          if (node.getKind() === SyntaxKind.TypeAliasDeclaration) {
            const alias = node.asKind(SyntaxKind.TypeAliasDeclaration)
            if (alias?.getName()) {
              pushChunk('type', alias.getName(), alias.getText())
            }
          }

          if (node.getKind() === SyntaxKind.InterfaceDeclaration) {
            const int = node.asKind(SyntaxKind.InterfaceDeclaration)
            if (int?.getName()) {
              pushChunk('interface', int.getName(), int.getText())
            }
          }

          if (node.getKind() === SyntaxKind.EnumDeclaration) {
            const enumNode = node.asKind(SyntaxKind.EnumDeclaration)
            if (enumNode?.getName()) {
              pushChunk('enum', enumNode.getName(), enumNode.getText())
            }
          }

          if (node.getKind() === SyntaxKind.VariableStatement) {
            const varStatement = node.asKind(SyntaxKind.VariableStatement)
            const declarations = varStatement
              ?.getDeclarationList()
              .getDeclarations()

            if (varStatement?.getText()) {
              declarations?.forEach((declaration) => {
                const name = declaration.getName()
                if (name) {
                  pushChunk('variable', name, varStatement.getText())
                }
              })
            }
          }

          if (node.getKind() === SyntaxKind.ImportDeclaration) {
            const importNode = node.asKind(SyntaxKind.ImportDeclaration)
            const mod = importNode?.getModuleSpecifier()?.getText()
            if (mod && importNode) {
              pushChunk(
                'import',
                mod.replace(/['"]/g, ''),
                importNode.getText()
              )
            }
          }
        })
      }

      // Let the chunker split large semantic chunks
      return chunker.chunk(semanticChunks)
    },
  }
}
