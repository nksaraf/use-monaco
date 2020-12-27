import type * as monacoApi from 'monaco-editor';
import {
  basicLanguages,
  knownBasicLanguages,
  knonwLanguageServices,
  languageServiceAliases,
} from './basic-languages';
import { createPlugin, createRemotePlugin } from '../plugin-api';

export const basicLanguagePlugins: {
  [k in typeof basicLanguages[number]]: monacoApi.plugin.IPlugin;
} = (Object.fromEntries(
  basicLanguages.map((lang) => [
    lang,
    createPlugin({ name: 'language.' + lang }, async (monaco) => {
      if (knownBasicLanguages.includes(lang as any)) {
        await monaco.plugin.install(
          createRemotePlugin({
            name: 'language.' + lang + '.basic',
            dependencies: [],
            url: monaco.loader.languagesPath + `${lang}.basic.js`,
          })
        );
      }

      if (knonwLanguageServices.includes(lang as any)) {
        await monaco.plugin.install(
          createRemotePlugin({
            name: 'language.' + lang + '.service',
            dependencies: [],
            url: monaco.loader.languagesPath + `${lang}.service.js`,
          })
        );
      }

      if (languageServiceAliases[lang]) {
        await monaco.plugin.install(
          createRemotePlugin({
            name: 'language.' + languageServiceAliases[lang] + '.service',
            dependencies: [],
            url:
              monaco.loader.languagesPath +
              `${languageServiceAliases[lang]}.service.js`,
          })
        );
      }
    }),
  ])
) as unknown) as any;
