import { PrettierWorker } from '../../src/plugins/prettier/prettier.worker';
import { initialize } from '../../src/worker';

initialize('prettier', PrettierWorker);
