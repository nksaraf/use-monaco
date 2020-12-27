import React from 'react';
import {
  useLocalStorage,
  useTextModel,
  useEditor,
  useMonacoContext,
} from '../src';

const contents =
  '<!DOCTYPE html><html><head><style data-next-hide-fouc="true">body{display:none}</style><noscript data-next-hide-fouc="true"><style>body{display:block}</style></noscript><meta charSet="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="next-head-count" content="2"/><link rel="preload" href="/_next/static/development/pages/vscode-base.js?ts=1608992479037" as="script"/><link rel="preload" href="/_next/static/development/pages/_app.js?ts=1608992479037" as="script"/><link rel="preload" href="/_next/static/runtime/webpack.js?ts=1608992479037" as="script"/><link rel="preload" href="/_next/static/runtime/main.js?ts=1608992479037" as="script"/><noscript id="__next_css__DO_NOT_USE__"></noscript></head><body><div id="__next"><div><div class="App"><h1>use-monaco with graphql</h1><button>Hide</button></div><div style="height:500px;width:500px"></div></div></div><script src="/_next/static/development/dll/dll_6ae9ca1ec46dda852ac9.js?ts=1608992479037"></script><script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{}},"page":"/vscode-base","query":{},"buildId":"development","nextExport":true,"autoExport":true,"isFallback":false}</script><script nomodule="" src="/_next/static/runtime/polyfills.js?ts=1608992479037"></script><script async="" data-next-page="/vscode-base" src="/_next/static/development/pages/vscode-base.js?ts=1608992479037"></script><script async="" data-next-page="/_app" src="/_next/static/development/pages/_app.js?ts=1608992479037"></script><script src="/_next/static/runtime/webpack.js?ts=1608992479037" async=""></script><script src="/_next/static/runtime/main.js?ts=1608992479037" async=""></script><script src="/_next/static/development/_buildManifest.js?ts=1608992479037" async=""></script><script src="/_next/static/development/_ssgManifest.js?ts=1608992479037" async=""></script></body></html>';

import { withMonaco } from '../src';

export function App() {
  const { useMonacoEffect } = useMonacoContext();
  const [themeText, setTheme] = useLocalStorage('temp.theme.json', 'vs-dark');

  useMonacoEffect(
    (monaco) => {
      if (monaco) {
        monaco.editor.setTheme(themeText as any);
      }
    },
    [themeText]
  );

  const editor1 = useEditor({
    model: useTextModel({
      path: 'theme.html',
      defaultContents: contents,
    }),
    options: {
      formatOnSave: true, // a
    },
  });

  const editor2 = useEditor({
    model: useTextModel({
      path: 'theme.css',
      defaultContents: `body {
        margin: 0px;
      }`,
    }),
    options: {
      formatOnSave: true, // a
    },
  });

  const editor3 = useEditor({
    model: useTextModel({
      path: 'theme.ts',
      defaultContents: `export default function something() {
        return 1;
      }`,
    }),
    options: {
      formatOnSave: true, // a
    },
  });
  const editor4 = useEditor({
    model: useTextModel({
      path: 'theme.json',
      contents: themeText,
    }),
    onChange: (val) => setTheme(val),
    options: {
      formatOnSave: true, // a
    },
  });

  const [v, setv] = React.useState(true);
  return (
    <div>
      <div className="App">
        <h1>use-monaco with graphql</h1>
        <button onClick={() => setv((o) => !o)}>Hide</button>
      </div>
      <div>
        {v && (
          <div
            ref={editor1.containerRef}
            style={{ height: 200, width: 500 }}
          ></div>
        )}
        {v && (
          <div
            ref={editor2.containerRef}
            style={{ height: 200, width: 500 }}
          ></div>
        )}
        {v && (
          <div
            ref={editor3.containerRef}
            style={{ height: 200, width: 500 }}
          ></div>
        )}
        {v && (
          <div
            ref={editor4.containerRef}
            style={{ height: 200, width: 500 }}
          ></div>
        )}
      </div>
    </div>
  );
}

export default withMonaco(
  {
    onThemeChange: console.log,
    theme: null,
    languagesPath: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000' + '/languages/',
    // languagesPath: 'http://localhost:3000/languages',
    workersPath: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000' + '/_next/static/workers',
    plugins: ['textmate', 'prettier', 'vscode-themes'],
    languages: ['typescript', 'json', 'html', 'css'],
  },
  App
);
