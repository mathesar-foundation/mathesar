import type { QueryInstanceInitialColumn } from '@mathesar/api/queries';
import type { ProcessedQueryResultColumnMap } from '../utils';
import { getProcessedOutputColumns } from '../utils';
import type { QueryTransformationModel } from '../QueryModel';
import QuerySummarizationTransformationModel from '../QuerySummarizationTransformationModel';

export function calcAllowedColumnsPerTransformation(
  initialColumns: QueryInstanceInitialColumn[],
  transformationModels: QueryTransformationModel[],
  columnsMetaData: ProcessedQueryResultColumnMap,
): ProcessedQueryResultColumnMap[] {
  const allowedTransformations: ProcessedQueryResultColumnMap[] = [];
  let latestColumnList = getProcessedOutputColumns(
    initialColumns.map((column) => column.alias),
    columnsMetaData,
  );
  allowedTransformations.push(latestColumnList);
  for (let index = 1; index < transformationModels.length; index += 1) {
    const transformation = transformationModels[index - 1];
    if (transformation instanceof QuerySummarizationTransformationModel) {
      latestColumnList = getProcessedOutputColumns(
        transformation.getOutputColumnAliases(),
        columnsMetaData,
      );
    }
    allowedTransformations.push(latestColumnList);
  }
  return allowedTransformations;
}
