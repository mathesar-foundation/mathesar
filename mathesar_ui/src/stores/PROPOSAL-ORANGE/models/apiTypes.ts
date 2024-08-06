export type TODO = unknown;

export interface RawServer {
  id: number;
  host: string;
  port: string;
}

export interface RawDatabase {
  id: number;
  name: string;
  server_id: number;
}

export interface RawCollaborator {
  id: number;
  user_id: number;
  database_id: number;
  role_id: number;
  server_id: number;
}

export interface RawRole {
  oid: number;
  name: string;
}

export interface RawConfiguredRole {
  id: number;
  name: string;
  server_id: number;
}

export interface RawSchema {
  oid: number;
  name: string;
  description: string | null;
}

export interface RawTable {
  oid: number;
  name: string;
  description: string | null;
  metadata: TODO | null;
}

export interface PrefetchedData {
  user: unknown;
  installation_release: string;
  supported_languages: Record<string, string>;
  servers: RawServer[];
  databases: RawDatabase[];
  current_db_id: RawDatabase['id'] | null;
  current_db_schemas: RawSchema[];
  current_schema_oid: RawSchema['oid'] | null;
  current_schema_tables: RawTable[];
}
