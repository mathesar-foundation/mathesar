import type { RawTableWithMetadata } from '@mathesar/api/rpc/tables';
import { mergeTableMetadata } from '@mathesar/utils/tables';
import type { RecursivePartial } from '@mathesar-component-library';

import type { Schema } from './Schema';

export class Table {
  oid: number;

  name: string;

  description: string | null;

  metadata;

  schema;

  constructor(props: {
    schema: Schema;
    rawTableWithMetadata: RawTableWithMetadata;
  }) {
    this.oid = props.rawTableWithMetadata.oid;
    this.name = props.rawTableWithMetadata.name;
    this.description = props.rawTableWithMetadata.description;
    this.metadata = props.rawTableWithMetadata.metadata;
    this.schema = props.schema;
  }

  // TODO_BETA: Replace this with an update method that updates
  // the same table object
  // @deprecated
  withProperties(
    _rawTableWithMetadata: RecursivePartial<RawTableWithMetadata>,
  ) {
    return new Table({
      schema: this.schema,
      rawTableWithMetadata: {
        oid: this.oid,
        name: this.name,
        description: this.description,
        schema: this.schema.oid,
        ..._rawTableWithMetadata,
        metadata: mergeTableMetadata(
          this.metadata,
          _rawTableWithMetadata.metadata,
        ),
      },
    });
  }
}
