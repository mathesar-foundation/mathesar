import { querySummarizationFunctionIds } from '@mathesar/api/types/queries';
import { abstractTypeCategory } from '../constants';
import type {
  AbstractTypeCategoryIdentifier,
  AbstractTypeSummarizationFunction,
  AbstractTypeSummarizationFunctionsResponse,
  AbstractTypeSummarizationFunctionsResponseValue,
} from '../types';

function mapAllInputTypesToOneOutputType(
  returnType: AbstractTypeCategoryIdentifier,
): AbstractTypeSummarizationFunctionsResponseValue['inputOutputTypeMap'] {
  return Object.fromEntries(
    Object.values(abstractTypeCategory).map((t) => [t, returnType]),
  );
}

function mapInputTypesToTheSameOutputType(): AbstractTypeSummarizationFunctionsResponseValue['inputOutputTypeMap'] {
  return Object.fromEntries(
    Object.values(abstractTypeCategory).map((t) => [t, t]),
  );
}

const functionsResponse: AbstractTypeSummarizationFunctionsResponse = {
  distinct_aggregate_to_array: {
    label: 'List',
    inputOutputTypeMap: mapAllInputTypesToOneOutputType(
      abstractTypeCategory.Array,
    ),
  },
  count: {
    label: 'Count',
    inputOutputTypeMap: mapAllInputTypesToOneOutputType(
      abstractTypeCategory.Number,
    ),
  },
  sum: {
    label: 'Sum',
    inputOutputTypeMap: {
      [abstractTypeCategory.Number]: abstractTypeCategory.Number,
      [abstractTypeCategory.Money]: abstractTypeCategory.Money,
      [abstractTypeCategory.Duration]: abstractTypeCategory.Duration,
    },
  },
  median: {
    label: 'Median',
    inputOutputTypeMap: mapInputTypesToTheSameOutputType(),
  },
  mode: {
    label: 'Mode',
    inputOutputTypeMap: mapInputTypesToTheSameOutputType(),
  },
  percentage_true: {
    label: 'Percentage True',
    inputOutputTypeMap: {
      [abstractTypeCategory.Boolean]: abstractTypeCategory.Number,
    },
  },
  max: {
    label: 'Max',
    inputOutputTypeMap: mapInputTypesToTheSameOutputType(),
  },
};

export function getSummarizationFunctionsForAbstractType(
  categoryIdentifier: AbstractTypeCategoryIdentifier,
): AbstractTypeSummarizationFunction[] {
  const functions: AbstractTypeSummarizationFunction[] = [];
  for (const id of querySummarizationFunctionIds) {
    const { label, inputOutputTypeMap } = functionsResponse[id];
    const outputType = inputOutputTypeMap[categoryIdentifier];
    if (outputType) {
      functions.push({
        id,
        label,
        inputType: categoryIdentifier,
        outputType,
      });
    }
  }
  return functions;
}
