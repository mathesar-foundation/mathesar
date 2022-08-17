import type { QueryInstanceSummarizationTransformation } from '@mathesar/api/queries/queryList';

// Placeholder class for Summarization transform
export default class QueryTransformationModel {
  transformation;

  constructor(transformation: QueryInstanceSummarizationTransformation) {
    this.transformation = transformation;
  }

  toJSON(): QueryInstanceSummarizationTransformation {
    return this.transformation;
  }
}
