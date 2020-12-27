import { MonacoWorker, IWorkerContext } from '../../worker';
import { printSchema } from 'graphql';

import { FormattingOptions, ICreateData } from './types';

import type { worker, editor, Position, IRange } from 'monaco-editor';

import { getRange, LanguageService } from 'graphql-language-service';

import type {
  SchemaResponse,
  CompletionItem as GraphQLCompletionItem,
} from 'graphql-language-service';

import {
  toGraphQLPosition,
  toMonacoRange,
  toMarkerData,
  toCompletion,
} from './utils';
import type * as monacoApi from 'monaco-editor';
import type { GraphQLSchema, DocumentNode } from 'graphql';

export type MonacoCompletionItem = monacoApi.languages.CompletionItem & {
  isDeprecated?: boolean;
  deprecationReason?: string | null;
};

export class GraphQLWorker extends MonacoWorker {
  private _ctx: worker.IWorkerContext;
  private _languageService: LanguageService;
  private _formattingOptions: FormattingOptions | undefined;
  constructor(ctx: IWorkerContext, createData: ICreateData) {
    super(ctx, createData);
    this._ctx = ctx;
    this._languageService = new LanguageService(createData.languageConfig);
    this._formattingOptions = createData.formattingOptions;
  }

  async getSchemaResponse(_uri?: string): Promise<SchemaResponse | null> {
    return this._languageService.getSchemaResponse();
  }

  async setSchema(schema: string): Promise<void> {
    await this._languageService.setSchema(schema);
  }

  async loadSchema(_uri?: string): Promise<GraphQLSchema | null> {
    return this._languageService.getSchema();
  }

  async validate(uri: string): Promise<editor.IMarkerData[]> {
    const document = this.getText(uri);
    const graphqlDiagnostics = await this._languageService.getDiagnostics(
      uri,
      document
    );
    return graphqlDiagnostics.map(toMarkerData);
  }

  async doComplete(
    uri: string,
    position: Position
  ): Promise<(GraphQLCompletionItem & { range: IRange })[]> {
    const document = this.getText(uri);
    const graphQLPosition = toGraphQLPosition(position);

    const suggestions = await this._languageService.getCompletion(
      uri,
      document,
      graphQLPosition
    );
    return suggestions.map((suggestion) => toCompletion(suggestion));
  }

  async doHover(uri: string, position: Position) {
    const document = this.getText(uri);
    const graphQLPosition = toGraphQLPosition(position);

    const hover = await this._languageService.getHover(
      uri,
      document,
      graphQLPosition
    );

    return {
      content: hover,
      range: toMonacoRange(
        getRange(
          {
            column: graphQLPosition.character,
            line: graphQLPosition.line,
          },
          document
        )
      ),
    };
  }

  async doValidation(uri) {
    return await this.validate(uri);
  }

  async getSchema() {
    return await this.loadSchema(
      this.options.languageConfig.schemaConfig.uri
    ).then((schema) => {
      return printSchema(schema);
    });
  }

  provideHover: MonacoWorker['provideHover'] = async (model, position) => {
    const info = await this.doHover(model.uri.toString(), position);
    return {
      contents: [{ value: info.content as string }],
      range: {
        ...info.range,
        startLineNumber: info.range.startLineNumber + 1,
        endLineNumber: info.range.endLineNumber + 1,
      },
    };
  };

  provideCompletionItems: MonacoWorker['provideCompletionItems'] = async (
    model,
    pos,
    ctx
  ) => {
    const info = await this.doComplete(model.uri.toString(), pos);
    return {
      suggestions: info as any,
    };
  };
  resolveCompletionItem: MonacoWorker['resolveCompletionItem'] = async (
    item
  ) => {
    return item;
  };

  async doParse(text: string): Promise<DocumentNode> {
    return this._languageService.parse(text);
  }
}
