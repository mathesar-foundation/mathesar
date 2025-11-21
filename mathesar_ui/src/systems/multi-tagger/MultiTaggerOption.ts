import type { ResultValue } from '@mathesar/api/rpc/records';

export class MultiTaggerOption {
  readonly key: ResultValue;

  readonly summary: string;

  readonly loading: boolean;

  readonly mappingIds: ResultValue[];

  readonly checked: boolean;

  constructor(p: {
    key: ResultValue;
    summary: string;
    mappingIds?: ResultValue[];
    loading?: boolean;
  }) {
    this.key = p.key;
    this.summary = p.summary;
    this.loading = p.loading ?? false;
    this.mappingIds = p.mappingIds ?? [];
    this.checked = this.mappingIds.length > 0;
  }

  withMappings(mappingIds: ResultValue[]): MultiTaggerOption {
    return new MultiTaggerOption({
      ...this,
      mappingIds: [...this.mappingIds, ...mappingIds],
    });
  }

  withoutMappings(): MultiTaggerOption {
    return new MultiTaggerOption({ ...this, mappingIds: [] });
  }

  asLoading(): MultiTaggerOption {
    return new MultiTaggerOption({ ...this, loading: true });
  }

  asNotLoading(): MultiTaggerOption {
    return new MultiTaggerOption({ ...this, loading: false });
  }
}
