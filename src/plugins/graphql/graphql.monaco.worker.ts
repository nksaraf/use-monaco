import { initialize, MonacoWorker } from '../../worker';
import { GraphQLWorker } from 'monaco-graphql/dist/GraphQLWorker';
import { printSchema } from 'graphql';

initialize(
  'graphql',
  class MonacoGraphQLWorker extends MonacoWorker {
    worker: GraphQLWorker;
    constructor(ctx, options) {
      super(ctx, options);
      this.worker = new GraphQLWorker(ctx, options);
      this.worker.loadSchema();
    }
    provideHover: MonacoWorker['provideHover'] = async (model, position) => {
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

    // Monaco will only make methods available from client (not properties)
    async doValidation(uri) {
      return await this.worker.doValidation(uri);
    }

    async getSchema() {
      return await this.worker
        .loadSchema(this.options.languageConfig.schemaConfig.uri)
        .then((schema) => {
          return printSchema(schema);
        });
    }

    provideDocumentFormattingEdits: MonacoWorker['provideDocumentFormattingEdits'] = async (
      model
    ) => {
      console.log('[graphql] formatting');
      const info = await this.worker.doFormat(model.getValue());
      const lines = info.split('\n');
      const formattedFulLRange = {
        startLineNumber: 1,
        endLineNumber: lines.length,
        startColumn: 0,
        endColumn: lines[lines.length - 1].length,
      };

      const originalFullRange = model.getFullModelRange();

      return [
        {
          range:
            originalFullRange.endLineNumber >
              formattedFulLRange.endLineNumber ||
            (originalFullRange.endLineNumber ===
              formattedFulLRange.endLineNumber &&
              originalFullRange.endColumn > formattedFulLRange.endColumn)
              ? originalFullRange
              : formattedFulLRange,
          text: info,
        },
      ];
    };
    provideCompletionItems: MonacoWorker['provideCompletionItems'] = async (
      model,
      pos,
      ctx
    ) => {
      const info = await this.worker.doComplete(model.uri.path, pos);
      return {
        suggestions: info as any,
      };
    };
    resolveCompletionItem: MonacoWorker['resolveCompletionItem'] = async (
      model,
      pos,
      item
    ) => {
      return item;
    };
  }
);
