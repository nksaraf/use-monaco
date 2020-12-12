import type * as monaco from 'monaco-editor';

export interface IWordRange {
  /**
   * The index where the word starts.
   */
  readonly start: number;
  /**
   * The index where the word ends.
   */
  readonly end: number;
}

export interface IMirrorModel {
  readonly uri: monaco.Uri;
  readonly version: number;
  readonly eol: string;
  getValue(): string;
  getLinesContent(): string[];
  getLineCount(): number;
  getLineContent(lineNumber: number): string;
  getLineWords(
    lineNumber: number,
    wordDefinition: RegExp
  ): monaco.editor.IWordAtPosition[];
  createWordIterator(wordDefinition: RegExp): Iterator<string>;
  getWordUntilPosition(
    position: monaco.IPosition,
    wordDefinition: RegExp
  ): monaco.editor.IWordAtPosition;
  getValueInRange(range: monaco.IRange): string;
  getWordAtPosition(
    position: monaco.IPosition,
    wordDefinition: RegExp
  ): monaco.Range | null;
  offsetAt(position: monaco.IPosition): number;
  positionAt(offset: number): monaco.IPosition;
  getValue(): string;
  getFullModelRange(): monaco.IRange;
}

export interface IWorkerContext<H = undefined> {
  /**
   * A proxy to the main thread host object.
   */
  host: H;
  /**
   * Get all available mirror models in this worker.
   */
  getMirrorModels(): IMirrorModel[];
}

export interface LanguageWorker {
  provideReferences?(
    model: IMirrorModel,
    position: monaco.Position,
    context: monaco.languages.ReferenceContext
  ): monaco.languages.ProviderResult<monaco.languages.Location[]>;
  provideRenameEdits?(
    model: IMirrorModel,
    position: monaco.Position,
    newName: string
  ): monaco.languages.ProviderResult<
    monaco.languages.WorkspaceEdit & monaco.languages.Rejection
  >;
  resolveRenameLocation?(
    model: IMirrorModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<
    monaco.languages.RenameLocation & monaco.languages.Rejection
  >;
  provideSignatureHelp?(
    model: IMirrorModel,
    position: monaco.Position,
    context: monaco.languages.SignatureHelpContext
  ): monaco.languages.ProviderResult<monaco.languages.SignatureHelpResult>;
  provideHover?(
    model: IMirrorModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<monaco.languages.Hover>;
  provideDocumentSymbols?(
    model: IMirrorModel
  ): monaco.languages.ProviderResult<monaco.languages.DocumentSymbol[]>;
  provideDocumentHighlights?(
    model: IMirrorModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<monaco.languages.DocumentHighlight[]>;
  provideDefinition?(
    model: IMirrorModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<
    | monaco.languages.Location
    | monaco.languages.Location[]
    | monaco.languages.LocationLink[]
    | monaco.languages.LocationLink[]
  >;
  provideImplementation?(
    model: IMirrorModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<
    | monaco.languages.Location
    | monaco.languages.Location[]
    | monaco.languages.LocationLink[]
    | monaco.languages.LocationLink[]
  >;
  provideTypeDefinition?(
    model: IMirrorModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<
    | monaco.languages.Location
    | monaco.languages.Location[]
    | monaco.languages.LocationLink[]
    | monaco.languages.LocationLink[]
  >;
  provideCodeLenses?(
    model: IMirrorModel
  ): monaco.languages.ProviderResult<monaco.languages.CodeLensList>;
  resolveCodeLens?(
    model: IMirrorModel,
    codeLens: monaco.languages.CodeLens
  ): monaco.languages.ProviderResult<monaco.languages.CodeLens>;
  provideCodeActions?(
    model: IMirrorModel,
    range: monaco.Range,
    context: monaco.languages.CodeActionContext
  ): monaco.languages.ProviderResult<monaco.languages.CodeActionList>;
  provideDocumentFormattingEdits?(
    model: IMirrorModel,
    options: monaco.languages.FormattingOptions
  ): monaco.languages.ProviderResult<monaco.languages.TextEdit[]>;
  provideDocumentRangeFormattingEdits?(
    model: IMirrorModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions
  ): monaco.languages.ProviderResult<monaco.languages.TextEdit[]>;
  provideOnTypeFormattingEdits?(
    model: IMirrorModel,
    position: monaco.Position,
    ch: string,
    options: monaco.languages.FormattingOptions
  ): monaco.languages.ProviderResult<monaco.languages.TextEdit[]>;
  provideLinks?(
    model: IMirrorModel
  ): monaco.languages.ProviderResult<monaco.languages.ILinksList>;
  provideCompletionItems?(
    model: IMirrorModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext
  ): monaco.languages.ProviderResult<monaco.languages.CompletionList>;
  resolveCompletionItem?(
    model: IMirrorModel,
    pos: monaco.Position,
    item: monaco.languages.CompletionItem
  ): monaco.languages.ProviderResult<monaco.languages.CompletionItem>;
  completionTriggerCharacters?: string[];
  provideDocumentColors?(
    model: IMirrorModel
  ): monaco.languages.ProviderResult<monaco.languages.IColorInformation[]>;
  provideColorPresentations?(
    model: IMirrorModel,
    colorInfo: monaco.languages.IColorInformation
  ): monaco.languages.ProviderResult<monaco.languages.IColorPresentation[]>;
  provideFoldingRanges?(
    model: IMirrorModel,
    context: monaco.languages.FoldingContext
  ): monaco.languages.ProviderResult<monaco.languages.FoldingRange[]>;
  provideDeclaration?(
    model: IMirrorModel,
    position: monaco.Position
  ): monaco.languages.ProviderResult<
    | monaco.languages.Location
    | monaco.languages.Location[]
    | monaco.languages.LocationLink[]
    | monaco.languages.LocationLink[]
  >;
  provideSelectionRanges?(
    model: IMirrorModel,
    positions: monaco.Position[]
  ): monaco.languages.ProviderResult<monaco.languages.SelectionRange[][]>;
  provideDocumentSemanticTokens?(
    model: IMirrorModel,
    lastResultId: string
  ): monaco.languages.ProviderResult<
    monaco.languages.SemanticTokens | monaco.languages.SemanticTokensEdits
  >;
  provideDocumentRangeSemanticTokens?(
    model: IMirrorModel,
    range: monaco.Range
  ): monaco.languages.ProviderResult<monaco.languages.SemanticTokens>;
  doValidation?(
    uri: string
  ): monaco.languages.ProviderResult<monaco.editor.IMarkerData[]>;
}

export interface MonacoWorker extends LanguageWorker {
  // constructor()
  getModels(): IMirrorModel[];
  getModel(uri: string): IMirrorModel;
  getText(uri: string): string;
}

export class MonacoWorker {
  ctx: IWorkerContext;
  options: any;
  constructor(_ctx: IWorkerContext, _options: any) {
    this.ctx = _ctx;
    this.options = _options;
  }

  getModels() {
    return this.ctx.getMirrorModels();
  }

  getModel(uri: string) {
    for (let model of this.getModels()) {
      if (model.uri.toString() === uri) {
        Object.assign(model, {
          getFullModelRange: () => ({
            startLineNumber: 1,
            endLineNumber: model.getLineCount(),
            startColumn: 1,
            endColumn:
              model.getLineContent(model.getLineCount() - 1).length + 1,
          }),
        });
        return model;
      }
    }
    return null;
  }

  getText(uri: string) {
    return this.getModel(uri).getValue() || '';
  }

  // proxy function used by the client to delegate different kind of providers
  provide<T>(
    provider: string,
    uri: string,
    ...args: any[]
  ): monaco.languages.ProviderResult<T> {
    const providerFunc =
      'provide' + provider.charAt(0).toUpperCase() + provider.slice(1);
    if ((this as any)[providerFunc]) {
      return (this as any)[providerFunc](this.getModel(uri), ...args);
    } else {
      console.error(`No provider for ${provider}`);
      return null;
    }
  }

  // proxy function used by the client to delegate different kind of resolvers
  resolve<T>(
    resolver: string,
    uri: string,
    ...args: any[]
  ): monaco.languages.ProviderResult<T> {
    const resolverFunc =
      'resolve' + resolver.charAt(0).toUpperCase() + resolver.slice(1);
    if ((this as any)[resolverFunc]) {
      return (this as any)[resolverFunc](this.getModel(uri), ...args);
    } else {
      console.error(`No resolver for ${resolver}`);
      return null;
    }
  }
}
