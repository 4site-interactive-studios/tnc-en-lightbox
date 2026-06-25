#!/usr/bin/env node
import { Project, SyntaxKind } from 'ts-morph'
import * as fs from 'node:fs'
import * as path from 'node:path'

const OUT = '.agentic/contracts/snapshots/config-schema.txt'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
const source = project.getSourceFileOrThrow('src/config.ts')

function renderInterface(name: string): string {
  const decl = source.getInterfaceOrThrow(name)
  const props = decl.getProperties().map((p) => {
    const optional = p.hasQuestionToken() ? '?' : ''
    return `  ${p.getName()}${optional}: ${p.getType().getText(p)}`
  })
  return [`interface ${name} {`, ...props, '}'].join('\n')
}

const defaults: Record<string, string> = {}
const fn = source.getFunctionOrThrow('normalizeConfig')
const body = fn.getBody()
if (body?.getKind() === SyntaxKind.Block) {
  const returnStmt = body.asKindOrThrow(SyntaxKind.Block).getStatements().find((s) => s.getKind() === SyntaxKind.ReturnStatement)
  if (returnStmt?.getKind() === SyntaxKind.ReturnStatement) {
    const expr = returnStmt.asKindOrThrow(SyntaxKind.ReturnStatement).getExpression()
    if (expr?.getKind() === SyntaxKind.ObjectLiteralExpression) {
      for (const prop of expr.asKindOrThrow(SyntaxKind.ObjectLiteralExpression).getProperties()) {
        if (prop.getKind() === SyntaxKind.PropertyAssignment) {
          const assignment = prop.asKindOrThrow(SyntaxKind.PropertyAssignment)
          defaults[assignment.getName()] = assignment.getInitializer()?.getText() ?? '???'
        }
      }
    }
  }
}

function renderWithDefaults(name: string): string {
  const decl = source.getInterfaceOrThrow(name)
  const props = decl.getProperties().map((p) => {
    const optional = p.hasQuestionToken() ? '?' : ''
    const def = defaults[p.getName()]
    const suffix = def !== undefined ? `  // default ${def}` : ''
    return `  ${p.getName()}${optional}: ${p.getType().getText(p)}${suffix}`
  })
  return [`interface ${name} {`, ...props, '}'].join('\n')
}

const out: string[] = []
out.push(renderInterface('ENLightboxConfig'))
out.push('')
out.push(renderWithDefaults('NormalizedConfig'))
out.push('')

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, out.join('\n') + '\n', 'utf8')
console.log(`wrote ${OUT}`)
