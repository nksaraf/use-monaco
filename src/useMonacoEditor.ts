import { useMonacoModel, UseMonacoModelOptions } from './useMonacoModel';
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
}: UseEditorOptions & UseMonacoModelOptions & UseMonacoOptions = {}) => {
  const { monaco, loading } = useMonaco({
    paths,
    onLoad,
    plugins,
    themes,
    onThemeChange,
  });

  const model = useMonacoModel({
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
    theme,
    editorDidMount,
    editorWillMount,
    onChange,
    overrideServices,
    options,
  });

  return { monaco, loading, model, containerRef, editor };
};
