import meow from 'meow';
import shellac from 'shellac';
import langs from './build-languages';

const cli = meow({});

const services = ['typescript', 'css', 'json', 'html'];

switch (cli.input[0]) {
  case 'copy-workers':
    shellac`
      $ git restore worker/package.json themes/package.json package.json
      $ mkdir -p dist/workers
      $ mkdir -p public/workers
      $ mkdir -p dist/css
      $ cp public/style.css dist/css/style.css
      $ for x in .next/static/workers/*.monaco.worker.js;do cp $x "dist/workers/\${x##.next/static/workers/}";done
      $ for x in .next/static/workers/*.monaco.worker.js;do cp $x "public/workers/\${x##.next/static/workers/}";done
    `;
    break;
  case 'clean':
    shellac`
        $ rm -rf dist
      `;
    break;
  case 'build':
    shellac`
      $$ rm -rf src/monaco/version.ts
      $$ echo "export default '${cli.pkg.version}'" > src/monaco/utils/version.ts
      $$ yarn script clean
      $$ yarn next build
      $$ yarn pkger build
      $$ yarn script build:languages
      $$ yarn script copy-workers
    `;
    break;
  case 'build:plugins':
    shellac`
      $$ rm -rf .garage
      $$ yarn tsup ${services
        .map(
          (languageService) =>
            `./node_modules/monaco-${languageService}/release/esm/monaco.contribution.js`
        )
        .join(' ')} ${Object.keys(langs)
      .map(
        (lang) =>
          `./node_modules/monaco-languages/release/esm/${langs[lang]}.js`
      )
      .join(
        ' '
      )} --format iife --out-dir ./.garage/languages --external monaco-editor-core --external monaco-editor --legacy-output --minify
    `;
  case 'build:languages':
    shellac`
      $$ rm -rf .garage
      $$ mkdir -p .garage
      $$ yarn tsup ${services
        .map(
          (languageService) =>
            `./node_modules/monaco-${languageService}/release/esm/monaco.contribution.js`
        )
        .join(' ')} ${Object.keys(langs)
      .map(
        (lang) =>
          `./node_modules/monaco-languages/release/esm/${langs[lang]}.js`
      )
      .join(
        ' '
      )} --format iife --out-dir ./.garage/languages --external monaco-editor-core --external monaco-editor --legacy-output --minify
      $$ rm -rf public/languages
      $$ mkdir -p public/languages
      $$ rm -rf dist/languages
      $$ mkdir -p dist/languages
      $$ ${Object.keys(langs)
        .map(
          (lang) =>
            `cp .garage/languages/iife/monaco-languages/release/esm/${
              langs[lang]
            }.js public/languages/${langs[lang]
              .split('/')[1]
              .replace('.contribution', '.basic')}.js`
        )
        .join(' && ')}
      $$ ${services
        .map(
          (languageService) =>
            `cp .garage/languages/iife/monaco-${languageService}/release/esm/monaco.contribution.js public/languages/${languageService}.service.js`
        )
        .join(' && ')}

      $$ ${Object.keys(langs)
        .map(
          (lang) =>
            `cp .garage/languages/iife/monaco-languages/release/esm/${
              langs[lang]
            }.js dist/languages/${langs[lang]
              .split('/')[1]
              .replace('.contribution', '.basic')}.js`
        )
        .join(' && ')}

      $$ ${services
        .map(
          (languageService) =>
            `cp .garage/languages/iife/monaco-${languageService}/release/esm/monaco.contribution.js dist/languages/${languageService}.service.js`
        )
        .join(' && ')}`;
}

// $$ cp build/languages/${cli.flags.language}.global.js dist/plugins/${
//   cli.flags.language
// }.monaco.plugin.js
// $$ cp build/languages/${cli.flags.language}.global.js public/plugins/${
//   cli.flags.language
// }.monaco.plugin.js

// const languages = {};
