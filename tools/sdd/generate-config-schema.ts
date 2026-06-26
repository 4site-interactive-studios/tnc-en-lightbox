#!/usr/bin/env node
import { Project, SyntaxKind } from 'ts-morph'
import * as fs from 'node:fs'
import * as path from 'node:path'

const OUT = '.agentic/contracts/snapshots/config-schema.txt'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
const source = project.getSourceFileOrThrow('src/config.ts')

function renderInterface(project: Project, name: string): string {
  const decl = source.getInterfaceOrThrow(name)
  const props = decl.getProperties().map((p) => {
    const optional = p.hasQuestionToken() ? '?' : ''
    return `  ${p.getName()}${optional}: ${p.getType().getText(p)}`
  })
  return [`interface ${name} {`, ...props, '}'].join('\n')
}

function renderType(project: Project, name: string): string {
  for (const sf of project.getSourceFiles()) {
    const ta = sf.getTypeAlias(name)
    if (ta) {
      const text = ta.getType().getText(ta)
      return `type ${name} = ${text}`
    }
    const inf = sf.getInterface(name)
    if (inf) {
      const props = inf.getProperties().map((p) => {
        const optional = p.hasQuestionToken() ? '?' : ''
        return `  ${p.getName()}${optional}: ${p.getType().getText(p)}`
      })
      return [`interface ${name} {`, ...props, '}'].join('\n')
    }
  }
  throw new Error(`type or interface ${name} not found`)
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
out.push(renderInterface(project, 'ENLightboxConfig'))
out.push('')
out.push(renderWithDefaults('NormalizedConfig'))
out.push('')
out.push('// Resolved layout shape from src/themes/config.ts')
out.push(renderType(project, 'NormalizedLayout'))
out.push('')

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, out.join('\n') + '\n', 'utf8')
console.log(`wrote ${OUT}`)
