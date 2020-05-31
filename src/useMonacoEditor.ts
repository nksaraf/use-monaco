import { useTextModel, UseTextModelOptions } from './useTextModel';
import { useEditor, UseEditorOptions } from './useEditor';
import { useMonaco, UseMonacoOptions } from './useMonaco';

export const useMonacoEditor = ({
  paths,
  onLoad,
  plugins,
  themes,
  path,
  defaultValue,
  value,
  language,
  onThemeChange,
  editorDidMount,
  editorWillMount,
  theme,
  options,
  files,
  syncAllFiles,
  overrideServices,
  onChange,
}: UseEditorOptions & UseTextModelOptions & UseMonacoOptions = {}) => {
  const { monaco, loading } = useMonaco({
    paths,
    onLoad,
    plugins,
    themes,
    theme,
    onThemeChange,
  });

  const model = useTextModel({
    path,
    value,
    defaultValue,
    language,
    files,
    syncAllFiles,
    monaco,
  });
  const { containerRef, editor } = useEditor({
    model,
    monaco,
    editorDidMount,
    editorWillMount,
    onChange,
    overrideServices,
    options,
  });

  return { monaco, loading, model, containerRef, editor };
};
