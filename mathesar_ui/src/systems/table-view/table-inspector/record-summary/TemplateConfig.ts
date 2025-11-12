import { filter, first, some } from 'iter-tools';

import type {
  RecordSummaryTemplate,
  RecordSummaryTemplatePart,
} from '@mathesar/api/rpc/tables';
import type {
  ProcessedColumn,
  ProcessedColumns,
} from '@mathesar/stores/table-data';
import { ImmutableMap } from '@mathesar-component-library';

type InternalTemplatePart = string | string[];

function partIsColumn(part: InternalTemplatePart): part is string[] {
  return Array.isArray(part);
}

function convertPartFromApi(part: RecordSummaryTemplatePart): InternalTemplatePart {
  if (Array.isArray(part)) {
    return part.map(String);
  }
  return part;
}

function convertPartToApi(part: InternalTemplatePart): RecordSummaryTemplatePart {
  if (Array.isArray(part)) {
    return part.map(Number);
  }
  return part;
}

/**
 * This holds the UI state to configure a record summary template.
 *
 * I had first tried using the raw record summary template to hold the UI state
 * but ran into some snags. Within the config UI, the template parts need the
 * ability to be independently updated and also sorted. It turned out to be
 * tricky to accomplish both of those requirements without having components
 * re-render unnecessarily. The svelte {#each} block which renders template
 * parts can either be keyed or non-keyed, and I tried both. Each option had
 * different problems with re-rendering. Re-rendering causes poor UX for
 * FieldPart because it re-loads the TableStructure when things change.
 * Re-rendering is also poor UX for TextPart because the input loses focus.
 *
 * So this class exists primarily to assign a persistent, unique key to each
 * template part. Then we can use that key within svelte's {#each} block to
 * avoid re-rendering parts of the template.
 */
export class TemplateConfig {
  private readonly parts: ImmutableMap<number, InternalTemplatePart>;

  constructor(parts: Iterable<[number, InternalTemplatePart]>) {
    this.parts = new ImmutableMap(parts);
  }

  private getNextKey(): number {
    return Math.max(...this.parts.keys(), 0) + 1;
  }

  static fromTemplate(template: RecordSummaryTemplatePart[]): TemplateConfig {
    return new TemplateConfig(
      template.map((part, i) => [i, convertPartFromApi(part)]),
    );
  }

  /**
   * Creates a new TemplateConfig as a starting point for the user to build
   * their own customized template.
   */
  static newCustom(columns: ProcessedColumns): TemplateConfig {
    const textColumns = filter(
      (c) => c.abstractType.identifier === 'text',
      columns.values(),
    );
    const firstTextColumn = first(textColumns);
    if (firstTextColumn) {
      // Convert string[] to number[] for API compatibility
      return TemplateConfig.fromTemplate([[Number(firstTextColumn.id)]]);
    }
    // Type assertion here because we know that every table has at least one
    // column.
    const firstColumn = first(columns.values()) as ProcessedColumn;
    // Convert string[] to number[] for API compatibility
    return TemplateConfig.fromTemplate([[Number(firstColumn.id)]]);
  }

  get template(): RecordSummaryTemplate {
    return [...this.parts.values()].map(convertPartToApi);
  }

  withPartAppended(part: InternalTemplatePart): TemplateConfig {
    return new TemplateConfig(this.parts.with(this.getNextKey(), part));
  }

  withPartReplaced(
    key: number,
    part: InternalTemplatePart,
  ): TemplateConfig {
    return new TemplateConfig(this.parts.with(key, part));
  }

  withoutPart(key: number): TemplateConfig {
    return new TemplateConfig(this.parts.without(key));
  }

  get hasAnyColumnParts(): boolean {
    return some(partIsColumn, this.parts.values());
  }

  [Symbol.iterator]() {
    return this.parts[Symbol.iterator]();
  }
}
