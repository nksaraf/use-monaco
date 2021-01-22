import {
  MonacoProvider,
  useMonacoContext,
  useTextModel,
  useEditor,
} from '../src';

export default function MonacoProviderPage() {
  return (
    <MonacoProvider
      plugins={['typings']}
      languages={['javascript', 'typescript']}
      workersPath={
        process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000' + '/_next/static/workers'
      }
      languagesPath="/languages/"
    >
      <Editor />
    </MonacoProvider>
  );
}

const code = `
import { createState } from "@state-designer/core"

createState({
	data: { count: 0 },
	on: { INCREMENTED: 'increment' },
	actions: {
		increment: (data) => data.count++
	}
});

USER
`;

function Editor() {
  const { monaco, useMonacoEffect } = useMonacoContext();

  const model = useTextModel({
    monaco,
    path: 'index.ts',
    defaultContents: code,
    language: 'typescript',
  });

  const { containerRef } = useEditor({ model });

  useMonacoEffect((monaco) => {
    if (!monaco.languages.typescript) {
      console.warn(
        'You need to add the typescript language in order to load types.'
      );
      return;
    }

    monaco.languages.typescript.loadTypes?.('@state-designer/core', '1.3.35');
    monaco.languages.typescript.exposeGlobal?.(
      `import { createState as _createState } from '@state-designer/core';`,
      `export const USER: { name: string, age: number };
			 export const createState: typeof _createState;`
    );
  });

  return (
    <div>
      <h1>Monaco Provider Example</h1>
      <div ref={containerRef} style={{ height: 800, width: '100%' }}></div>
    </div>
  );
}
