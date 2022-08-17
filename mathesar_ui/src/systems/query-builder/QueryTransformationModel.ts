import type { QueryInstanceTransformation } from '@mathesar/api/queries/queryList';

export default class QueryTransformationModel {
  transformation;

  constructor(transformation: QueryInstanceTransformation) {
    this.transformation = transformation;
  }

  toJSON(): QueryInstanceTransformation {
    return this.transformation;
  }
}
