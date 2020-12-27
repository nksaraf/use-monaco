import { useTextModel, UseTextModelOptions } from './useTextModel';
import { useEditor, UseEditorOptions } from './useEditor';
import { useMonaco, UseMonacoOptions } from './useMonaco';

export const useMonacoEditor = ({
  modelOptions,
  path,
  defaultContents,
  contents,
  language,
  onEditorDidMount,
  options,
  // files,
  // syncAllFiles,
  overrideServices,
  onChange,
  ...loaderOptions
}: UseEditorOptions & UseTextModelOptions & UseMonacoOptions = {}) => {
  const { monaco, isLoading } = useMonaco({
    ...loaderOptions,
    languages: (loaderOptions?.languages ?? []).includes(language as any)
      ? loaderOptions?.languages
      : [...(loaderOptions?.languages ?? []), language as any],
  });

  const model = useTextModel({
    path,
    contents,
    defaultContents,
    language,
    modelOptions,
    monaco,
  });

  const { containerRef, editor } = useEditor({
    model,
    monaco,
    onEditorDidMount,
    onChange,
    overrideServices,
    options,
  });

  return { monaco, isLoading, model, containerRef, editor };
};
