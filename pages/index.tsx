import React from 'react';
import { useMonacoEditor, typings, prettier } from '../src';
import themes from 'sandkit/themes';

let Editor = () => {
  const { containerRef, editor, monaco, loading } = useMonacoEditor({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/dev/vs',
    },
    themes: themes as any,
    plugins: [prettier(['typescript']), typings()],
    path: 'model.ts',
    defaultValue: [
      'function x() {',
      '\tconsole.log("Hello world!");',
      '}',
    ].join('\n'),
    theme: 'vs-light',
    editorDidMount: (editor, monaco) => {
      monaco.languages.typescript.loadTypes('faunadb', '2.13.0');
      monaco.languages.typescript.exposeGlobal('faunadb', 'query', 'q');
    },
  });

  return <div ref={containerRef} style={{ width: 800, height: 600 }} />;
};

export default () => {
  return (
    <div>
      <Editor />
    </div>
  );
};
