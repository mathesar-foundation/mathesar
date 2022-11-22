import type { QueryInstanceSummarizationTransformation } from '@mathesar/api/queries';
import { ImmutableMap } from '@mathesar-component-library';

export interface QuerySummarizationAggregationEntry {
  inputAlias: string;
  outputAlias: string;
  function: 'aggregate_to_array' | 'count';
  displayName: string;
}

export interface QuerySummarizationGroupingEntry {
  inputAlias: string;
  outputAlias: string;
  preprocFunction?: string;
}

export interface QuerySummarizationTransformationEntry {
  columnIdentifier: string;
  preprocFunctionIdentifier?: string;
  groups: ImmutableMap<string, QuerySummarizationGroupingEntry>;
  aggregations: ImmutableMap<string, QuerySummarizationAggregationEntry>;
}

export default class QuerySummarizationTransformationModel
  implements QuerySummarizationTransformationEntry
{
  type = 'summarize' as const;

  columnIdentifier;

  preprocFunctionIdentifier;

  groups;

  aggregations;

  constructor(
    transformation:
      | QueryInstanceSummarizationTransformation
      | Omit<QuerySummarizationTransformationEntry, 'displayNames'>,
  ) {
    if ('columnIdentifier' in transformation) {
      this.columnIdentifier = transformation.columnIdentifier;
      this.preprocFunctionIdentifier = transformation.preprocFunctionIdentifier;
      this.aggregations = transformation.aggregations;
      this.groups = transformation.groups;
    } else {
      const baseGroupingColumn = transformation.spec.base_grouping_column;
      const aggregationExpressions =
        transformation.spec.aggregation_expressions ?? [];
      const groupingExpressions =
        transformation.spec.grouping_expressions ?? [];
      const displayNames = transformation.display_names ?? {};
      this.columnIdentifier = baseGroupingColumn;
      this.aggregations = new ImmutableMap(
        aggregationExpressions.map((entry) => [
          entry.input_alias,
          {
            inputAlias: entry.input_alias,
            outputAlias: entry.output_alias,
            function: entry.function,
            displayName: displayNames[entry.output_alias] ?? entry.output_alias,
          },
        ]),
      );
      let groups = new ImmutableMap(
        groupingExpressions.map((entry) => [
          entry.input_alias,
          {
            inputAlias: entry.input_alias,
            outputAlias: entry.output_alias,
            preprocFunction: entry.preproc,
          },
        ]),
      );
      const baseColumnWithinGroupingExp = groups.get(baseGroupingColumn);
      if (baseColumnWithinGroupingExp) {
        this.preprocFunctionIdentifier =
          baseColumnWithinGroupingExp.preprocFunction;
        groups = groups.without(baseGroupingColumn);
      }
      this.groups = groups;
    }
  }

  private getBaseColumnOutputAlias(): string {
    return `${this.columnIdentifier}_grouped`;
  }

  getOutputColumnAliases(): string[] {
    return [
      this.getBaseColumnOutputAlias(),
      ...[...this.groups.values()].map((entry) => entry.outputAlias),
      ...[...this.aggregations.values()].map((entry) => entry.outputAlias),
    ];
  }

  toJSON(): QueryInstanceSummarizationTransformation {
    const aggregationEntries = [...this.aggregations.entries()];
    const groupingEntries = [...this.groups.entries()];

    const spec: QueryInstanceSummarizationTransformation['spec'] = {
      base_grouping_column: this.columnIdentifier,
      grouping_expressions: [
        {
          input_alias: this.columnIdentifier,
          output_alias: this.getBaseColumnOutputAlias(),
          preproc: this.preprocFunctionIdentifier,
        },
        ...groupingEntries.map(([inputAlias, groupObj]) => ({
          input_alias: inputAlias,
          output_alias: groupObj.outputAlias,
          preproc: groupObj.preprocFunction,
        })),
      ],
      aggregation_expressions: aggregationEntries.map(
        ([inputAlias, aggObj]) => ({
          input_alias: inputAlias,
          output_alias: aggObj.outputAlias,
          function: aggObj.function,
        }),
      ),
    };

    return {
      type: 'summarize',
      spec,
      display_names: aggregationEntries.reduce(
        (displayNames, aggregation) => ({
          ...displayNames,
          [aggregation[1].outputAlias]: aggregation[1].displayName,
        }),
        {} as Record<string, string>,
      ),
    };
  }

  isColumnUsedInTransformation(columnAlias: string): boolean {
    return this.getOutputColumnAliases().includes(columnAlias);
  }
}
