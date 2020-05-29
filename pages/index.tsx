import React from 'react';
import { useMonaco } from '../src/useMonaco';
import { processDimensions } from '../src/utils';
import { useMonacoModel } from '../src/useMonacoModel';
import { useEditor } from '../src/useEditor';
import '../src/prettier/prettier.monaco.worker';
import '../src/typings/typings.monaco.worker';
import { prettier } from '../src/prettier';
import { typings } from '../src/typings';

let Editor = () => {
  const { monaco, loading } = useMonaco({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/dev/vs',
    },
    plugins: [prettier(['typescript']), typings()],
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
  const { containerRef, editor } = useEditor({
    model,
    monaco,
    editorDidMount: (model) => {
      monaco.languages.typescript.loadTypes('faunadb', '2.13.0');
      monaco.languages.typescript.addGlobal(
        `
                        import * as faunadb from "./node_modules/faunadb";
  
                        declare global {
                          export const q: typeof faunadb.query
                        }
                        `
      );
    },
  });

  return <div ref={containerRef} style={processDimensions(800, 600)} />;
};

export default () => {
  return (
    <div>
      <Editor />
    </div>
  );
};
