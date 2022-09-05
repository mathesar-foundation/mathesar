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
}

export default class QuerySummarizationTransformationModel
  implements QuerySummarizationTransformationEntry
{
  columnIdentifier;

  preprocFunctionIdentifier;

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
    }
  }

  getOutputColumnAliases(): string[] {
    return [
      this.columnIdentifier,
      ...[...this.aggregations.values()].map((entry) => entry.outputAlias),
    ];
  }

  toJSON(): QueryInstanceSummarizationTransformation {
    const aggregationEntries = [...this.aggregations.entries()];

    const spec: QueryInstanceSummarizationTransformation['spec'] = {
      grouping_expressions: [
        {
          input_alias: this.columnIdentifier,
          output_alias: this.columnIdentifier,
          preproc: this.preprocFunctionIdentifier,
        },
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
}
