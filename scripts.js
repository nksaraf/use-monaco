const { nsh } = require('@nksaraf/nsh');
const pkg = require('./package.json');
const langs = [
  'abap',
  'apex',
  'azcli',
  'bat',
  'cameligo',
  'clojure',
  'coffee',
  'cpp',
  'csharp',
  'csp',
  'css',
  'dart',
  'dockerfile',
  'fsharp',
  'go',
  'graphql',
  'handlebars',
  'hcl',
  'html',
  'ini',
  'java',
  'javascript',
  'julia',
  'kotlin',
  'less',
  'lexon',
  'lua',
  'markdown',
  'mips',
  'msdax',
  'mysql',
  'objective-c',
  'pascal',
  'pascaligo',
  'perl',
  'pgsql',
  'php',
  'postiats',
  'powerquery',
  'powershell',
  'pug',
  'python',
  'r',
  'razor',
  'redis',
  'redshift',
  'restructuredtext',
  'ruby',
  'rust',
  'sb',
  'scala',
  'scheme',
  'scss',
  'shell',
  'solidity',
  'sophia',
  'sql',
  'st',
  'swift',
  'systemverilog',
  'tcl',
  'twig',
  'typescript',
  'vb',
  'xml',
  'yaml',
];

const services = ['typescript', 'css', 'json', 'html'];

nsh`
copy-workers:
  $ echo "copying workers"
  $ git restore worker/package.json themes/package.json package.json
  $ mkdir -p dist/workers
  $ mkdir -p public/workers
  $ mkdir -p dist/css
  $ cp public/style.css dist/css/style.css
  $ for x in .next/static/workers/*.monaco.worker.js;do cp $x "dist/workers/\${x##.next/static/workers/}";done
  $ for x in .next/static/workers/*.monaco.worker.js;do cp $x "public/workers/\${x##.next/static/workers/}";done
    
clean:
  $ rm -rf dist
  $ echo hello

build:
  $ rm -rf src/monaco/version.ts
  $ echo "export default '${($, ctx) =>
    pkg.version}'" > src/monaco/utils/version.ts
  $ yarn nsh clean
  $ yarn next build
  $ yarn pkger build
  $ yarn nsh build-languages
  $ yarn nsh copy-workers

build-languages:
  $ yarn patch-package
  $ rm -rf .garage
  $ mkdir -p .garage
  $ yarn tsup ${[
    ...services.map(
      (s) => `./node_modules/monaco-${s}/release/esm/monaco.contribution.js`
    ),
    ...langs.map(
      (l) =>
        `./node_modules/monaco-languages/release/esm/${l}/${l}.contribution.js`
    ),
  ].join(
    ' '
  )} --format iife --out-dir ./.garage/languages --external monaco-editor-core --external monaco-editor --legacy-output --minify
  
  $ rm -rf public/languages
  $ mkdir -p public/languages
  $ rm -rf dist/languages
  $ mkdir -p dist/languages

  for lang in ${langs} {
    $ cp .garage/languages/iife/monaco-languages/release/esm/$lang/$lang.contribution.js public/languages/$lang.basic.js
    $ cp .garage/languages/iife/monaco-languages/release/esm/$lang/$lang.contribution.js dist/languages/$lang.basic.js
  }

  for service in ${services} {
    $ cp .garage/languages/iife/monaco-$service/release/esm/monaco.contribution.js public/languages/$service.service.js
    $ cp .garage/languages/iife/monaco-$service/release/esm/monaco.contribution.js dist/languages/$service.service.js
  }`;
