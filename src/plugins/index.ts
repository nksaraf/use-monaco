import { default as prettier } from './prettier';
import { default as graphql } from './graphql';
import { default as typings } from './typings';
import { default as vscodeThemes } from './vscode-themes';
import { default as textmate } from './textmate';

export const pluginMap = {
  prettier: prettier,
  graphql: graphql,
  typings: typings,
  'vscode-themes': vscodeThemes,
  textmate: textmate,
};

export { prettier, graphql, typings, vscodeThemes, textmate };
