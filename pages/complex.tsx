import React from 'react';
import {
  useLocalStorage,
  useFile,
  useEditor,
  useMonaco,
} from '../src';

export default function App() {
  const [val, setVal] = useLocalStorage(
    'index.graphql',
    `query { 
    pokemons { 
      id
    } 
  }`
  );

  const { monaco } = useMonaco({
    plugins: {
      worker: {
        path:
          `https://${process.env.VERCEL_URL}` ??
          'http://localhost:3000' + '/_next/static/workers',
      },
      graphql: { uri: 'https://poke-api-delta.vercel.app/api/graphql' },
    },
  });

  const model = useFile({
    path: 'index.graphql',
    monaco,
    defaultContents: val,
  });

  const { containerRef } = useEditor({
    monaco,
    model,
    // onChange,
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

// /
