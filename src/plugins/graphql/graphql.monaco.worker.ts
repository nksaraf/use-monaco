import { initialize, BaseWorker } from '../../worker';
import { GraphQLWorker } from 'monaco-graphql/dist/GraphQLWorker';

initialize(
  'graphql',
  class MonacoGraphQLWorker extends BaseWorker {
    worker: GraphQLWorker;
    constructor(ctx, options) {
      super(ctx, options);
      this.worker = new GraphQLWorker(ctx, options);
      this.worker.loadSchema();
    }
    provideHover: BaseWorker['provideHover'] = async (model, position) => {
      const info = await this.worker.doHover(model.uri.path, position);
      return {
        contents: [{ value: info.content as string }],
        range: {
          ...info.range,
          startLineNumber: info.range.startLineNumber + 1,
          endLineNumber: info.range.endLineNumber + 1,
        },
      };
    };
    doValidation: BaseWorker['doValidation'] = async (uri) => {
      return await this.worker.doValidation(uri);
    };

    provideDocumentFormattingEdits: BaseWorker['provideDocumentFormattingEdits'] = async (
      model
    ) => {
      const info = await this.worker.doFormat(model.getValue());
      const lines = info.split('\n');
      return [
        {
          range: {
            startLineNumber: 1,
            endLineNumber: lines.length,
            startColumn: 0,
            endColumn: lines[lines.length - 1].length,
          },
          text: info,
        },
      ];
    };
    provideCompletionItems: BaseWorker['provideCompletionItems'] = async (
      model,
      pos,
      ctx
    ) => {
      const info = await this.worker.doComplete(model.uri.path, pos);
      return {
        suggestions: info as any,
      };
    };
    resolveCompletionItem: BaseWorker['resolveCompletionItem'] = async (
      model,
      pos,
      item
    ) => {
      return item;
    };
  }
);
