import React from 'react';
import {
  useMonacoEditor,
  plugins,
  useLocalStorage,
  useTextModel,
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
    paths: {
      workers: 'http://localhost:3000/_next/static/workers',
    },
    plugins: [
      plugins.graphql({ uri: 'https://poke-api-delta.vercel.app/api/graphql' }),
    ],
  });

  const model = useTextModel({
    path: 'index.graphql',
    monaco,
    defaultValue: val,
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
