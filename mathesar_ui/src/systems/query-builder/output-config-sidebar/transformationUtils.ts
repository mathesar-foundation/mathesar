import { ImmutableMap } from '@mathesar-component-library';
import type {
  ProcessedQueryResultColumn,
  ProcessedQueryResultColumnMap,
} from '../utils';
import type { QueryTransformationModel } from '../QueryModel';
import QuerySummarizationTransformationModel from '../QuerySummarizationTransformationModel';

export function calcAllowedColumnsPerTransformation(
  transformationModels: QueryTransformationModel[],
  processedInitialColumns: ProcessedQueryResultColumnMap,
  processedVirtualColumns: ProcessedQueryResultColumnMap,
): ProcessedQueryResultColumnMap[] {
  const latestColumnList = processedInitialColumns;
  const allowedTransformations: ProcessedQueryResultColumnMap[] =
    transformationModels.map((transformation) => {
      if (transformation instanceof QuerySummarizationTransformationModel) {
        const result: Map<
          ProcessedQueryResultColumn['id'],
          ProcessedQueryResultColumn
        > = new Map();
        transformation.getOutputColumnAliases().forEach((alias) => {
          const column =
            processedVirtualColumns.get(alias) ??
            processedInitialColumns.get(alias);
          if (column) {
            result.set(alias, column);
          } else {
            console.error(
              'This should never happen - Output column not found in both virtual and initial column list',
            );
          }
        });

        return new ImmutableMap(result);
      }
      return latestColumnList;
    });
  return allowedTransformations;
}
