import './typings.monaco.worker';
import './graphql.monaco.worker';
import './prettier.monaco.worker';

import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(import('react-monaco-editor'), { ssr: false });

export default () => <MonacoEditor />;
