import React from 'react';
import { useMonacoEditor, typings, prettier } from '../src';
import themes from '../src/themes';

const defaultValue = `<body>
<div id="root"></div>
<script defer type="module">
  import {
    useMonacoEditor,
    prettier,
  } from 'https://cdn.pika.dev/use-monaco@0.0.3';
  import themes from 'https://cdn.pika.dev/use-monaco@0.0.3/themes';
  import * as React from 'https://cdn.pika.dev/react';
  import ReactDOM from 'https://cdn.pika.dev/react-dom';
  import htm from 'https://cdn.pika.dev/htm';
  const html = htm.bind(React.createElement);

  let Editor = () => {
    const { containerRef, monaco, model, loading } = useMonacoEditor({
      plugins: [prettier(['graphq'])],
      themes,
      theme: 'github',
      path: 'model.graphql',
      defaultValue: ['type Query {}'].join('\\n'),
    });

    return html\`<div
      ref=\${containerRef}
      style=${{ height: 800, width: 600 }}
    />\`;
  };

  ReactDOM.render(html\`<\${Editor} />\`, document.getElementById('root'));
</script>
</body>
`;

let Editor = () => {
  const { containerRef, editor, monaco, loading } = useMonacoEditor({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/min/vs',
    },
    themes: themes as any,
    plugins: [prettier(['html']), typings()],
    path: 'index.html',
    language: 'html',
    defaultValue,
    theme: 'vs-light',
    // editorDidMount: (editor, monaco) => {
    //   monaco.languages.typescript.loadTypes('faunadb', '2.13.0');
    //   monaco.languages.typescript.exposeGlobal('faunadb', 'query', 'q');
    // },
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
