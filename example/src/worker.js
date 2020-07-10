import { initialize, BaseWorker } from 'use-monaco/worker';

initialize(
  'hello',
  class Hello extends BaseWorker {
    provideHover() {
      console.log('trying...');
      return null;
    }
  }
);
