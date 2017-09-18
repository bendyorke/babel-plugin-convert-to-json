# babel-plugin-convert-to-json

Convert various file formats to json on import.  Very much so a work in progress, currently supports `.yml` and `.env` files

## Example

**In**

```js
import yml from './yml.yml'
import env from './.env'
const yml2 = require('./yml.yml')
const env2 = require('./.env')
```

**Out**

```js
const yml = <JSON>
const env = <JSON>
const yml2 = <JSON>
const env2 = <JSON>
```

## Installation

```sh
$ npm install babel-plugin-convert-to-json
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["convert-to-json"]
}
```

### Via CLI

```sh
$ babel --plugins convert-to-json script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["convert-to-json"]
});
```
