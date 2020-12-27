import { TypingsWorker } from '../../src/plugins/typings/typings.worker';
import { initialize } from '../../src/worker';

initialize('typings', TypingsWorker);
