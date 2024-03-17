import React from 'react';
import { fixPath, noop } from '../monaco';
import type * as monacoApi from 'monaco-editor';
import { MonacoProp, useMonacoContext } from './useMonaco';
import useDeepCompareEffect from './useDeepCompareEffect';

export interface UseTextModelOptions {
  path?: string;
  defaultContents?: string;
  contents?: string;

  onChange?: (
    value: string,
    event: monacoApi.editor.IModelContentChangedEvent,
    model: monacoApi.editor.ITextModel
  ) => void;
  language?: string;
  modelOptions?: monacoApi.editor.ITextModelUpdateOptions;
}

function findMonacoModel(monaco: typeof monacoApi, path: string) {
  return monaco?.editor.getModel(monaco.Uri.file(fixPath(path)));
}

function initializeMonacoModel(
  monaco: typeof monacoApi,
  modelPath: string,
  value?: string,
  language?: string
) {
  modelPath = fixPath(modelPath);
  let model = findMonacoModel(monaco, modelPath);

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

export const useTextModel = ({
  monaco: customMonaco,
  contents,
  language,
  modelOptions = {},
  onChange = noop,
  defaultContents = '',
  path,
}: UseTextModelOptions & MonacoProp): monacoApi.editor.ITextModel => {
  const contextMonaco = useMonacoContext()?.monaco;
  const monaco = customMonaco || contextMonaco;

  path =
    path ??
    `model${
      (monaco?.languages.getLanguages().find((l) => l.id === language)
        ?.extensions?.[0] as any) ?? '.js'
    }`;

  let modelPath = fixPath(path);

  const [model, setModel] = React.useState<monacoApi.editor.ITextModel>();

  const resolvedContents = contents != null ? contents : defaultContents;
  const resolvedContentsRef = React.useRef(resolvedContents);
  resolvedContentsRef.current = resolvedContents;

  React.useEffect(() => {
    if (monaco) {
      const model = initializeMonacoModel(
        monaco,
        modelPath,
        resolvedContentsRef.current
      );
      if (model) {
        setModel(model);
      }
    }
  }, [monaco, modelPath]);

  React.useEffect(() => {
    if (model) {
      const disposable = model.onDidChangeContent((event) => {
        onChange(model.getValue(), event, model);
      });

      return () => {
        disposable?.dispose?.();
      };
    }
  }, [model, onChange]);

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
  }, [model, resolvedContents]);

  useDeepCompareEffect(
    () => {
      if (model) {
        model.updateOptions(modelOptions);
      }
    },
    [modelOptions],
    [model]
  );

  return model;
};
