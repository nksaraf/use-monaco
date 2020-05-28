import * as monacoApi from 'monaco-editor';
import { asDisposable, disposeAll } from '../utils';

declare module 'monaco-editor' {
  namespace worker {
    interface ILangProvidersOptions {
      reference?: boolean;
      rename?: boolean;
      signatureHelp?: boolean;
      hover?: boolean;
      documentSymbol?: boolean;
      documentHighlight?: boolean;
      definition?: boolean;
      implementation?: boolean;
      typeDefinition?: boolean;
      codeLens?: boolean;
      codeAction?: boolean;
      documentFormattingEdit?: boolean;
      documentRangeFormattingEdit?: boolean;
      onTypeFormattingEdit?: boolean;
      link?: boolean;
      completionItem?: boolean;
      completionTriggerCharacters?: string[];
      color?: boolean;
      foldingRange?: boolean;
      declaration?: boolean;
      selectionRange?: boolean;
      // via diagnostics provider
      diagnostics?: boolean;
      // documentSemanticTokens?: boolean
      // documentRangeSemanticTokens?: boolean
    }

    interface IWorkerAccessor<TWorker> {
      (...uris: monacoApi.Uri[]): Promise<TWorker>;
    }

    interface IWorkerConfig<TOptions> {
      label?: string;
      languageId?: string;
      path?: string;
      // to be passed on to the worker
      options?: TOptions;
      /* if boolean, all providers registered/not-registered,
      if object, more control over which specific providers are registered */
      providers?: boolean | ILangProvidersOptions;
    }

    interface IWorkerRegistrationOptions<T> extends IWorkerConfig<T> {
      onRegister?: (
        // client: WorkerClient<T, any>,
        client: any,
        monaco: typeof monacoApi
      ) => void;
    }

    function register<TOptions>(
      config: worker.IWorkerConfig<TOptions>
    ): monacoApi.IDisposable;

    function getClient<TOptions, TWorker extends any>(label: string): any;
    // ): WorkerClient<TOptions, TWorker>;

    // provided in MonacoEditor.tsx
    function setEditor(editor: monacoApi.editor.ICodeEditor): void;
    function getLanguage<TWorker extends any>(
      ...uri: monacoApi.Uri[]
    ): Promise<TWorker>;
    function get<TWorker extends any>(
      label: string,
      ...uri: monacoApi.Uri[]
    ): Promise<TWorker>;

    function setEnvironment(environment: {
      baseUrl?: string;
      getWorkerUrl?: (label: string) => string | undefined;
      getWorker?: (label: string) => Worker | undefined;
    }): void;

    function updateConfig<TOptions>(
      label: string,
      config?: Omit<
        monacoApi.worker.IWorkerConfig<TOptions>,
        'languageId' | 'label'
      >
    ): void;

    function updateOptions<TOptions>(label: string, options?: TOptions): void;
  }
}

export const defaultProviderConfig = {
  reference: true,
  rename: true,
  signatureHelp: true,
  hover: true,
  documentSymbol: true,
  documentHighlight: true,
  definition: true,
  implementation: true,
  typeDefinition: true,
  codeLens: true,
  codeAction: true,
  documentFormattingEdit: true,
  documentRangeFormattingEdit: true,
  onTypeFormattingEdit: true,
  link: true,
  completionItem: true,
  color: true,
  foldingRange: true,
  declaration: true,
  selectionRange: true,
  diagnostics: true,
  documentSemanticTokens: true,
  documentRangeSemanticTokens: true,
};

export const getProvider = (
  getWorker: monacoApi.worker.IWorkerAccessor<any>,
  provider: string
) => {
  return async (model: monacoApi.editor.IModel, ...args: any[]) => {
    let resource = model.uri;
    try {
      const worker = await getWorker(resource);
      return await worker.provide(
        provider,
        resource.toString(),
        ...args.slice(0, args.length - 1)
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  };
};

const getSignatureHelpProvider = (
  getWorker: monacoApi.worker.IWorkerAccessor<any>
) => {
  return async (
    model: monacoApi.editor.ITextModel,
    position: monacoApi.IPosition,
    token: monacoApi.CancellationToken,
    context: monacoApi.languages.SignatureHelpContext
  ) => {
    let resource = model.uri;
    try {
      const worker = await getWorker(resource);
      return await worker.provide(
        'signatureHelp',
        resource.toString(),
        position,
        context
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  };
};

export const getResolver = (
  getWorker: monacoApi.worker.IWorkerAccessor<any>,
  resolver: string
) => {
  return async (model: monacoApi.editor.IModel, ...args: any[]) => {
    let resource = model.uri;
    try {
      const worker = await getWorker(resource);
      return await worker.resolve(
        resolver,
        resource.toString(),
        ...args.slice(0, args.length - 1)
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  };
};

export default (monaco: typeof monacoApi) => {
  class WorkerConfig<TOptions>
    implements monacoApi.IDisposable, monacoApi.worker.IWorkerConfig<TOptions> {
    private _onDidChange = new monaco.Emitter<
      monacoApi.worker.IWorkerConfig<TOptions>
    >();
    private _config: monacoApi.worker.IWorkerConfig<TOptions>;
    constructor(config: monacoApi.worker.IWorkerConfig<TOptions>) {
      this._config = config;
    }
    // @ts-ignore

    get onDidChange(): monacoApi.IEvent<
      monacoApi.worker.IWorkerConfig<TOptions>
    > {
      return this._onDidChange.event;
    }

    dispose(): void {
      this._onDidChange.dispose();
    }

    get config(): monacoApi.worker.IWorkerConfig<TOptions> {
      return this._config;
    }

    get languageId() {
      return this._config.languageId;
    }

    get label() {
      return this._config.label;
    }

    get providers() {
      return this._config.providers;
    }

    get options() {
      return this._config.options;
    }

    setConfig(config: monacoApi.worker.IWorkerConfig<TOptions>) {
      this._config = Object.assign({}, this._config, config);
      this._onDidChange.fire(this._config);
    }

    setOptions(options: TOptions) {
      this._config.options = Object.assign({}, this._config.options, options);
      this._onDidChange.fire(this._config);
    }
  }

  const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000; // 2min

  class WorkerClient<TOptions, TWorker> implements monacoApi.IDisposable {
    private _config: WorkerConfig<TOptions>;
    private _idleCheckInterval: number;
    private _lastUsedTime: number;
    private _worker: monacoApi.editor.MonacoWebWorker<TWorker> | null;
    private _client: Promise<TWorker> | null;
    private _providerDisposables: monacoApi.IDisposable[];
    private _disposables: monacoApi.IDisposable[];

    monaco: typeof monacoApi;

    constructor(
      config: monacoApi.worker.IWorkerConfig<TOptions>,
      monaco: typeof monacoApi
    ) {
      this._config = new WorkerConfig(config);
      this.monaco = monaco;
      this._idleCheckInterval = window.setInterval(
        () => this._checkIfIdle(),
        30 * 1000
      );
      this._lastUsedTime = 0;
      this._worker = null;
      this._client = null;
      const stopWorkerConfigListener = this._config.onDidChange(() =>
        this._stopWorker()
      );
      const registerProviderListener = this._config.onDidChange(() =>
        this._registerProviders()
      );
      this._providerDisposables = [];
      this._disposables = [
        stopWorkerConfigListener,
        registerProviderListener,
        this._config,
      ];
      this._registerProviders();
    }

    private _stopWorker(): void {
      if (this._worker) {
        this._worker.dispose();
        this._worker = null;
      }
      this._client = null;
    }

    dispose(): void {
      clearInterval(this._idleCheckInterval);
      disposeAll(this._disposables);
      this._stopWorker();
    }

    _registerProviders() {
      if (this.config.languageId) {
        disposeAll(this._providerDisposables);
        this._providerDisposables = setupWorkerProviders(
          this.config.languageId,
          this.config.providers,
          this,
          this.monaco
        );
        this._disposables.push(asDisposable(this._providerDisposables));
      }
    }

    get config(): WorkerConfig<TOptions> {
      return this._config;
    }

    get onConfigDidChange(): monacoApi.IEvent<
      monacoApi.worker.IWorkerConfig<TOptions>
    > {
      return this._config.onDidChange;
    }

    private _checkIfIdle(): void {
      if (!this._worker) {
        return;
      }
      let timePassedSinceLastUsed = Date.now() - this._lastUsedTime;
      if (timePassedSinceLastUsed > STOP_WHEN_IDLE_FOR) {
        this._stopWorker();
      }
    }

    private _getClient(): Promise<TWorker> {
      this._lastUsedTime = Date.now();
      if (!this._client) {
        this._worker = this.monaco.editor.createWebWorker<TWorker>({
          moduleId: `http://localhost:3000/workerLoader`,
          label: this.config.label,
          createData: {
            ...this.config.options,
            label: this.config.label,
            path: this.config.config.path,
          },
        });
        // this._worker = this.monaco.editor.createWebWorker<TWorker>({
        //   moduleId: `vs/language,
        //   label: this.config.label,
        //   createData: {
        //     ...this.config.options,
        //     label: this.config.label,
        //     path: this.config.config.path
        // });
        this._client = this._worker.getProxy() as Promise<TWorker>;
      }

      return this._client;
    }

    async getSyncedWorker(...resources: monacoApi.Uri[]): Promise<TWorker> {
      const client = await this._getClient();
      await this._worker?.withSyncedResources(resources);
      return client;
    }
  }

  class DiagnosticsProvider {
    private _disposables: monacoApi.IDisposable[] = [];
    private _listener: { [uri: string]: monacoApi.IDisposable } = Object.create(
      null
    );
    private _editor?: monacoApi.editor.ICodeEditor;
    private _client?: WorkerClient<any, any>;
    monaco: typeof monacoApi;
    isActiveModel(model: monacoApi.editor.ITextModel) {
      if (this._editor) {
        const currentModel = this._editor.getModel();
        if (
          currentModel &&
          currentModel.uri.toString() === model.uri.toString()
        ) {
          return true;
        }
      }

      return false;
    }

    constructor(
      private client: WorkerClient<any, any>,
      monaco: typeof monacoApi
    ) {
      this._client = client;
      this.monaco = monaco;
      this._disposables.push(
        monaco.editor.onDidCreateEditor((editor) => {
          this._editor = editor;
        })
      );
      const onModelAdd = (model: monacoApi.editor.IModel): void => {
        const modeId = model.getModeId();
        if (modeId !== client.config.languageId) {
          return;
        }

        let handle: number;
        this._listener[model.uri.toString()] = model.onDidChangeContent(() => {
          clearTimeout(handle);
          // @ts-ignore
          handle = setTimeout(() => {
            if (this.isActiveModel(model)) {
              this._doValidate(model.uri, modeId);
            }
          }, 500);
        });

        // if (this.isActiveModel(model)) {
        //   this._doValidate(model.uri, modeId);
        // }
      };

      const onModelRemoved = (model: monacoApi.editor.IModel): void => {
        monaco.editor.setModelMarkers(
          model,
          client.config.languageId ?? '',
          []
        );
        const uriStr = model.uri.toString();
        const listener = this._listener[uriStr];
        if (listener) {
          listener.dispose();
          delete this._listener[uriStr];
        }
      };

      this._disposables.push(monaco.editor.onDidCreateModel(onModelAdd));
      this._disposables.push(
        monaco.editor.onWillDisposeModel((model) => {
          onModelRemoved(model);
        })
      );
      this._disposables.push(
        monaco.editor.onDidChangeModelLanguage((event) => {
          onModelRemoved(event.model);
          onModelAdd(event.model);
        })
      );

      this._disposables.push(
        client.onConfigDidChange((_: any) => {
          monaco.editor.getModels().forEach((model) => {
            if (model.getModeId() === client.config.languageId) {
              onModelRemoved(model);
              onModelAdd(model);
            }
          });
        })
      );

      this._disposables.push({
        dispose: () => {
          for (const key in this._listener) {
            this._listener[key].dispose();
          }
        },
      });

      // monaco.editor.getModels().forEach(onModelAdd);
    }

    public dispose(): void {
      this._disposables.forEach((d) => d && d.dispose());
      this._disposables = [];
    }

    private async _doValidate(resource: monacoApi.Uri, languageId: string) {
      try {
        const worker = await this.client.getSyncedWorker(resource);
        const diagnostics = await worker.doValidation(resource.toString());
        this.monaco.editor.setModelMarkers(
          this.monaco.editor.getModel(resource) as monacoApi.editor.ITextModel,
          languageId,
          diagnostics
        );
      } catch (e) {
        console.error(e);
        return null;
      }
    }
  }

  const setupWorkerProviders = (
    languageId: string,
    providers:
      | monacoApi.worker.ILangProvidersOptions
      | boolean = defaultProviderConfig,
    client: WorkerClient<any, any>,
    monaco: typeof monacoApi
  ): monacoApi.IDisposable[] => {
    const disposables: monacoApi.IDisposable[] = [];
    if (!providers) {
      return [];
    }

    const getWorker = async (...resources: monacoApi.Uri[]) => {
      return await client.getSyncedWorker(...resources);
    };

    providers =
      typeof providers === 'boolean' && providers
        ? defaultProviderConfig
        : (providers as monacoApi.worker.ILangProvidersOptions);

    if (providers.diagnostics) {
      disposables.push(new DiagnosticsProvider(client, monaco));
    }

    if (providers.reference) {
      disposables.push(
        monaco.languages.registerReferenceProvider(languageId, {
          provideReferences: getProvider(getWorker, 'references'),
        })
      );
    }
    if (providers.rename) {
      disposables.push(
        monaco.languages.registerRenameProvider(languageId, {
          provideRenameEdits: getProvider(getWorker, 'renameEdits'),
          resolveRenameLocation: getResolver(getWorker, 'renameLocation'),
        })
      );
    }
    if (providers.signatureHelp) {
      disposables.push(
        monaco.languages.registerSignatureHelpProvider(languageId, {
          provideSignatureHelp: getSignatureHelpProvider(getWorker),
        })
      );
    }
    if (providers.hover) {
      disposables.push(
        monaco.languages.registerHoverProvider(languageId, {
          provideHover: getProvider(getWorker, 'hover'),
        })
      );
    }
    if (providers.documentSymbol) {
      disposables.push(
        monaco.languages.registerDocumentSymbolProvider(languageId, {
          provideDocumentSymbols: getProvider(getWorker, 'documentSymbols'),
        })
      );
    }
    if (providers.documentHighlight) {
      disposables.push(
        monaco.languages.registerDocumentHighlightProvider(languageId, {
          provideDocumentHighlights: getProvider(
            getWorker,
            'documentHighlights'
          ),
        })
      );
    }
    if (providers.definition) {
      disposables.push(
        monaco.languages.registerDefinitionProvider(languageId, {
          provideDefinition: getProvider(getWorker, 'definition'),
        })
      );
    }
    if (providers.implementation) {
      disposables.push(
        monaco.languages.registerImplementationProvider(languageId, {
          provideImplementation: getProvider(getWorker, 'implementation'),
        })
      );
    }
    if (providers.typeDefinition) {
      disposables.push(
        monaco.languages.registerTypeDefinitionProvider(languageId, {
          provideTypeDefinition: getProvider(getWorker, 'typeDefinition'),
        })
      );
    }
    if (providers.codeLens) {
      disposables.push(
        monaco.languages.registerCodeLensProvider(languageId, {
          provideCodeLenses: getProvider(getWorker, 'codeLenses'),
          resolveCodeLens: getResolver(getWorker, 'codeLens'),
        })
      );
    }
    if (providers.codeAction) {
      disposables.push(
        monaco.languages.registerCodeActionProvider(languageId, {
          provideCodeActions: getProvider(getWorker, 'codeActions'),
        })
      );
    }
    if (providers.documentFormattingEdit) {
      disposables.push(
        monaco.languages.registerDocumentFormattingEditProvider(languageId, {
          provideDocumentFormattingEdits: getProvider(
            getWorker,
            'documentFormattingEdits'
          ),
        })
      );
    }
    if (providers.documentRangeFormattingEdit) {
      disposables.push(
        monaco.languages.registerDocumentRangeFormattingEditProvider(
          languageId,
          {
            provideDocumentRangeFormattingEdits: getProvider(
              getWorker,
              'documentRangeFormattingEdits'
            ),
          }
        )
      );
    }
    // if (providers.onTypeFormattingEdit) {
    //   disposables.push(
    //     monaco.languages.registerOnTypeFormattingEditProvider(languageId, {
    //       provideOnTypeFormattingEdits: getProvider(
    //         getWorker,
    //         'onTypeFormattingEdits'
    //       ),
    //     })
    //   );
    // }
    if (providers.link) {
      disposables.push(
        monaco.languages.registerLinkProvider(languageId, {
          provideLinks: getProvider(getWorker, 'links'),
        })
      );
    }
    if (providers.completionItem) {
      disposables.push(
        monaco.languages.registerCompletionItemProvider(languageId, {
          triggerCharacters: providers.completionTriggerCharacters || [],
          provideCompletionItems: getProvider(getWorker, 'completionItems'),
          resolveCompletionItem: getResolver(getWorker, 'completionItem'),
        })
      );
    }
    if (providers.color) {
      disposables.push(
        monaco.languages.registerColorProvider(languageId, {
          provideDocumentColors: getProvider(getWorker, 'documentColors'),
          provideColorPresentations: getProvider(
            getWorker,
            'colorPresentations'
          ),
        })
      );
    }
    if (providers.foldingRange) {
      disposables.push(
        monaco.languages.registerFoldingRangeProvider(languageId, {
          provideFoldingRanges: getProvider(getWorker, 'foldingRanges'),
        })
      );
    }
    if (providers.declaration) {
      disposables.push(
        monaco.languages.registerDeclarationProvider(languageId, {
          provideDeclaration: getProvider(getWorker, 'declaration'),
        })
      );
    }
    if (providers.selectionRange) {
      disposables.push(
        monaco.languages.registerSelectionRangeProvider(languageId, {
          provideSelectionRanges: getProvider(getWorker, 'selectionRanges'),
        })
      );
    }

    return disposables;

    // if (providers.onTypeFormattingEdit) {
    //     monaco.languages.registerOnTypeFormattingEditProvider(languageId, {
    // provideOnTypeFormattingEdits: getProvider(getWorker, 'onTypeFormattingEdits')
    // });
    // }
  };
  const javascriptClient: WorkerClient<
    monacoApi.languages.typescript.LanguageServiceDefaults,
    monacoApi.languages.typescript.TypeScriptWorker
  > = {
    getSyncedWorker: async (
      ...resources: monacoApi.Uri[]
    ): Promise<monacoApi.languages.typescript.TypeScriptWorker> => {
      const getWorker = await monaco.languages.typescript.getJavaScriptWorker();
      return await getWorker(...resources);
    },
    // @ts-ignore
    config: monaco.languages.typescript.javascriptDefaults,
  };

  const typescriptClient: WorkerClient<
    monacoApi.languages.typescript.LanguageServiceDefaults,
    monacoApi.languages.typescript.TypeScriptWorker
  > = {
    getSyncedWorker: async (
      ...resources: monacoApi.Uri[]
    ): Promise<monacoApi.languages.typescript.TypeScriptWorker> => {
      const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
      return await getWorker(...resources);
    },
    // @ts-ignore
    config: monaco.languages.typescript.typescriptDefaults,
  };

  function noop() {}

  class MonacoWorkerApi {
    workerClients: { [key: string]: WorkerClient<any, any> } = {
      typescript: typescriptClient,
      javascript: javascriptClient,
    };

    _editor?: monacoApi.editor.ICodeEditor;
    _registerWorker<TOptions>({
      languageId,
      label = languageId,
      path,
      options,
      providers = defaultProviderConfig,
      onRegister,
    }: monacoApi.worker.IWorkerRegistrationOptions<TOptions>) {
      const client = new WorkerClient(
        {
          languageId,
          label,
          path,
          options,
          providers,
        },
        monaco
      );
      this.workerClients[label ?? ''] = client;
      if (onRegister) {
        onRegister(client, monaco);
      }
      return client;
    }

    register<TOptions>(
      config: monacoApi.worker.IWorkerRegistrationOptions<TOptions>
    ) {
      if (config.languageId) {
        return monaco.languages.onLanguage(config.languageId, () => {
          return this._registerWorker(config);
        });
      } else {
        return this._registerWorker(config);
      }
    }

    getClient<TOptions, TWorker>(label: string) {
      if (!this.workerClients[label]) {
        throw new Error(`Worker ${label} not registered!`);
      }

      return this.workerClients[label] as WorkerClient<TOptions, TWorker>;
    }

    setEditor(editor: monacoApi.editor.ICodeEditor) {
      this._editor = editor;
    }

    async getLanguage<TWorker>(...uri: monacoApi.Uri[]) {
      let language;
      if (uri.length === 0 && this._editor) {
        const model = this._editor?.getModel();
        if (model) {
          language = model.getModeId();
          uri.push(model.uri);
        }
      } else {
        const model = monaco.editor.getModel(uri[0]);
        if (model) {
          language = model.getModeId();
        }
      }
      if (!language) {
        return null;
      }

      return await this.get<TWorker>(language, ...uri);
    }

    async get<TWorker>(label: string, ...uri: monacoApi.Uri[]) {
      if (uri.length === 0 && this._editor) {
        const editorUri = this._editor.getModel()?.uri;
        editorUri && uri.push(editorUri);
      }

      return this.getClient<any, TWorker>(label).getSyncedWorker(...uri);
    }

    setConfig<TOptions>(
      label: string,
      config: monacoApi.worker.IWorkerConfig<TOptions>
    ) {
      this.getClient<TOptions, any>(label).config.setConfig(config);
    }

    updateOptions<TOptions>(label: string, options: TOptions) {
      this.getClient<TOptions, any>(label).config.setOptions(options);
    }

    setEnvironment({
      getWorkerUrl = noop as any,
      getWorker = noop as any,
      baseUrl = '/',
    }: {
      baseUrl?: string;
      getWorkerUrl?: (label: string) => string | undefined;
      getWorker?: (label: string) => Worker | undefined;
    }) {
      const getWorkerPath = (_moduleId: string, label: string) => {
        const url = getWorkerUrl(label);
        if (url) return url;
        return undefined;
      };
      // @ts-ignore
      window.MonacoEnvironment = {
        baseUrl: baseUrl,
        getWorker: (_moduleId: string, label: string) => {
          const worker = getWorker(label);
          if (worker) return worker;

          const url = getWorkerPath(_moduleId, label);
          if (url) {
            return new Worker(baseUrl + url);
          }
          return null;
        },
      };
    }
  }

  Object.assign(monaco, {
    worker: new MonacoWorkerApi(),
  });
  return monaco;
};

// @ts-ignore
