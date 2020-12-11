new Worker('src/plugins/prettier/prettier.worker.ts'); //  --minify --out-file public/workers/prettier.monaco.worker.js
new Worker('src/plugins/typings/typings.worker.js'); //  --minify --out-file public/workers/typings.monaco.worker.js
new Worker('src/plugins/graphql/graphql.worker.ts'); // --minify --out-file public/workers/graphql.monaco.worker.js
new Worker('node_modules/monaco-editor/esm/vs/language/json/json.worker.js'); // --minify --out-file public/workers/json.monaco.worker.js
new Worker('node_modules/monaco-editor/esm/vs/language/css/css.worker.js'); //  --minify --out-file public/workers/css.monaco.worker.js
new Worker('node_modules/monaco-editor/esm/vs/language/html/html.worker.js'); // --minify --out-file public/workers/html.monaco.worker.js
new Worker(
  'node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js'
); // --minify --out-file public/workers/ts.monaco.worker.js
new Worker('node_modules/monaco-editor/esm/vs/editor/editor.worker.js');
