import type {
  QueryInstanceInitialColumn,
  QueryInstanceTransformation,
  QueryInstance,
  QueryRunRequest,
} from '@mathesar/api/types/queries';
import { MissingExhaustiveConditionError } from '@mathesar/utils/errors';
import type { UnsavedQueryInstance } from '@mathesar/stores/queries';
import QueryFilterTransformationModel from './QueryFilterTransformationModel';
import QuerySummarizationTransformationModel from './QuerySummarizationTransformationModel';
import QueryHideTransformationModel from './QueryHideTransformationModel';
import QuerySortTransformationModel from './QuerySortTransformationModel';

export interface QueryModelUpdateDiff {
  model: QueryModel;
  type:
    | 'id'
    | 'name'
    | 'baseTable'
    | 'initialColumnsArray'
    | 'initialColumnName'
    | 'transformations';
  diff: Partial<UnsavedQueryInstance>;
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
      throw new MissingExhaustiveConditionError(transformation);
  }
}

function validate(
  queryModel: Pick<QueryModel, 'base_table' | 'transformationModels'>,
): { isValid: boolean; isRunnable: boolean } {
  if (queryModel.base_table === undefined) {
    return { isValid: false, isRunnable: false };
  }
  const isValid = queryModel.transformationModels.every((transformation) =>
    transformation.isValid(),
  );
  return { isValid, isRunnable: true };
}

export default class QueryModel {
  readonly base_table: UnsavedQueryInstance['base_table'];

  readonly id: UnsavedQueryInstance['id'];

  readonly name: UnsavedQueryInstance['name'];

  readonly description: UnsavedQueryInstance['description'];

  readonly initial_columns: QueryInstanceInitialColumn[];

  readonly transformationModels: QueryTransformationModel[];

  readonly display_names: QueryInstance['display_names'];

  readonly isValid: boolean;

  readonly isRunnable: boolean;

  constructor(model?: UnsavedQueryInstance | QueryModel) {
    this.base_table = model?.base_table;
    this.id = model?.id;
    this.name = model?.name;
    this.description = model?.description;
    this.initial_columns = model?.initial_columns ?? [];
    let transformationModels;
    if (model && 'transformationModels' in model) {
      transformationModels = [...model.transformationModels];
    } else {
      transformationModels =
        model?.transformations?.map(getTransformationModel) ?? [];
    }
    this.transformationModels = transformationModels;
    this.display_names = model?.display_names ?? {};
    const validationResult = validate({
      base_table: model?.base_table,
      transformationModels,
    });
    this.isValid = validationResult.isValid;
    this.isRunnable = validationResult.isRunnable;
  }

  withBaseTable(base_table?: number): QueryModelUpdateDiff {
    const model = new QueryModel({
      base_table,
      id: this.id,
      name: this.name,
    });
    return {
      model,
      type: 'baseTable',
      diff: {
        base_table,
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

  withColumn(column: QueryInstanceInitialColumn): QueryModelUpdateDiff {
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

  withoutColumns(columnAliases: string[]): QueryModelUpdateDiff {
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

  withoutColumn(columnAlias: string): QueryModelUpdateDiff {
    return this.withoutColumns([columnAlias]);
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
        transformations: model.toJson().transformations,
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
        transformations: model.toJson().transformations,
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
        transformations: model.toJson().transformations,
      },
    };
  }

  getColumn(columnAlias: string): QueryInstanceInitialColumn | undefined {
    return this.initial_columns.find((column) => column.alias === columnAlias);
  }

  getSummarizationTransforms(): QuerySummarizationTransformationModel[] {
    return this.transformationModels.filter(
      (transform): transform is QuerySummarizationTransformationModel =>
        transform.type === 'summarize',
    );
  }

  isColumnUsedInTransformations(columnAlias: string): boolean {
    return this.transformationModels.some(
      (transform) =>
        'isColumnUsedInTransformation' in transform &&
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

  toRunRequestJson(): Omit<QueryRunRequest, 'parameters'> {
    if (this.base_table === undefined) {
      throw new Error(
        'Cannot formulate run request since base_table is undefined',
      );
    }
    const transformations = this.isValid
      ? this.transformationModels
      : this.transformationModels.filter((transform) => transform.isValid());
    return {
      base_table: this.base_table,
      initial_columns: this.initial_columns,
      transformations: transformations.map((entry) => entry.toJson()),
      display_names: this.display_names,
    };
  }

  toJson(): UnsavedQueryInstance {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      base_table: this.base_table,
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
