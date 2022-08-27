import type { QueryInstanceSummarizationTransformation } from '@mathesar/api/queries/queryList';
import { ImmutableMap } from '@mathesar/component-library';

export default class QuerySummarizationTransformationModel {
  columnIdentifier: string;

  preprocFunctionIdentifier: string | undefined;

  aggregations: ImmutableMap<
    string,
    {
      inputAlias: string;
      outputAlias: string;
      function: 'aggregate_to_array' | 'count';
      displayName: string;
    }
  >;

  displayNames: Record<string, string>;

  constructor(transformation: QueryInstanceSummarizationTransformation) {
    const groupingExpression = transformation.spec.grouping_expressions[0];
    const aggregationExpressions = transformation.spec.aggregation_expressions;
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
