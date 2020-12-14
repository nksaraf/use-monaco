import React from 'react';
import { useEditor, useFile, useMonacoEditor } from '../src';

const defaultContents = `

query {
  allFilms { edges { node { i }}}
}

`;

let Editor = () => {
  const { containerRef, monaco } = useMonacoEditor({
    plugins: {
      graphql: {
        uri: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
      },
      prettier: ['graphql'],
      worker: {
        path: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000' + '/_next/static/workers',
      },
    },
    path: 'index.graphql',
    defaultContents,
  });

  const file = useFile({
    path: 'schema.graphql',
    monaco,
    contents: `

    query {
      allFilms { edges { node { id }}}
    }
    
    `,
  });

  const { containerRef: containerRef2 } = useEditor({
    model: file,
    monaco,
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
