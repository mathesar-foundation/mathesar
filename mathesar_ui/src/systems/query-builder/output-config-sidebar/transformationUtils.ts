import type { ProcessedQueryResultColumnMap } from '../utils';
import type { QueryTransformationModel } from '../QueryModel';
import QuerySummarizationTransformationModel from '../QuerySummarizationTransformationModel';

export function calcAllowedColumnsPerTransformation(
  transformationModels: QueryTransformationModel[],
  processedInitialColumns: ProcessedQueryResultColumnMap,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processedVirtualColumns: ProcessedQueryResultColumnMap,
): ProcessedQueryResultColumnMap[] {
  const latestColumnList = processedInitialColumns;
  const allowedTransformations: ProcessedQueryResultColumnMap[] =
    transformationModels.map((transformation) => {
      if (transformation instanceof QuerySummarizationTransformationModel) {
        // TODO: Implement me, set latestColumnList to calculated virtual columns
      }
      return latestColumnList;
    });
  return allowedTransformations;
}
