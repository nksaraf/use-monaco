import * as monacoApi from 'monaco-editor';
import { asDisposable, disposeAll } from '../utils';
import { createWebWorker } from '../../node_modules/monaco-editor/esm/vs/editor/common/services/webWorker';
import './worker.contribution';
import { setupWorkerProviders } from './providers';

export class WorkerConfig<TOptions>
  implements monacoApi.IDisposable, monacoApi.worker.IWorkerConfig<TOptions> {
  _monaco: typeof monacoApi;
  private _onDidChange;
  private _config: monacoApi.worker.IWorkerConfig<TOptions>;
  constructor(
    config: monacoApi.worker.IWorkerConfig<TOptions>,
    monaco: typeof monacoApi
  ) {
    this._config = config;
    this._monaco = monaco;
    this._onDidChange = new this._monaco.Emitter<
      monacoApi.worker.IWorkerConfig<TOptions>
    >();
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

export class WorkerClient<TOptions, TWorker> implements monacoApi.IDisposable {
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
    this._config = new WorkerConfig(config, monaco);
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
      const _this = this;
      this._worker = createWebWorker<TWorker>(
        new Proxy(
          {},
          {
            get: function (target, prop, receiver) {
              if (prop === 'getModel') {
                return _this.monaco.editor.getModel;
              }
              if (prop === 'getModels') {
                return _this.monaco.editor.getModels;
              }
              throw new Error('Invalid operation on getModel');
            },
          }
        ),
        {
          moduleId:
            this.config.config.src ||
            this.monaco.worker.environment.workerLoader,
          label: this.config.label,
          createData: {
            ...this.config.options,
            label: this.config.label,
            path: this.config.config.src,
          },
        }
      );
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

export default (monaco: typeof monacoApi) => {
  // const createWebWorker = <TWorker>({
  //   moduleId,
  //   label,
  //   createData: {},
  // }): monacoApi.editor.MonacoWebWorker<TWorker> => {
  //   let worker = undefined;
  //   let proxy = undefined;
  //   return {
  //     getProxy: async () => {
  //       console.log(moduleId);
  //       const w = await fetch(moduleId, {
  //         method: 'GET',
  //       });
  //       var workerSrcBlob, workerBlobURL;
  //       workerSrcBlob = new Blob([await w.text()], {
  //         type: 'text/javascript',
  //       });
  //       workerBlobURL = window.URL.createObjectURL(workerSrcBlob);
  //       worker = new Worker(workerBlobURL);
  //       proxy = Comlink.wrap(worker);
  //       await proxy.initialize();
  //       console.log(proxy);
  //       // console.log(w);
  //       // var xhr = new XMLHttpRequest();
  //       // xhr.open('GET', moduleId);
  //       // xhr.onload = function() {
  //       //     if (xhr.status === 200) {
  //       //         var workerSrcBlob, workerBlobURL;
  //       //             workerSrcBlob = new Blob([xhr.responseText], { type: 'text/javascript' });
  //       //             workerBlobURL = window.URL.createObjectURL(workerSrcBlob);
  //       //             var worker = new Worker(workerBlobURL);
  //       //     }
  //       // };
  //       // xhr.send();
  //       // Comlink.wrap();
  //       return {} as TWorker;
  //     },
  //     withSyncedResources: async (resources: monacoApi.Uri[]) => {
  //       return {} as TWorker;
  //     },
  //     dispose: () => {},
  //   };
  // };
  // const javascriptClient: WorkerClient<
  //   monacoApi.languages.typescript.LanguageServiceDefaults,
  //   monacoApi.languages.typescript.TypeScriptWorker
  // > = {
  //   getSyncedWorker: async (
  //     ...resources: monacoApi.Uri[]
  //   ): Promise<monacoApi.languages.typescript.TypeScriptWorker> => {
  //     const getWorker = await monaco.languages.typescript.getJavaScriptWorker();
  //     return await getWorker(...resources);
  //   },
  //   // @ts-ignore
  //   config: monaco.languages.typescript.javascriptDefaults,
  // };
  // const typescriptClient: WorkerClient<
  //   monacoApi.languages.typescript.LanguageServiceDefaults,
  //   monacoApi.languages.typescript.TypeScriptWorker
  // > = {
  //   getSyncedWorker: async (
  //     ...resources: monacoApi.Uri[]
  //   ): Promise<monacoApi.languages.typescript.TypeScriptWorker> => {
  //     const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
  //     return await getWorker(...resources);
  //   },
  //   // @ts-ignore
  //   config: monaco.languages.typescript.typescriptDefaults,
  // };
  // function noop() {}
  // class MonacoWorkerApi {
  //   workerClients: { [key: string]: WorkerClient<any, any> } = {
  //     typescript: typescriptClient,
  //     javascript: javascriptClient,
  //   };
  //   environment: any = {};
  //   _workers: { [key: string]: WorkerClient<any, any> } = {};
  //   _monacoWorkerPath:
  //   _editor?: monacoApi.editor.ICodeEditor;
  //   _registerWorker<TOptions>({
  //     languageId,
  //     label = languageId,
  //     src: path,
  //     options,
  //     providers = defaultProviderConfig,
  //     onRegister,
  //   }: monacoApi.worker.IWorkerRegistrationOptions<TOptions>) {
  //     const client = new WorkerClient(
  //       {
  //         languageId,
  //         label,
  //         src: path,
  //         options,
  //         providers,
  //       },
  //       monaco
  //     );
  //     this.workerClients[label ?? ''] = client;
  //     if (onRegister) {
  //       onRegister(client, monaco);
  //     }
  //     return client;
  //   }
  //   register<TOptions>(
  //     config: monacoApi.worker.IWorkerRegistrationOptions<TOptions>
  //   ) {
  //     if (config.languageId) {
  //       return monaco.languages.onLanguage(config.languageId, () => {
  //         return this._registerWorker(config);
  //       });
  //     } else {
  //       return this._registerWorker(config);
  //     }
  //   }
  //   getClient<TOptions, TWorker>(label: string) {
  //     if (!this.workerClients[label]) {
  //       throw new Error(`Worker ${label} not registered!`);
  //     }
  //     return this.workerClients[label] as WorkerClient<TOptions, TWorker>;
  //   }
  //   setEditor(editor: monacoApi.editor.ICodeEditor) {
  //     this._editor = editor;
  //   }
  //   async getLanguage<TWorker>(...uri: monacoApi.Uri[]) {
  //     let language;
  //     if (uri.length === 0 && this._editor) {
  //       const model = this._editor?.getModel();
  //       if (model) {
  //         language = model.getModeId();
  //         uri.push(model.uri);
  //       }
  //     } else {
  //       const model = monaco.editor.getModel(uri[0]);
  //       if (model) {
  //         language = model.getModeId();
  //       }
  //     }
  //     if (!language) {
  //       return null;
  //     }
  //     return await this.get<TWorker>(language, ...uri);
  //   }
  //   async get<TWorker>(label: string, ...uri: monacoApi.Uri[]) {
  //     if (uri.length === 0 && this._editor) {
  //       const editorUri = this._editor.getModel()?.uri;
  //       editorUri && uri.push(editorUri);
  //     }
  //     return this.getClient<any, TWorker>(label).getSyncedWorker(...uri);
  //   }
  //   setConfig<TOptions>(
  //     label: string,
  //     config: monacoApi.worker.IWorkerConfig<TOptions>
  //   ) {
  //     this.getClient<TOptions, any>(label).config.setConfig(config);
  //   }
  //   updateOptions<TOptions>(label: string, options: TOptions) {
  //     this.getClient<TOptions, any>(label).config.setOptions(options);
  //   }
  //   setEnvironment({
  //     getWorkerUrl,
  //     getWorker,
  //     baseUrl,
  //     workerLoader = 'http://localhost:3000/workerLoader.js',
  //   }: {
  //     baseUrl?: string;
  //     getWorkerUrl?: (label: string) => string | undefined;
  //     getWorker?: (label: string) => Worker | undefined;
  //     workerLoader?: string;
  //   } = {}) {
  //     if (baseUrl || getWorker || getWorkerUrl) {
  //       const getWorkerPath = (_moduleId: string, label: string) => {
  //         const url = getWorkerUrl?.(label);
  //         if (url) return url;
  //         return undefined;
  //       };
  //       // @ts-ignore
  //       window.MonacoEnvironment = {
  //         // baseUrl: baseUrl,
  //         getWorker: (_moduleId: string, label: string) => {
  //           const worker = getWorker?.(label);
  //           if (worker) return worker;
  //           const url = getWorkerPath(_moduleId, label);
  //           if (url) {
  //             return new Worker(url);
  //           }
  //           return null;
  //         },
  //       };
  //     }
  //     this.environment = { baseUrl, workerLoader, getWorker, getWorkerUrl };
  //   }
  // }
  // Object.assign(monaco, {
  //   worker: new MonacoWorkerApi(),
  // });
  // return monaco;
};

// @ts-ignore
