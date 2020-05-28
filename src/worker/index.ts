// @ts-ignore
import { MirrorTextModel } from 'monaco-editor/esm/vs/editor/common/model/mirrorTextModel';

MirrorTextModel.prototype.getFullModelRange = function () {
  return {
    startLineNumber: 1,
    endLineNumber: this._lines.length,
    startColumn: 1,
    endColumn: this._lines[this._lines.length - 1].length + 1,
  };
};

// @ts-ignore
import * as workerApi from 'monaco-editor/esm/vs/editor/editor.worker';

import { BaseWorker, IWorkerContext } from './base-worker';

interface IWorkerInitializer {
  initialize: (
    initalizer: (ctx: IWorkerContext, createData: any) => any
  ) => void;
}

export * from './base-worker';

declare global {
  const importScripts: any;
}

export const monacoWorker: IWorkerInitializer = workerApi;
export const initialize = (WorkerClass: typeof BaseWorker) => {
  // @ts-ignore
  self.onmessage = () => {
    try {
      monacoWorker.initialize((ctx, options) => {
        return new WorkerClass(ctx, options);
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
};
