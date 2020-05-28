import { fixPath } from 'utils';
import React from 'react';
import * as monacoApi from 'monaco-editor';

export const useEditorModel = ({
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
}: {
  monaco?: typeof monacoApi;
  value?: string;
  defaultValue?: string;
  path?: string;
  language?: string;
  files?: { [key: string]: string };
  syncAllFiles?: boolean;
}) => {
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
    const model = findModel(path);
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [language]);

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
  }, [files[path]]);

  return model;
};
