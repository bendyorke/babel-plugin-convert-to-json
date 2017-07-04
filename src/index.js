import _fs from 'fs'
import _path from 'path'
import yaml from 'js-yaml'
import decache from 'decache'

function determineLeftExpression(types, node) {
  if (isDestructuredImportExpression(node)) {
    return buildObjectPatternFromDestructuredImport(types, node)
  }

  const variableName = node.specifiers[0].local.name

  return types.identifier(variableName)
}

function isDestructuredImportExpression(node) {
  return node.specifiers.length !== 1 ||
    node.specifiers[0].type !== 'ImportDefaultSpecifier'
}

function buildObjectPatternFromDestructuredImport(types, node) {
  const properties = node.specifiers.map((specifier) => {
    const key = types.identifier(specifier.imported.name)
    const value = types.identifier(specifier.local.name)

    return types.objectProperty(key, value)
  })

  return types.objectPattern(properties)
}

function requireFresh(filepath) {
  decache(filepath)

  return require(filepath)
}

function getFile(module, state) {
  const fileLocation = state.file.opts.filename
  let filepath = null

  if (fileLocation === 'unknown') {
    filepath = module
  } else {
    filepath = _path.join(_path.resolve(fileLocation), '..', module)
  }

  decache(filepath)

  return _fs.readFileSync(filepath, 'utf-8')
}

function getJSONFromEnv(file) {
  return file.split('\n').reduce((memo, line) => {
    const match = line.match(/^\s*(?:export\s+|)([\w\d\.\-_]+)\s*=\s*['"]?(.*?)?['"]?\s*$/)
    if (match && match[1] && match[2]) memo[match[1]] = match[2]
    return memo
  }, {})
}

export default function({types: t}) {
  return {
    visitor: {
      CallExpression(path, state) {
        const {node} = path

        if (node.callee.name !== 'require') {
          return;
        }

        const module = node.arguments[0].value

        if (module.match(/\.ya?ml?$/)) {
          const file = getFile(module, state)
          const json = yaml.safeLoad(file)

          path.replaceWith(t.valueToNode(json))
        }

        if (module.match(/\.env\.?.*$/)) {
          const file = getFile(module, state)
          const json = getJSONFromEnv(file)

          path.replaceWith(t.valueToNode(json))
        }
      },
      ImportDeclaration: {
        exit(path, state) {
          const {node} = path
          const module = node.source.value

          if (module.match(/\.ya?ml?$/)) {
            const leftExpression = determineLeftExpression(t, node)

            const file = getFile(path.node.source.value, state)
            const json = yaml.safeLoad(file)

            path.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  leftExpression,
                  t.valueToNode(json),
                ),
              ])
            )
          }

          if (module.match(/\.env\.?.*$/)) {
            const leftExpression = determineLeftExpression(t, node)

            const file = getFile(path.node.source.value, state)
            const json = getJSONFromEnv(file)

            path.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  leftExpression,
                  t.valueToNode(json),
                ),
              ])
            )
          }
        }
      }
    }
  };
}
