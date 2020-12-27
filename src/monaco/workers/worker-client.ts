import type * as monacoApi from 'monaco-editor';
import { asDisposable, disposeAll } from '../utils';
import { setupWorkerProviders, defaultProviderConfig } from './providers';

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

const STOP_WHEN_IDLE_FOR = 10 * 60 * 1000; // 2min

export class WorkerClient<TOptions, TWorker> implements monacoApi.IDisposable {
  private _config: WorkerConfig<TOptions>;
  private _idleCheckInterval: number;
  private _lastUsedTime: number;
  private _worker: monacoApi.editor.MonacoWebWorker<TWorker> | null;
  private _client: Promise<TWorker> | null;
  private _providerDisposables: monacoApi.IDisposable[];
  private _disposables: monacoApi.IDisposable[];
  _monaco: typeof monacoApi;

  constructor(
    {
      languageId,
      label = languageId,
      src,
      options,
      providers = defaultProviderConfig,
      timeoutDelay = STOP_WHEN_IDLE_FOR,
    }: monacoApi.worker.IWorkerConfig<TOptions>,
    monaco: typeof monacoApi
  ) {
    this._config = new WorkerConfig(
      {
        languageId,
        label,
        src,
        options,
        providers,
        timeoutDelay,
      },
      monaco
    );
    this._monaco = monaco;
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

  get src() {
    return this._config.config.src;
  }

  get timeoutDelay() {
    return this._config.config.timeoutDelay;
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
        this._monaco
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
    if (timePassedSinceLastUsed > this.timeoutDelay) {
      this._stopWorker();
    }
  }

  private _getClient(): Promise<TWorker> {
    this._lastUsedTime = Date.now();
    if (!this._client) {
      const _this = this;
      this._worker = this._monaco.editor.createWebWorker(
        // new Proxy(
        //   {},
        //   {
        //     get: function (target, prop, receiver) {
        //       console.log(prop);
        //       if (prop === 'getModel') {
        //         return _this._monaco.editor.getModel;
        //       }
        //       if (prop === 'getModels') {
        //         return _this._monaco.editor.getModels;
        //       }
        //       throw new Error('Invalid operation on getModel');
        //     },
        //   }
        // ),
        // @ts-ignore
        {
          moduleId: this.config.label,
          // this._monaco.worker.environment.workerLoader,
          label: this.config.label,
          createData: {
            ...this.config.options,
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

// @ts-ignore
