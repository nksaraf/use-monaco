import type * as monacoApi from 'monaco-editor';
import withPlugins from './plugin-api';
import { CancellablePromise, monacoLoader } from './loader';

export interface Monaco {
  monaco?: typeof monacoApi | null;
}

export * from './loader';
export * from './plugin-api';
export * from './utils';

export function loadMonaco(
  path = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/min/vs',
  plugins: monacoApi.plugin.IPlugin[] = []
): CancellablePromise<typeof monacoApi> {
  console.log('[monaco] loading monaco from', path, '...');
  const cancelable = monacoLoader.init({ paths: { vs: path } });
  let disposable: monacoApi.IDisposable;
  const promise: CancellablePromise<typeof monacoApi> = cancelable
    .then(async (monaco) => {
      console.log('[monaco] loaded monaco');
      monaco = withPlugins(monaco);
      disposable = await monaco.plugin.install(...plugins);
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
