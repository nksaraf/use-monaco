import {
  BaseWorker,
  initialize,
  IWorkerContext,
  importScript,
} from '../worker';

export class PrettierWorker extends BaseWorker {
  options: { parser: string; plugins: string[] };
  loader: Promise<any>;
  plugins: any[] = [];
  prettier: any = {};
  constructor(
    ctx: IWorkerContext<undefined>,
    config: { parser: string; plugins: string[] }
  ) {
    super(ctx, config);
    this.options = config;
    this.loader = this.importPrettier();
  }

  async importPrettier() {
    await importScript('https://unpkg.com/prettier@2.0.4/standalone.js');
    // @ts-ignore
    this.prettier = prettier;
    for (var plugin of this.options.plugins) {
      // this.plugins.push(
      await importScript(`https://unpkg.com/prettier@2.0.4/${plugin}.js`);
      // );
    }
    // @ts-ignore
    this.plugins = prettierPlugins;
  }

  provideDocumentFormattingEdits: BaseWorker['provideDocumentFormattingEdits'] = async (
    model
  ) => {
    const { plugins, ...options } = this.options;
    console.log(`[prettier] Formatting ...`);

    const text = this.prettier.format(model.getValue(), {
      plugins: this.plugins,
      singleQuote: true,
      ...options,
    });
    
    const lines = text.split('\n');
    const fullRange = { startLineNumber: 1, endLineNumber: lines.length, startColumn: 0, endColumn: lines[lines.length - 1].length }
    
    return [
      {
        range: fullRange,
        text,
      },
    ];
  };
}

initialize('prettier', PrettierWorker);
