import { GraphQLWorker } from '../../src/plugins/graphql/graphql.worker';
import { initialize } from '../../src/worker';

initialize('graphql', GraphQLWorker);
