import {
  type SampleDataSchemaIdentifier,
  sampleDataOptions,
} from '@mathesar/api/rpc/databases';

export type InstallationSchema = SampleDataSchemaIdentifier | 'internal';

export function getSampleSchemasFromInstallationSchemas(
  installationSchemas: InstallationSchema[],
): SampleDataSchemaIdentifier[] {
  return sampleDataOptions.filter((o) => installationSchemas.includes(o));
}
