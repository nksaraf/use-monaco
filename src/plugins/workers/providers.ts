import type * as monacoApi from 'monaco-editor';
import { WorkerClient } from './worker-client';

declare module 'monaco-editor' {
  namespace worker {
    interface ILangProvidersOptions {
      reference?: boolean;
      rename?: boolean;
      signatureHelp?: boolean;
      hover?: boolean;
      documentSymbol?: boolean;
      documentHighlight?: boolean;
      definition?: boolean;
      implementation?: boolean;
      typeDefinition?: boolean;
      codeLens?: boolean;
      codeAction?: boolean;
      documentFormattingEdit?: boolean;
      documentRangeFormattingEdit?: boolean;
      onTypeFormattingEdit?: boolean;
      link?: boolean;
      completionItem?: boolean;
      completionTriggerCharacters?: string[];
      color?: boolean;
      foldingRange?: boolean;
      declaration?: boolean;
      selectionRange?: boolean;
      // via diagnostics provider
      diagnostics?: boolean | { disableWhenInactive?: boolean };
      // documentSemanticTokens?: boolean
      // documentRangeSemanticTokens?: boolean
    }
  }
}

export const defaultProviderConfig = {
  reference: true,
  rename: true,
  signatureHelp: true,
  hover: true,
  documentSymbol: true,
  documentHighlight: true,
  definition: true,
  implementation: true,
  typeDefinition: true,
  codeLens: true,
  codeAction: true,
  documentFormattingEdit: true,
  documentRangeFormattingEdit: true,
  onTypeFormattingEdit: true,
  link: true,
  completionItem: true,
  color: true,
  foldingRange: true,
  declaration: true,
  selectionRange: true,
  diagnostics: true,
  documentSemanticTokens: true,
  documentRangeSemanticTokens: true,
};

export const getProvider = (
  getWorker: monacoApi.worker.IWorkerAccessor<any>,
  provider: string
) => {
  return async (model: monacoApi.editor.IModel, ...args: any[]) => {
    let resource = model.uri;
    try {
      const worker = await getWorker(resource);
      return await worker.provide(
        provider,
        resource.toString(),
        ...args.slice(0, args.length - 1)
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  };
};

export const getSignatureHelpProvider = (
  getWorker: monacoApi.worker.IWorkerAccessor<any>
) => {
  return async (
    model: monacoApi.editor.ITextModel,
    position: monacoApi.IPosition,
    token: monacoApi.CancellationToken,
    context: monacoApi.languages.SignatureHelpContext
  ) => {
    let resource = model.uri;
    try {
      const worker = await getWorker(resource);
      return await worker.provide(
        'signatureHelp',
        resource.toString(),
        position,
        context
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  };
};

export const getResolver = (
  getWorker: monacoApi.worker.IWorkerAccessor<any>,
  resolver: string
) => {
  return async (model: monacoApi.editor.IModel, ...args: any[]) => {
    let resource = model.uri;
    try {
      const worker = await getWorker(resource);
      return await worker.resolve(
        resolver,
        resource.toString(),
        ...args.slice(0, args.length - 1)
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  };
};

export const getCompletionItemResolver = (
  getWorker: monacoApi.worker.IWorkerAccessor<any>
) => {
  return async (
    item: monacoApi.languages.CompletionItem,
    token: monacoApi.CancellationToken
  ) => {
    try {
      const worker = await getWorker();
      return await worker.resolve('completionItem', item, token);
    } catch (e) {
      console.error(e);
      return null;
    }
  };
};

export class DiagnosticsProvider {
  private _disposables: monacoApi.IDisposable[] = [];
  private _listener: { [uri: string]: monacoApi.IDisposable } = Object.create(
    null
  );
  private _editor?: monacoApi.editor.ICodeEditor;
  private _client?: WorkerClient<any, any>;
  monaco: typeof monacoApi;
  isActiveModel(model: monacoApi.editor.ITextModel) {
    if (this._editor) {
      const currentModel = this._editor.getModel();
      if (
        currentModel &&
        currentModel.uri.toString() === model.uri.toString()
      ) {
        return true;
      }
    }

    return false;
  }

  constructor(
    private client: WorkerClient<any, any>,
    monaco: typeof monacoApi
  ) {
    this._client = client;
    this.monaco = monaco;
    this._disposables.push(
      monaco.editor.onCreatedEditor((editor) => {
        this._editor = editor;
      })
    );
    const onModelAdd = (model: monacoApi.editor.IModel): void => {
      const modeId = model.getModeId();
      if (modeId !== client.config.languageId) {
        return;
      }

      // console.log(
      //   'model added',
      //   model.uri.toString(),
      //   client.config.languageId,
      //   model.getModeId()
      // );

      let handle: number;
      // console.log(handle, this._listener, this._client, model);
      this._listener[model.uri.toString()] = model.onDidChangeContent(() => {
        clearTimeout(handle);
        // @ts-ignore
        handle = setTimeout(() => {
          // if (this.isActiveModel(model)) {
          this._doValidate(model.uri, modeId);
          // }
        }, 500);
      });

      // if (this.isActiveModel(model)) {
      this._doValidate(model.uri, modeId);
      // }
    };

    const onModelRemoved = (model: monacoApi.editor.IModel): void => {
      // console.log(
      //   'model removed',
      //   model.uri.toString(),
      //   client.config.languageId
      // );
      monaco.editor.setModelMarkers(model, client.config.languageId ?? '', []);
      const uriStr = model.uri.toString();
      const listener = this._listener[uriStr];
      if (listener) {
        listener.dispose();
        delete this._listener[uriStr];
      }
    };

    this._disposables.push(monaco.editor.onDidCreateModel(onModelAdd));

    this._disposables.push(
      monaco.editor.onWillDisposeModel((model) => {
        // console.log(
        //   'model disposed',
        //   model.uri.toString(),
        //   client.config.languageId
        // );
        onModelRemoved(model);
      })
    );

    this._disposables.push(
      monaco.editor.onDidChangeModelLanguage((event) => {
        // console.log(
        //   'model changed language',
        //   event.model.uri.toString(),
        //   client.config.languageId
        // );
        onModelRemoved(event.model);
        onModelAdd(event.model);
      })
    );

    this._disposables.push(
      client.onConfigDidChange((_: any) => {
        monaco.editor.getModels().forEach((model) => {
          if (model.getModeId() === client.config.languageId) {
            onModelRemoved(model);
            onModelAdd(model);
          }
        });
      })
    );

    this._disposables.push({
      dispose: () => {
        for (const key in this._listener) {
          this._listener[key].dispose();
        }
      },
    });

    // monaco.editor.getModels().forEach(onModelAdd);
  }

  public dispose(): void {
    this._disposables.forEach((d) => d && d.dispose());
    this._disposables = [];
  }

  private async _doValidate(resource: monacoApi.Uri, languageId: string) {
    try {
      const worker = await this.client.getSyncedWorker(resource);
      const diagnostics = await worker.doValidation(resource.toString());
      this.monaco.editor.setModelMarkers(
        this.monaco.editor.getModel(resource) as monacoApi.editor.ITextModel,
        languageId,
        diagnostics
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}

export const setupWorkerProviders = (
  languageId: string,
  providers:
    | monacoApi.worker.ILangProvidersOptions
    | boolean = defaultProviderConfig,
  client: WorkerClient<any, any>,
  monaco: typeof monacoApi
): monacoApi.IDisposable[] => {
  const disposables: monacoApi.IDisposable[] = [];
  if (!providers) {
    return [];
  }

  const getWorker = async (...resources: monacoApi.Uri[]) => {
    return await client.getSyncedWorker(...resources);
  };

  providers =
    typeof providers === 'boolean' && providers
      ? defaultProviderConfig
      : (providers as monacoApi.worker.ILangProvidersOptions);

  if (providers.diagnostics) {
    disposables.push(new DiagnosticsProvider(client, monaco));
  }

  if (providers.reference) {
    disposables.push(
      monaco.languages.registerReferenceProvider(languageId, {
        provideReferences: getProvider(getWorker, 'references'),
      })
    );
  }
  if (providers.rename) {
    disposables.push(
      monaco.languages.registerRenameProvider(languageId, {
        provideRenameEdits: getProvider(getWorker, 'renameEdits'),
        resolveRenameLocation: getResolver(getWorker, 'renameLocation'),
      })
    );
  }
  if (providers.signatureHelp) {
    disposables.push(
      monaco.languages.registerSignatureHelpProvider(languageId, {
        provideSignatureHelp: getSignatureHelpProvider(getWorker),
      })
    );
  }
  if (providers.hover) {
    disposables.push(
      monaco.languages.registerHoverProvider(languageId, {
        provideHover: getProvider(getWorker, 'hover'),
      })
    );
  }
  if (providers.documentSymbol) {
    disposables.push(
      monaco.languages.registerDocumentSymbolProvider(languageId, {
        provideDocumentSymbols: getProvider(getWorker, 'documentSymbols'),
      })
    );
  }
  if (providers.documentHighlight) {
    disposables.push(
      monaco.languages.registerDocumentHighlightProvider(languageId, {
        provideDocumentHighlights: getProvider(getWorker, 'documentHighlights'),
      })
    );
  }
  if (providers.definition) {
    disposables.push(
      monaco.languages.registerDefinitionProvider(languageId, {
        provideDefinition: getProvider(getWorker, 'definition'),
      })
    );
  }
  if (providers.implementation) {
    disposables.push(
      monaco.languages.registerImplementationProvider(languageId, {
        provideImplementation: getProvider(getWorker, 'implementation'),
      })
    );
  }
  if (providers.typeDefinition) {
    disposables.push(
      monaco.languages.registerTypeDefinitionProvider(languageId, {
        provideTypeDefinition: getProvider(getWorker, 'typeDefinition'),
      })
    );
  }
  if (providers.codeLens) {
    disposables.push(
      monaco.languages.registerCodeLensProvider(languageId, {
        provideCodeLenses: getProvider(getWorker, 'codeLenses'),
        resolveCodeLens: getResolver(getWorker, 'codeLens'),
      })
    );
  }
  if (providers.codeAction) {
    disposables.push(
      monaco.languages.registerCodeActionProvider(languageId, {
        provideCodeActions: getProvider(getWorker, 'codeActions'),
      })
    );
  }
  if (providers.documentFormattingEdit) {
    disposables.push(
      monaco.languages.registerDocumentFormattingEditProvider(languageId, {
        provideDocumentFormattingEdits: getProvider(
          getWorker,
          'documentFormattingEdits'
        ),
      })
    );
  }
  if (providers.documentRangeFormattingEdit) {
    disposables.push(
      monaco.languages.registerDocumentRangeFormattingEditProvider(languageId, {
        provideDocumentRangeFormattingEdits: getProvider(
          getWorker,
          'documentRangeFormattingEdits'
        ),
      })
    );
  }
  // if (providers.onTypeFormattingEdit) {
  //   disposables.push(
  //     monaco.languages.registerOnTypeFormattingEditProvider(languageId, {
  //       provideOnTypeFormattingEdits: getProvider(
  //         getWorker,
  //         'onTypeFormattingEdits'
  //       ),
  //     })
  //   );
  // }
  if (providers.link) {
    disposables.push(
      monaco.languages.registerLinkProvider(languageId, {
        provideLinks: getProvider(getWorker, 'links'),
      })
    );
  }
  if (providers.completionItem) {
    disposables.push(
      monaco.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: providers.completionTriggerCharacters || [],
        provideCompletionItems: getProvider(getWorker, 'completionItems'),
        resolveCompletionItem: getCompletionItemResolver(getWorker),
        // resolveCompletionItem: getResolver(getWorker, 'completionItem'),
      })
    );
  }
  if (providers.color) {
    disposables.push(
      monaco.languages.registerColorProvider(languageId, {
        provideDocumentColors: getProvider(getWorker, 'documentColors'),
        provideColorPresentations: getProvider(getWorker, 'colorPresentations'),
      })
    );
  }
  if (providers.foldingRange) {
    disposables.push(
      monaco.languages.registerFoldingRangeProvider(languageId, {
        provideFoldingRanges: getProvider(getWorker, 'foldingRanges'),
      })
    );
  }
  if (providers.declaration) {
    disposables.push(
      monaco.languages.registerDeclarationProvider(languageId, {
        provideDeclaration: getProvider(getWorker, 'declaration'),
      })
    );
  }
  if (providers.selectionRange) {
    disposables.push(
      monaco.languages.registerSelectionRangeProvider(languageId, {
        provideSelectionRanges: getProvider(getWorker, 'selectionRanges'),
      })
    );
  }

  return disposables;

  // if (providers.onTypeFormattingEdit) {
  //     monaco.languages.registerOnTypeFormattingEditProvider(languageId, {
  // provideOnTypeFormattingEdits: getProvider(getWorker, 'onTypeFormattingEdits')
  // });
  // }
};
