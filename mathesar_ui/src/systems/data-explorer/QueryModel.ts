import type {
  AnonymousExploration,
  InitialColumn,
  MaybeSavedExploration,
  QueryInstanceTransformation,
  SavedExploration,
} from '@mathesar/api/rpc/explorations';
import { assertExhaustive } from '@mathesar-component-library';

import QueryFilterTransformationModel from './QueryFilterTransformationModel';
import QueryHideTransformationModel from './QueryHideTransformationModel';
import QuerySortTransformationModel from './QuerySortTransformationModel';
import QuerySummarizationTransformationModel from './QuerySummarizationTransformationModel';
import type { ColumnWithLink } from './utils';

export interface QueryModelUpdateDiff {
  model: QueryModel;
  type:
    | 'id'
    | 'name'
    | 'baseTable'
    | 'initialColumnsArray'
    | 'initialColumnName'
    | 'transformations'
    | 'initialColumnsAndTransformations';
  diff: Partial<MaybeSavedExploration>;
}

export type QueryTransformationModel =
  | QueryFilterTransformationModel
  | QuerySummarizationTransformationModel
  | QueryHideTransformationModel
  | QuerySortTransformationModel;

function getTransformationModel(
  transformation: QueryInstanceTransformation,
): QueryTransformationModel {
  switch (transformation.type) {
    case 'filter':
      return new QueryFilterTransformationModel(transformation);
    case 'summarize':
      return new QuerySummarizationTransformationModel(transformation);
    case 'hide':
      return new QueryHideTransformationModel(transformation);
    case 'order':
      return new QuerySortTransformationModel(transformation);
    default:
      return assertExhaustive(transformation);
  }
}

function validate(
  queryModel: Pick<QueryModel, 'base_table_oid' | 'transformationModels'>,
): { isValid: boolean; isRunnable: boolean } {
  if (queryModel.base_table_oid === undefined) {
    return { isValid: false, isRunnable: false };
  }
  const isValid = queryModel.transformationModels.every((transformation) =>
    transformation.isValid(),
  );
  return { isValid, isRunnable: true };
}

export default class QueryModel {
  readonly database_id: MaybeSavedExploration['database_id'];

  readonly schema_oid: MaybeSavedExploration['schema_oid'];

  readonly base_table_oid: MaybeSavedExploration['base_table_oid'];

  readonly id: MaybeSavedExploration['id'];

  readonly name: MaybeSavedExploration['name'];

  readonly description: MaybeSavedExploration['description'];

  readonly initial_columns: InitialColumn[];

  readonly transformationModels: QueryTransformationModel[];

  readonly display_names: NonNullable<SavedExploration['display_names']>;

  readonly isValid: boolean;

  readonly isRunnable: boolean;

  constructor(model: MaybeSavedExploration | QueryModel) {
    this.database_id = model.database_id;
    this.schema_oid = model.schema_oid;
    this.base_table_oid = model.base_table_oid;
    this.id = model.id;
    this.name = model.name;
    this.description = model.description;
    this.initial_columns = model.initial_columns ?? [];
    let transformationModels;
    if (model && 'transformationModels' in model) {
      transformationModels = [...model.transformationModels];
    } else {
      transformationModels =
        model.transformations?.map(getTransformationModel) ?? [];
    }
    this.transformationModels = transformationModels;
    this.display_names = model.display_names ?? {};
    const validationResult = validate({
      base_table_oid: model.base_table_oid,
      transformationModels,
    });
    this.isValid = validationResult.isValid;
    this.isRunnable = validationResult.isRunnable;
  }

  withBaseTable(base_table?: number): QueryModelUpdateDiff {
    const model = new QueryModel({
      database_id: this.database_id,
      schema_oid: this.schema_oid,
      base_table_oid: base_table,
      id: this.id,
      name: this.name,
    });
    return {
      model,
      type: 'baseTable',
      diff: {
        base_table_oid: base_table,
      },
    };
  }

  withId(id: number): QueryModelUpdateDiff {
    const model = new QueryModel({
      ...this,
      id,
    });
    return {
      model,
      type: 'id',
      diff: {
        id,
      },
    };
  }

  withName(name?: string): QueryModelUpdateDiff {
    const model = new QueryModel({
      ...this,
      name,
    });
    return {
      model,
      type: 'name',
      diff: {
        name,
      },
    };
  }

  withDescription(description?: string): QueryModelUpdateDiff {
    const model = new QueryModel({
      ...this,
      description,
    });
    return {
      model,
      type: 'name',
      diff: {
        description,
      },
    };
  }

  withInitialColumn(column: InitialColumn): QueryModelUpdateDiff {
    const initialColumns = [...this.initial_columns, column];
    const model = new QueryModel({
      ...this,
      initial_columns: initialColumns,
      display_names: {
        ...this.display_names,
        [column.alias]: column.alias,
      },
    });
    return {
      model,
      type: 'initialColumnsArray',
      diff: {
        initial_columns: initialColumns,
      },
    };
  }

  withoutInitialColumns(columnAliases: string[]): QueryModelUpdateDiff {
    const initialColumns = this.initial_columns.filter(
      (entry) => !columnAliases.includes(entry.alias),
    );
    const model = new QueryModel({
      ...this,
      initial_columns: initialColumns,
    });
    return {
      model,
      type: 'initialColumnsArray',
      diff: {
        initial_columns: initialColumns,
      },
    };
  }

  withoutInitialColumn(columnAlias: string): QueryModelUpdateDiff {
    return this.withoutInitialColumns([columnAlias]);
  }

  withDisplayNameForColumn(
    columnAlias: string,
    displayName: string,
  ): QueryModelUpdateDiff {
    const displayNames = {
      ...this.display_names,
      [columnAlias]: displayName,
    };
    const model = new QueryModel({
      ...this,
      display_names: displayNames,
    });
    return {
      model,
      type: 'initialColumnName',
      diff: {
        display_names: displayNames,
      },
    };
  }

  private addTransform(
    transformationModel: QueryTransformationModel,
  ): QueryModelUpdateDiff {
    const model = new QueryModel({
      ...this,
      transformationModels: [...this.transformationModels, transformationModel],
    });
    return {
      model,
      type: 'transformations',
      diff: {
        transformations: model.toMaybeSavedExploration().transformations,
      },
    };
  }

  addFilterTransform(
    filterTransformationModel: QueryFilterTransformationModel,
  ): QueryModelUpdateDiff {
    return this.addTransform(filterTransformationModel);
  }

  addSummarizationTransform(
    summarizationTransformationModel: QuerySummarizationTransformationModel,
  ): QueryModelUpdateDiff {
    if (this.hasSummarizationTransform()) {
      // This should never happen
      throw new Error(
        'QueryModel currently allows only a single summarization transformation',
      );
    }
    return this.addTransform(summarizationTransformationModel);
  }

  addHideTransform(
    hideTransformModel: QueryHideTransformationModel,
  ): QueryModelUpdateDiff {
    return this.addTransform(hideTransformModel);
  }

  addSortTransform(
    sortTransformModel: QuerySortTransformationModel,
  ): QueryModelUpdateDiff {
    return this.addTransform(sortTransformModel);
  }

  removeLastTransform(): QueryModelUpdateDiff {
    const model = new QueryModel({
      ...this,
      transformationModels: this.transformationModels.slice(0, -1),
    });
    return {
      model,
      type: 'transformations',
      diff: {
        transformations: model.toMaybeSavedExploration().transformations,
      },
    };
  }

  updateTransform(
    index: number,
    transform: QueryTransformationModel,
  ): QueryModelUpdateDiff {
    const transformationModels = [...this.transformationModels];
    transformationModels[index] = transform;
    const model = new QueryModel({
      ...this,
      transformationModels,
    });
    return {
      model,
      type: 'transformations',
      diff: {
        transformations: model.toMaybeSavedExploration().transformations,
      },
    };
  }

  getInitialColumnsAndTransformsUtilizingThemByColumnIds(columnIds: number[]) {
    const initialColumnsUsingColumnIds = this.initial_columns.filter((entry) =>
      columnIds.includes(entry.attnum),
    );
    const initialColumnAliases = initialColumnsUsingColumnIds.map(
      (entry) => entry.alias,
    );
    const transformsUsingColumnIds: {
      index: number;
      transform: QueryTransformationModel;
    }[] = [];
    let selectAllFollowingTransforms = false;
    this.transformationModels.forEach((transform, index) => {
      if (selectAllFollowingTransforms) {
        transformsUsingColumnIds.push({
          index,
          transform,
        });
        return;
      }
      if (transform.type === 'summarize') {
        selectAllFollowingTransforms = true;
        transformsUsingColumnIds.push({
          index,
          transform,
        });
        return;
      }
      if (
        initialColumnAliases.some((alias) =>
          transform.isColumnUsedInTransformation(alias),
        )
      ) {
        transformsUsingColumnIds.push({
          index,
          transform,
        });
      }
    });
    return {
      initialColumnsUsingColumnIds,
      transformsUsingColumnIds,
    };
  }

  withoutColumnsById(columnIds: number[]): QueryModelUpdateDiff {
    const initialColumns = this.initial_columns.filter(
      (entry) => !columnIds.includes(entry.attnum),
    );
    let retainedTransformationModels = this.transformationModels;
    const firstSummarizationTransformIndex =
      this.transformationModels.findIndex(
        (transformationModel) => transformationModel.type === 'summarize',
      );
    if (firstSummarizationTransformIndex > -1) {
      retainedTransformationModels = retainedTransformationModels.slice(
        0,
        firstSummarizationTransformIndex,
      );
    }
    const alaisesForTheIds = this.initial_columns
      .filter((entry) => columnIds.includes(entry.attnum))
      .map((entry) => entry.alias);
    const transformationModels = retainedTransformationModels.filter(
      (model) =>
        !alaisesForTheIds.some((alias) =>
          model.isColumnUsedInTransformation(alias),
        ),
    );
    const model = new QueryModel({
      ...this,
      initial_columns: initialColumns,
      transformationModels,
    });
    return {
      model,
      type: 'initialColumnsAndTransformations',
      diff: {
        initial_columns: initialColumns,
        transformations: model.toMaybeSavedExploration().transformations,
      },
    };
  }

  getColumn(columnAlias: string): InitialColumn | undefined {
    return this.initial_columns.find((column) => column.alias === columnAlias);
  }

  getSummarizationTransforms(): QuerySummarizationTransformationModel[] {
    return this.transformationModels.filter(
      (transform): transform is QuerySummarizationTransformationModel =>
        transform.type === 'summarize',
    );
  }

  isColumnUsedInTransformations(columnAlias: string): boolean {
    return this.transformationModels.some((transform) =>
      transform.isColumnUsedInTransformation(columnAlias),
    );
  }

  areColumnsUsedInTransformations(columnAliases: string[]): boolean {
    return columnAliases.some((alias) =>
      this.isColumnUsedInTransformations(alias),
    );
  }

  getOutputColumnAliases(): string[] {
    const summarizationTransforms = this.getSummarizationTransforms();
    if (summarizationTransforms.length > 0) {
      return summarizationTransforms[
        summarizationTransforms.length - 1
      ].getOutputColumnAliases();
    }
    return this.initial_columns.map((entry) => entry.alias);
  }

  getAllSortedColumns(): string[] {
    return this.transformationModels
      .filter(
        (transform): transform is QuerySortTransformationModel =>
          transform.type === 'order',
      )
      .map((entry) => entry.columnIdentifier);
  }

  getAllSortableColumns(): string[] {
    const sortedColumns = new Set(this.getAllSortedColumns());
    return this.getOutputColumnAliases().filter(
      (alias) => !sortedColumns.has(alias),
    );
  }

  toAnonymousExploration(): AnonymousExploration {
    if (this.base_table_oid === undefined) {
      throw new Error(
        'Cannot formulate run request since base_table is undefined',
      );
    }
    const transformations = this.isValid
      ? this.transformationModels
      : this.transformationModels.filter((transform) => transform.isValid());
    return {
      database_id: this.database_id,
      schema_oid: this.schema_oid,
      base_table_oid: this.base_table_oid,
      initial_columns: this.initial_columns,
      transformations: transformations.map((entry) => entry.toJson()),
      display_names: this.display_names,
    };
  }

  getColumnCount(column: ColumnWithLink): number {
    const columnJoinPath = JSON.stringify(column.jpPath);
    return this.initial_columns.filter((entry) => {
      const entryJoinPath = JSON.stringify(entry.join_path);
      return entry.attnum === column.id && entryJoinPath === columnJoinPath;
    }).length;
  }

  toMaybeSavedExploration(): MaybeSavedExploration {
    return {
      database_id: this.database_id,
      schema_oid: this.schema_oid,
      id: this.id,
      name: this.name,
      description: this.description,
      base_table_oid: this.base_table_oid,
      initial_columns: this.initial_columns,
      transformations: this.transformationModels.map((entry) => entry.toJson()),
      display_names: this.display_names,
    };
  }

  isSaved(): boolean {
    return !!this.id;
  }

  hasSummarizationTransform(): boolean {
    return this.transformationModels.some(
      (transform): transform is QuerySummarizationTransformationModel =>
        transform.type === 'summarize',
    );
  }
}
