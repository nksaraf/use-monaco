import type * as monacoApi from 'monaco-editor';
import { endingSlash, noEndingSlash } from './utils';
import withPlugins from './plugin-api';
import languagesPlugin from './languages/register';
import themes from './themes';
import editors from './editors';
import shortcuts from './shortcuts';
import workers from './workers';
import { createPlugin } from './plugin-api';

import version from './utils/version';
import { basicLanguagePlugins } from './languages/language-plugins';

type Monaco = typeof monacoApi;

declare module 'monaco-editor' {
  export interface LoaderOptions {
    monacoPath: string;
    workersPath: string;
    languagesPath: string;
    monacoCorePkg: string;
    cdn: string;
    monacoVersion: string;
    plugins: monacoApi.plugin.IPlugin[];
    languages: monacoApi.plugin.IPlugin[];
  }

  export let loader: LoaderOptions;
}

export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

const merge = (target: { [x: string]: any }, source: { [x: string]: any }) => {
  Object.keys(source).forEach((key) => {
    if (source[key] instanceof Object)
      target[key] &&
        Object.assign(source[key], merge(target[key], source[key]));
  });
  return { ...target, ...source };
};

function cdnPath(root, pkg, version, path) {
  return `${endingSlash(root)}${pkg}@${version}${path}`;
}

export function loadMonaco(
  options: Partial<monacoApi.LoaderOptions>
): CancellablePromise<Monaco> {
  const {
    monacoVersion = '0.21.2',
    monacoCorePkg = 'monaco-editor-core',
    cdn = 'https://cdn.jsdelivr.net/npm',
    monacoPath = endingSlash(cdnPath(cdn, monacoCorePkg, monacoVersion, '/')),
    workersPath = endingSlash(
      cdnPath(cdn, 'use-monaco', version, '/dist/workers/')
    ),
    languagesPath = endingSlash(
      cdnPath(cdn, 'use-monaco', version, '/dist/languages/')
    ),
    plugins = [],
    languages = [],
  } = options;

  const loaderPlugin = createPlugin({ name: 'core.loader' }, (monaco) => {
    monaco.loader = {
      monacoCorePkg,
      monacoVersion,
      cdn,
      monacoPath: endingSlash(monacoPath),
      workersPath: endingSlash(workersPath),
      languagesPath: endingSlash(languagesPath),
      plugins,
      languages,
    };
  });

  console.log('[monaco] loading monaco from', monacoPath, '...');

  const cancelable = monacoLoader.init({
    paths: { vs: endingSlash(monacoPath) + 'min/vs' },
  });
  let disposable: monacoApi.IDisposable;

  const promise: CancellablePromise<Monaco> = cancelable
    .then(async (monaco) => {
      console.log('[monaco] loaded monaco');
      monaco = withPlugins(monaco);

      disposable = await monaco.plugin.install(
        loaderPlugin,
        languagesPlugin,
        themes,
        editors,
        shortcuts,
        workers,
        ...plugins,
        ...languages
      );
      return monaco;
    })
    .catch((error) =>
      console.error('An error occurred during initialization of Monaco:', error)
    ) as any;

  promise.cancel = () => {
    cancelable.cancel?.();
    disposable?.dispose?.();
  };

  return promise;
}

const makeCancelable = function <T>(
  promise: Promise<T>
): CancellablePromise<T> {
  let hasCanceled_ = false;
  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then((val) =>
      hasCanceled_ ? reject('operation is manually canceled') : resolve(val)
    );
    promise.catch((error) => reject(error));
  });
  const cancellablePromise = Object.assign(wrappedPromise, {
    cancel: () => (hasCanceled_ = true),
  });
  return cancellablePromise;
};

export class MonacoLoader {
  config: any;
  constructor() {
    this.config = {};
  }
  resolve: any;
  reject: any;
  injectScripts(script: HTMLScriptElement) {
    document.body.appendChild(script);
  }
  handleMainScriptLoad = () => {
    document.removeEventListener('monaco_init', this.handleMainScriptLoad);
    this.resolve((window as any).monaco);
  };
  createScript(src?: string) {
    const script = document.createElement('script');
    return src && (script.src = src), script;
  }
  createMonacoLoaderScript(mainScript: HTMLScriptElement) {
    const loaderScript = this.createScript(
      `${noEndingSlash(this.config.paths.vs)}/loader.js`
    );
    loaderScript.onload = () => this.injectScripts(mainScript);
    loaderScript.onerror = this.reject;
    return loaderScript;
  }

  createMainScript() {
    const mainScript = this.createScript();
    mainScript.innerHTML = `
      require.config(${JSON.stringify(this.config)});
      require(['vs/editor/editor.main'], function() {
        document.dispatchEvent(new Event('monaco_init'));
      });
    `;
    mainScript.onerror = this.reject;
    return mainScript;
  }
  isInitialized = false;
  wrapperPromise = new Promise<Monaco>((res, rej) => {
    this.resolve = res;
    this.reject = rej;
  });
  init(config: any): CancellablePromise<Monaco> {
    if (!this.isInitialized) {
      //@ts-ignore
      if (window.monaco && window.monaco.editor) {
        //@ts-ignore
        return new Promise((res, rej) => res(window.monaco));
      }
      this.config = merge(this.config, config);
      document.addEventListener('monaco_init', this.handleMainScriptLoad);
      const mainScript = this.createMainScript();
      const loaderScript = this.createMonacoLoaderScript(mainScript);
      this.injectScripts(loaderScript);
    }
    this.isInitialized = true;
    return makeCancelable(this.wrapperPromise);
  }
}

export const monacoLoader = new MonacoLoader();
