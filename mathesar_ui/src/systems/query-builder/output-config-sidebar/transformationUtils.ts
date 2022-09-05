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
  const allowedTransformations: ProcessedQueryResultColumnMap[] = [];
  let latestColumnList = processedInitialColumns;
  allowedTransformations.push(latestColumnList);
  for (let index = 1; index < transformationModels.length; index += 1) {
    const transformation = transformationModels[index - 1];
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

      latestColumnList = new ImmutableMap(result);
    }
    allowedTransformations.push(latestColumnList);
  }
  return allowedTransformations;
}
