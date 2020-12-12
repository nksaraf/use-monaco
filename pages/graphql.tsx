import React from 'react';
import { useMonacoEditor } from '../src';
import themes from '../src/themes';
import { plugins } from '../src';

const defaultContents = `
query {
  allFilms { edges { node { id }}}
}
`;

let Editor = () => {
  const { containerRef } = useMonacoEditor({
    plugins: {
      graphql: {
        uri: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
      },
      worker: {
        path:
          `https://${process.env.VERCEL_URL}` ??
          'http://localhost:3000' + '/_next/static/workers',
      },
    },
    path: 'index.graphql',
    language: 'graphql',
    defaultContents,
    theme: 'vs-light',
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style
        // @ts-ignore
        jsx
        global
      >
        {`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont;
          }
        `}
      </style>
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
