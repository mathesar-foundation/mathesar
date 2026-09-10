import {
  type SampleDataSchemaIdentifier,
  sampleDataOptions,
} from '@mathesar/api/rpc/databases';

export type InstallationSchema = SampleDataSchemaIdentifier | 'mathesar_types';

export function getSampleSchemasFromInstallationSchemas(
  installationSchemas: InstallationSchema[],
): SampleDataSchemaIdentifier[] {
  return sampleDataOptions.filter((o) => installationSchemas.includes(o));
}

export function shouldInstallTypes(
  installationSchemas: InstallationSchema[],
): boolean {
  return installationSchemas.includes('mathesar_types');
}
