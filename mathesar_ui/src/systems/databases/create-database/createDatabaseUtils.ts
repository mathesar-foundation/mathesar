import {
  sampleDataOptions,
  type SampleDataSchemaIdentifier,
} from '@mathesar/api/rpc/database_setup';

export type InstallationSchema = SampleDataSchemaIdentifier | 'internal';

export function getSampleSchemasFromInstallationSchemas(
  installationSchemas: InstallationSchema[],
): SampleDataSchemaIdentifier[] {
  return sampleDataOptions.filter((o) => installationSchemas.includes(o));
}
