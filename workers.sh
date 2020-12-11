#!/bin/bash

yarn parcel build src/plugins/prettier/prettier.worker.ts --minify --out-file public/workers/prettier.monaco.worker.js
yarn parcel build src/plugins/typings/typings.worker.js --minify --out-file public/workers/typings.monaco.worker.js
yarn parcel build src/plugins/graphql/graphql.worker.ts --minify --out-file public/workers/graphql.monaco.worker.js
yarn parcel build node_modules/monaco-editor/esm/vs/language/json/json.worker.js --minify --out-file public/workers/json.monaco.worker.js
yarn parcel build node_modules/monaco-editor/esm/vs/language/css/css.worker.js --minify --out-file public/workers/css.monaco.worker.js
yarn parcel build node_modules/monaco-editor/esm/vs/language/html/html.worker.js --minify --out-file public/workers/html.monaco.worker.js
yarn parcel build node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js --minify --out-file public/workers/ts.monaco.worker.js
yarn parcel build node_modules/monaco-editor/esm/vs/editor/editor.worker.js --minify --out-file public/workers/editor.monaco.worker.js

# for x in registry/build/*.monaco.worker.*.js; do
#     p="${x%.[a-z0-9]*[a-z][0-9].js}.js"
#     p="${p/registry/public}"
#     p="${p/build/workers}"
#     cp $x $p
# done

# for x in public/core_workers/*.js; do
#     cp $x "${x/core_workers/workers}"
# done
