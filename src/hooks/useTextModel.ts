import React from 'react';
import { Monaco, fixPath } from '../monaco';
import type * as monacoApi from 'monaco-editor';

export interface UseTextModelOptions {
  value?: string;
  defaultValue?: string;
  path?: string;
  language?: string;
  files?: { [key: string]: string };
  syncAllFiles?: boolean;
}

export const useTextModel = ({
  monaco,
  value,
  language,
  defaultValue = '',
  path = `model${
    (monaco?.languages.getLanguages().find((l) => l.id === language)
      ?.extensions?.[0] as any) ?? '.js'
  }`,
  files = {
    [fixPath(path)]: value != null ? value : defaultValue,
  },
}: UseTextModelOptions & Monaco) => {
  function findModel(path: string) {
    return monaco?.editor.getModel(monaco.Uri.file(fixPath(path)));
  }

  function initializeModel(
    modelPath: string,
    value?: string,
    language?: string
  ) {
    modelPath = fixPath(modelPath);
    let model = findModel(modelPath);

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

  const [model, setModel] = React.useState<monacoApi.editor.ITextModel>();

  path = fixPath(path);

  React.useEffect(() => {
    if (monaco) {
      const model = initializeModel(path, files[path]);
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
        `[monaco] setting language: "${language}" for`,
        model.uri.toString()
      );
      monaco.editor.setModelLanguage(model, language);
    }
  }, [monaco, model, language]);

  React.useEffect(() => {
    if (!monaco) {
      return;
    }
    const model = findModel(path);
    let value = files[path];
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
  }, [monaco, path, files[path]]);

  return model;
};
