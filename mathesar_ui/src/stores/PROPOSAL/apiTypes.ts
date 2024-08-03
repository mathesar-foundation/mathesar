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
