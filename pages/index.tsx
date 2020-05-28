import React from 'react';
import { useMonaco } from '../src/useMonaco';
import { processDimensions } from '../src/utils';
import { useEditorModel } from '../src/useEditorModel';
import { useEditor } from '../src/useEditor';

let Editor = React.forwardRef<any, any>(
  ({ width = 800, height = 600, id = 'monaco', ...props }: any, ref) => {
    const { monaco, loading } = useMonaco({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/dev/vs',
      },
    });
    const model = useEditorModel({
      path: 'model.ts',
      monaco,
      defaultValue: [
        'function x() {',
        '\tconsole.log("Hello world!");',
        '}',
      ].join('\n'),
    });
    const { containerRef } = useEditor({ model, monaco });
    React.useEffect(() => {
      if (monaco) {
        console.log(
          monaco.worker.register({
            languageId: 'typescript',
            label: 'hello',
            providers: false,
          })
        );
      }
    }, [monaco]);

    return <div ref={containerRef} style={processDimensions(800, 600)} />;
  }
);

export default () => {
  return (
    <div>
      <Editor />
    </div>
  );
};
