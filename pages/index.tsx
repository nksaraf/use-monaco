import React from 'react';
import { useMonaco } from '../src/useMonaco';
import { processDimensions } from '../src/utils';
import { useMonacoModel } from '../src/useMonacoModel';
import { useEditor } from '../src/useEditor';
import '../src/prettier/prettier.monaco.worker';
import { prettier } from '../src/prettier';

let Editor = () => {
  const { monaco, loading } = useMonaco({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/dev/vs',
    },
    plugins: [prettier(['typescript'])],
  });

  const model = useMonacoModel({
    path: 'model.ts',
    monaco,
    defaultValue: [
      'function x() {',
      '\tconsole.log("Hello world!");',
      '}',
    ].join('\n'),
  });
  const { containerRef, editor } = useEditor({ model, monaco });

  return <div ref={containerRef} style={processDimensions(800, 600)} />;
};

export default () => {
  return (
    <div>
      <Editor />
    </div>
  );
};
