import Bundler from 'parcel-bundler';
import Path from 'path';
import shellac from 'shellac';

// yarn parcel build src/plugins/prettier/prettier.worker.ts --minify --out-file public/workers/prettier.monaco.worker.js
// yarn parcel build src/plugins/typings/typings.worker.js --minify --out-file public/workers/typings.monaco.worker.js
// yarn parcel build src/plugins/graphql/graphql.worker.ts --minify --out-file public/workers/graphql.monaco.worker.js
// yarn parcel build node_modules/monaco-editor/esm/vs/language/json/json.worker.js --minify --out-file public/workers/json.monaco.worker.js
// yarn parcel build node_modules/monaco-editor/esm/vs/language/css/css.worker.js --minify --out-file public/workers/css.monaco.worker.js
// yarn parcel build node_modules/monaco-editor/esm/vs/language/html/html.worker.js --minify --out-file public/workers/html.monaco.worker.js
// yarn parcel build node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js --minify --out-file public/workers/ts.monaco.worker.js
// yarn parcel build node_modules / monaco - editor / esm / vs / editor / editor.worker.js--minify--out - file public / workers / editor.monaco.worker.js
const workers = {
  prettier: 'src/plugins/prettier/prettier.worker.ts', //  --minify --out-file public/workers/prettier.monaco.worker.js
  typings: 'src/plugins/typings/typings.worker.js', //  --minify --out-file public/workers/typings.monaco.worker.js
  graphql: 'src/plugins/graphql/graphql.worker.ts', // --minify --out-file public/workers/graphql.monaco.worker.js
  json: 'node_modules/monaco-editor/esm/vs/language/json/json.worker.js', // --minify --out-file public/workers/json.monaco.worker.js
  css: 'node_modules/monaco-editor/esm/vs/language/css/css.worker.js', //  --minify --out-file public/workers/css.monaco.worker.js
  html: 'node_modules/monaco-editor/esm/vs/language/html/html.worker.js', // --minify --out-file public/workers/html.monaco.worker.js
  ts: 'node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js', // --minify --out-file public/workers/ts.monaco.worker.js
  editor: 'node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
}; //  --minify --out-file public/workers/editor.monaco.worker.js

// # for x in registry/build/*.monaco.worker.*.js; do
// #     p="${x%.[a-z0-9]*[a-z][0-9].js}.js"
// #     p="${p/registry/public}"
// #     p="${p/build/workers}"
// #     cp $x $p
// # done

// # for x in public/core_workers/*.js; do
// #     cp $x "${x/core_workers/workers}"
// # done

const bundler = new Bundler(Object.values(workers), {
  minify: true,
  outDir: '.registry',
  watch: false,
});

(async () => {
  const bundle = await bundler.bundle();
  bundle.childBundles.forEach((child) => {
    const thisOne = Object.keys(workers).find((worker) =>
      child.name.includes(
        (workers[worker] as string).substring(
          0,
          workers[worker].lastIndexOf('.')
        )
      )
    );

    shellac`
      $ cp ${child.name} public/workers/${thisOne}.monaco.worker.js
    `;
  });
})();

// console.log(
//   esbuild
//     .buildSync({
//       bundle: true,
//       define: {
//         'process.env.NODE_ENV': '"production"',
//       },
//       entryPoints: workers,
//       outdir: 'public/workers',
//     })
//     .outputFiles.map((f) => f.path)
// );
