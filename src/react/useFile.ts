import React from 'react';
import { Monaco, fixPath } from '../core';
import type * as monacoApi from 'monaco-editor';
import { useMonacoContext } from './useMonaco';

export interface UseFileOptions {
  path?: string;
  defaultContents?: string;
  contents?: string;
  language?: string;
  // files?: { [key: string]: string };
  // syncAllFiles?: boolean;
}

function findModel(monaco: typeof monacoApi, path: string) {
  return monaco?.editor.getModel(monaco.Uri.file(fixPath(path)));
}

function initializeModel(
  monaco: typeof monacoApi,
  modelPath: string,
  value?: string,
  language?: string
) {
  modelPath = fixPath(modelPath);
  let model = findModel(monaco, modelPath);

  if (model) {
    // If a model exists, we need to update it's value
    // This is needed because the content for the file might have been modified externally
    // Use `pushEditOperations` instead of `setValue` or `applyEdits` to preserve undo stack
    if (value) {
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ],
        () => null
      );
    }
  } else {
    console.log(`[monaco] creating model:`, modelPath, { value, language });
    model = monaco?.editor.createModel(
      value || '',
      language,
      monaco?.Uri.file(modelPath)
    );
    model?.updateOptions({
      tabSize: 2,
      insertSpaces: true,
    });
  }
  return model;
}

export const useFile = ({
  monaco: customMonaco,
  contents,
  language,
  defaultContents = '',
  path = `model${
    (customMonaco?.languages.getLanguages().find((l) => l.id === language)
      ?.extensions?.[0] as any) ?? '.js'
  }`,
}: // files = {
//   [fixPath(path)]: contents != null ? contents : defaultContents,
// },
UseFileOptions & Monaco) => {
  const contextMonaco = useMonacoContext()?.monaco;
  const monaco = customMonaco || contextMonaco;
  path = fixPath(path);
  const [model, setModel] = React.useState<monacoApi.editor.ITextModel>();

  const resolvedContents = contents != null ? contents : defaultContents;
  const resolvedContentsRef = React.useRef(resolvedContents);
  resolvedContentsRef.current = resolvedContents;
  React.useEffect(() => {
    if (monaco) {
      const model = initializeModel(monaco, path, resolvedContentsRef.current);
      if (model) {
        setModel(model);
      }
    }
  }, [monaco, path]);

  React.useEffect(() => {
    if (!monaco || !language) {
      return;
    }
    if (model) {
      console.log(
        `[monaco] setting language for ${model.uri.path}: ${language}`
      );
      monaco.editor.setModelLanguage(model, language);
    }
  }, [monaco, model, language]);

  React.useEffect(() => {
    if (!monaco) {
      return;
    }

    let value = resolvedContents;
    if (model && value && value !== model.getValue()) {
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ],
        () => null
      );
    }
  }, [monaco, model, resolvedContents]);

  return model;
};
