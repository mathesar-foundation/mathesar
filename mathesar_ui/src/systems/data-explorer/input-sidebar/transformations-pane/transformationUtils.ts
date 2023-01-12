import type { QueryInstanceInitialColumn } from '@mathesar/api/types/queries';
import {
  getProcessedOutputColumns,
  type ProcessedQueryResultColumnMap,
} from '../../utils';
import type { QueryTransformationModel } from '../../QueryModel';

export function calcAllowedColumnsPerTransformation(
  initialColumns: QueryInstanceInitialColumn[],
  transformationModels: QueryTransformationModel[],
  columnsMetaData: ProcessedQueryResultColumnMap,
): ProcessedQueryResultColumnMap[] {
  const allowedColumnsPerTransform: ProcessedQueryResultColumnMap[] = [];
  let latestColumnList = getProcessedOutputColumns(
    initialColumns.map((column) => column.alias),
    columnsMetaData,
  );
  allowedColumnsPerTransform.push(latestColumnList);
  for (let index = 1; index < transformationModels.length; index += 1) {
    const transformation = transformationModels[index - 1];
    if (transformation.type === 'summarize') {
      latestColumnList = getProcessedOutputColumns(
        transformation.getOutputColumnAliases(),
        columnsMetaData,
      );
    }
    allowedColumnsPerTransform.push(latestColumnList);
  }
  return allowedColumnsPerTransform;
}
