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
    console.log(self);
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
    const text = this.prettier.format(model.getValue(), {
      plugins: this.plugins,
      singleQuote: true,
      ...options,
    });
    return [
      {
        range: model.getFullModelRange(),
        text,
      },
    ];
  };
}

initialize('prettier', PrettierWorker);
