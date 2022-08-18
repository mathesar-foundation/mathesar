import type { QueryInstanceSummarizationTransformation } from '@mathesar/api/queries/queryList';

// Placeholder class for Summarization transform
export default class QuerySummarizationTransformationModel {
  transformation;

  constructor(transformation: QueryInstanceSummarizationTransformation) {
    this.transformation = transformation;
  }

  // eslint-disable-next-line class-methods-use-this
  isValid(): boolean {
    return false;
  }

  toJSON(): QueryInstanceSummarizationTransformation {
    return this.transformation;
  }
}
