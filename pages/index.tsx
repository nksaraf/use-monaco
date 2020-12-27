import React from 'react';
import { plugins, useMonacoEditor } from '../src';
import themes from '../src/themes';

const defaultContents = `
import {
  useMonacoEditor,
  prettier,
} from 'https://cdn.pika.dev/use-monaco@0.0.3';
import themes from 'https://cdn.pika.dev/use-monaco@0.0.3/themes';
import * as React from 'https://cdn.pika.dev/react';
import ReactDOM from 'https://cdn.pika.dev/react-dom';
import htm from 'https://cdn.pika.dev/htm';
const html = htm.bind(React.createElement);

 createState(1);


let Editor = () => {
  const { containerRef, monaco, model, loading } = useMonacoEditor({
    plugins: [prettier(['graphq'])],
    themes,
    theme: 'github',
    path: 'model.graphql',
    defaultValue: ['type Query {}'].join(''),
  });

  return html\`<div
    ref=\${containerRef}
    style=\${{ height: 800, width: 600 }}
  />\`;
};

ReactDOM.render(html\`<\${Editor} />\`, document.getElementById('root'));

`;

let Editor = () => {
  const { containerRef } = useMonacoEditor({
    plugins: ['prettier', 'typings'],
    onLoad: (monaco) => {
      monaco.languages.typescript?.loadTypes('faunadb', '2.13.0');
      monaco.languages.typescript?.loadTypes('state-designer', '1.3.35');
      monaco.languages.typescript?.loadTypes('@state-designer/core', '1.3.35');
      monaco.languages.typescript?.loadTypes('@state-designer/react', '1.3.35');
      monaco.languages.typescript?.exposeGlobal(
        `import { createState as _createState } from 'state-designer';`,
        `export const createState: typeof _createState;`
      );
      monaco.languages.typescript?.exposeGlobal(
        `import { query } from 'faunadb';`,
        `export const q: typeof query;`
      );
    },
    workersPath: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000' + '/_next/static/workers',
    languagesPath: '/languages/',
    path: 'index.ts',
    language: 'typescript',
    defaultContents,
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <pre
        style={{ fontFamily: 'SF Mono', fontWeight: 'bold', marginLeft: 32 }}
      >
        🗒️{' '}
        <a
          href="https://github.com/nksaraf/use-monaco"
          style={{ textDecoration: 'none' }}
        >
          use-monaco
        </a>
      </pre>
      <div style={{ display: 'flex', flex: 1 }}>
        <div ref={containerRef} style={{ width: '100vw', height: '100%' }} />
      </div>
    </div>
  );
};

export default () => {
  return (
    <div>
      <Editor />
    </div>
  );
};
