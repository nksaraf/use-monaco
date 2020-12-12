import type { ICreateData } from 'monaco-graphql/dist/typings';
import { createPlugin } from '../../core';

export default (config: ICreateData['languageConfig']['schemaConfig']) =>
  createPlugin({ name: 'graphql', dependencies: ['core.worker'] }, (monaco) => {
    return monaco.worker.register({
      label: 'graphql',
      languageId: 'graphql',
      options: {
        languageConfig: {
          schemaConfig: config,
        },
      },
      src: monaco.worker.baseWorkerPath + 'graphql.monaco.worker.js',
      providers: {
        hover: true,
        documentFormattingEdit: true,
        completionItem: true,
        diagnostics: true,
      },
    });
  });
