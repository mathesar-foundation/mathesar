export interface DBObjectEntry {
  id: number;
  name: string;
  description: string | null;
}

export type DbType = string;

export interface FilterConfiguration {
  db_type: DbType;
  opitons: {
    op?: string;
    value?: {
      allowed_types: DbType[];
    };
  }[];
}

export interface AbstractTypeResponse {
  name: string;
  identifier: string;
  db_types: DbType[];
  filters?: FilterConfiguration;
}
