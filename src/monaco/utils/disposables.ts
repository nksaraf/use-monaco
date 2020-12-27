import * as monacoApi from 'monaco-editor';


export function asDisposable(
  disposables: monacoApi.IDisposable[] | monacoApi.IDisposable | undefined
): monacoApi.IDisposable {
  return {
    dispose: () => Array.isArray(disposables)
      ? disposeAll(disposables.filter(Boolean))
      : typeof disposables?.dispose === 'function'
        ? disposables?.dispose?.()
        : {},
  };
}

export function disposeAll(disposables: monacoApi.IDisposable[]) {
  while (disposables.length) {
    disposables.pop()?.dispose?.();
  }
}
