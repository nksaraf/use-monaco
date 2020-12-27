import React from 'react';
import { useLocalStorage, useTextModel, useEditor, plugins } from '../src';
import { withMonaco } from '../src';

export function App() {
  const [val, setVal] = useLocalStorage(
    'index.graphql',
    `query { 
    pokemons { 
      id
    } 
  }`
  );

  const model = useTextModel({
    path: 'index.graphql',
    defaultContents: val,
  });

  const { containerRef } = useEditor({
    model,
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
      {v && <div ref={containerRef} style={{ height: 500, width: 500 }}></div>}
    </div>
  );
}

export default withMonaco(
  {
    workersPath: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000' + '/_next/static/workers',
    languagesPath: '/languages/',
    languages: ['graphql'],
    plugins: [
      plugins.prettier(),
      plugins.graphql({ uri: 'https://poke-api-delta.vercel.app/api/graphql' }),
    ],
  },
  App
);
