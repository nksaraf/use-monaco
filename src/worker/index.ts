// @ts-ignore
// import { MirrorTextModel } from 'monaco-editor/esm/vs/editor/common/model/mirrorTextModel';

// MirrorTextModel.prototype.getFullModelRange = function () {
//   return {
//     startLineNumber: 1,
//     endLineNumber: this._lines.length,
//     startColumn: 1,
//     endColumn: this._lines[this._lines.length - 1].length + 1,
//   };
// };

// @ts-ignore
// import * as workerApi from 'monaco-editor/esm/vs/editor/editor.worker';

import { BaseWorker, IWorkerContext } from './base-worker';

// interface IWorkerInitializer {
//   initialize: (
//     initalizer: (ctx: IWorkerContext, createData: any) => any
//   ) => void;
// }

const hashCode = function (s: string) {
  var hash = 0;
  if (s.length == 0) {
    return hash;
  }
  for (var i = 0; i < s.length; i++) {
    var char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

export * from './base-worker';

// declare global {
//   const importScripts: any;
// }

export const importScript = async (src: string) => {
  const _this = self as any;
  if (_this.define) {
    return await new Promise((resolve, reject) => {
      _this.define(`${hashCode(src)}`, [src], (val: any) => {
        resolve(val);
      });
    });
  } else {
    throw new Error('Not on AMD');
  }
};

// export const monacoWorker: IWorkerInitializer = workerApi;
export const initialize = (name: string, WorkerClass: typeof BaseWorker) => {
  // @ts-ignore
  self[name + 'MonacoWorker'] = WorkerClass;

  // self.onmessage = () => {
  //   try {
  //     monacoWorker.initialize((ctx, options) => {
  //       return new WorkerClass(ctx, options);
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     throw err;
  //   }
  // };
};
