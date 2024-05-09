import type { QueryInstanceInitialColumn } from '@mathesar/api/rest/types/queries';

import type { QueryTransformationModel } from '../../QueryModel';
import {
  type ProcessedQueryResultColumnMap,
  getProcessedOutputColumns,
} from '../../utils';

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
