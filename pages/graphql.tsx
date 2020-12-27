import React from 'react';
import { useEditor, useTextModel, useMonacoEditor, plugins } from '../src';

const defaultContents = `

query {
  allFilms { edges { node { i }}}
}

`;

let Editor = () => {
  const { containerRef, monaco } = useMonacoEditor({
    workersPath: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000' + '/_next/static/workers',
    languagesPath: '/languages/',
    plugins: [
      'prettier',
      'textmate',
      ['graphql', { uri: 'https://poke-api-delta.vercel.app/api/graphql' }],
    ],
    languages: ['graphql'],
    onThemeChange: console.log,
    path: 'index.graphql',
    options: {
      formatOnSave: true,
    },
    defaultContents,
  });

  const file = useTextModel({
    path: 'schema.graphql',
    monaco,
    contents: `

    query {
      pokemons { id titl }
    }
    
    `,
  });

  const { containerRef: containerRef2 } = useEditor({
    model: file,
    monaco,
    options: {
      // formatOnSave: true,
    },
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
          use-monaco a b
        </a>
      </pre>
      <div style={{ display: 'flex', flex: 1 }}>
        <div ref={containerRef} style={{ width: '100vw', height: '50%' }} />
        <div ref={containerRef2} style={{ width: '100vw', height: '50%' }} />
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
