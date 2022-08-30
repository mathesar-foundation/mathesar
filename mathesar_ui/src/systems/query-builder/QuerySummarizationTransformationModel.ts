import type { QueryInstanceSummarizationTransformation } from '@mathesar/api/queries/queryList';
import { ImmutableMap } from '@mathesar/component-library';

export interface QuerySummarizationAggregationEntry {
  inputAlias: string;
  outputAlias: string;
  function: 'aggregate_to_array' | 'count';
  displayName: string;
}

export interface QuerySummarizationTransformationEntry {
  columnIdentifier: string;
  preprocFunctionIdentifier?: string;
  aggregations: ImmutableMap<string, QuerySummarizationAggregationEntry>;
  displayNames: Record<string, string>;
}

export default class QuerySummarizationTransformationModel
  implements QuerySummarizationTransformationEntry
{
  columnIdentifier;

  preprocFunctionIdentifier;

  aggregations;

  displayNames;

  constructor(
    transformation:
      | QueryInstanceSummarizationTransformation
      | Omit<QuerySummarizationTransformationEntry, 'displayNames'>,
  ) {
    if ('columnIdentifier' in transformation) {
      this.columnIdentifier = transformation.columnIdentifier;
      this.preprocFunctionIdentifier = transformation.preprocFunctionIdentifier;
      this.aggregations = transformation.aggregations;
      this.displayNames = [...transformation.aggregations.values()].reduce(
        (acc, aggValue) => {
          acc[aggValue.outputAlias] = aggValue.displayName;
          return acc;
        },
        {} as Record<string, string>,
      );
    } else {
      const groupingExpression = transformation.spec.grouping_expressions[0];
      const aggregationExpressions =
        transformation.spec.aggregation_expressions;
      const displayNames = transformation.display_names;
      this.columnIdentifier = groupingExpression.input_alias;
      this.preprocFunctionIdentifier = groupingExpression.preproc;
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
      this.displayNames = transformation.display_names;
    }
  }

  getOutputColumnAliases(): string[] {
    return [
      this.columnIdentifier,
      ...[...this.aggregations.values()].map((entry) => entry.outputAlias),
    ];
  }

  toJSON(): QueryInstanceSummarizationTransformation {
    const spec: QueryInstanceSummarizationTransformation['spec'] = {
      grouping_expressions: [
        {
          input_alias: this.columnIdentifier,
          output_alias: this.columnIdentifier,
          preproc: this.preprocFunctionIdentifier,
        },
      ],
      aggregation_expressions: [...this.aggregations.entries()].map(
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
      display_names: this.displayNames,
    };
  }
}
