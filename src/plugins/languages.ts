import type * as monacoApi from 'monaco-editor';
import { createPlugin } from '../plugin-api';

declare module 'monaco-editor' {
  namespace languages {
    interface ILanguageExtensionPoint {
      /**
       * eg. () => import('./typescript')
       **/
      loader?: () => Promise<ILangImpl>;
      // if true, worker with languageId as label is registered
      worker?: Omit<worker.IWorkerConfig<any>, 'languageId'> | boolean;
    }

    interface ILangImpl {
      conf: LanguageConfiguration;
      language: IMonarchLanguage;
    }
  }

  // provided in this file
  // function registerLanguage(languageDef: languages.ILang): void;
}

const languageDefinitions: {
  [languageId: string]: monacoApi.languages.ILanguageExtensionPoint;
} = {};
const lazyLanguageLoaders: {
  [languageId: string]: LazyLanguageLoader;
} = {};

class LazyLanguageLoader {
  public static getOrCreate(languageId: string): LazyLanguageLoader {
    if (!lazyLanguageLoaders[languageId]) {
      lazyLanguageLoaders[languageId] = new LazyLanguageLoader(languageId);
    }
    return lazyLanguageLoaders[languageId];
  }

  private readonly _languageId: string;
  private _loadingTriggered: boolean;

  private _lazyLoadPromise: Promise<monacoApi.languages.ILangImpl>;
  private _lazyLoadPromiseResolve!: (
    value: monacoApi.languages.ILangImpl
  ) => void;
  private _lazyLoadPromiseReject!: (err: any) => void;

  constructor(languageId: string) {
    this._languageId = languageId;
    this._loadingTriggered = false;
    this._lazyLoadPromise = new Promise((resolve, reject) => {
      this._lazyLoadPromiseResolve = resolve;
      this._lazyLoadPromiseReject = reject;
    });
  }

  public whenLoaded(): Promise<monacoApi.languages.ILangImpl> {
    return this._lazyLoadPromise;
  }

  public load(): Promise<monacoApi.languages.ILangImpl> {
    if (!this._loadingTriggered) {
      this._loadingTriggered = true;
      languageDefinitions[this._languageId]?.loader?.().then(
        (mod) => this._lazyLoadPromiseResolve(mod),
        (err) => this._lazyLoadPromiseReject(err)
      );
    }
    return this._lazyLoadPromise;
  }
}

export default createPlugin(
  {
    name: 'core.language',
    dependencies: ['core.worker'],
  },
  (monaco) => {
    let monacoLanguageRegister = monaco.languages.register;

    monaco.languages.register = (
      language: monacoApi.languages.ILanguageExtensionPoint
    ) => {
      const languageId = language.id;
      languageDefinitions[languageId] = language;
      console.log('[monaco] registering language:', languageId);
      monacoLanguageRegister(language);

      if (language.loader) {
        const lazyLanguageLoader = LazyLanguageLoader.getOrCreate(languageId);
        monaco.languages.setMonarchTokensProvider(
          languageId,
          lazyLanguageLoader
            .whenLoaded()
            .then((mod) => mod.language as any)
            .catch((e) => {
              console.error(e);
              return;
            })
        );

        monaco.languages.onLanguage(languageId, () => {
          lazyLanguageLoader
            .load()
            .then((mod) => {
              if (mod && mod.conf) {
                monaco.languages.setLanguageConfiguration(languageId, mod.conf);
              }
            })
            .catch((err) => {
              console.error(err);
              return;
            });
        });
      }

      if (language.worker) {
        const config =
          typeof language.worker === 'object' ? language.worker : {};
        monaco.worker.register({ languageId, ...config });
      }
    };
  }
);
