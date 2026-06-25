#!/usr/bin/env node
import { Project, SyntaxKind } from 'ts-morph'
import * as fs from 'node:fs'
import * as path from 'node:path'

const OUT = '.agentic/contracts/snapshots/api-surface.txt'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
const source = project.getSourceFileOrThrow('src/index.ts')

const lines: string[] = []

for (const [name, declarations] of source.getExportedDeclarations()) {
  for (const decl of declarations) {
    const kind = decl.getKind()
    if (kind === SyntaxKind.FunctionDeclaration) {
      const fn = decl.asKindOrThrow(SyntaxKind.FunctionDeclaration)
      const params = fn.getParameters().map((p) => p.getText()).join(', ')
      const ret = fn.getReturnTypeNode()?.getText() ?? 'unknown'
      lines.push(`${name} : (${params}) => ${ret}`)
    } else if (kind === SyntaxKind.ClassDeclaration) {
      lines.push(`${name} : typeof ${name}`)
    } else if (kind === SyntaxKind.VariableDeclaration) {
      lines.push(`${name} : ${decl.getType().getText()}`)
    } else if (kind === SyntaxKind.TypeAliasDeclaration || kind === SyntaxKind.InterfaceDeclaration) {
      lines.push(`${name} : ${decl.getType().getText()}`)
    }
  }
}

lines.push('ENLightboxAPI')
lines.sort((a, b) => a.localeCompare(b))

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log(`wrote ${OUT}`)
