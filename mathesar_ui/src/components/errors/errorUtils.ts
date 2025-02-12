import { distinct } from 'iter-tools';
import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte';

import type { ComponentWithProps } from '@mathesar/component-library/types';
import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';

import NoConnection from './customized/NoConnection.svelte';
import UnableToConnect from './customized/UnableToConnect.svelte';

const NO_CONNECTION_AVAILABLE = -28030;
const PSYCOPG_OPERATIONAL_ERROR = -30193;

export type GeneralizedError = string | RpcError;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReturnableComponent = ComponentWithProps<any>;

function component<T extends SvelteComponent>(
  c: ComponentType<T>,
  p: ComponentProps<T>,
): ComponentWithProps<T> {
  return { component: c, props: p };
}

function getCustomizedRpcError({
  code,
  message,
}: RpcError): string | ReturnableComponent {
  switch (code) {
    case NO_CONNECTION_AVAILABLE:
      return component(NoConnection, {});
    case PSYCOPG_OPERATIONAL_ERROR:
      return component(UnableToConnect, { message });
    default:
      return message;
  }
}

function getCustomizedError(
  error: GeneralizedError,
): string | ReturnableComponent {
  return typeof error === 'string' ? error : getCustomizedRpcError(error);
}

function getErrorHash(error: GeneralizedError): string {
  if (typeof error === 'string') {
    return JSON.stringify({ type: 'string', error });
  }
  const { code, message } = error;
  return JSON.stringify({ type: 'RpcError', code, message });
}

export function getDistinctErrors(
  errors: Iterable<GeneralizedError>,
): Iterable<GeneralizedError> {
  return distinct(getErrorHash, errors);
}

export function groupErrors(errors: Iterable<GeneralizedError>): {
  stringErrors: string[];
  richErrors: ReturnableComponent[];
} {
  const stringErrors: string[] = [];
  const richErrors: ReturnableComponent[] = [];
  for (const error of errors) {
    const customizedError = getCustomizedError(error);
    if (typeof customizedError === 'string') {
      stringErrors.push(customizedError);
    } else {
      richErrors.push(customizedError);
    }
  }
  return { stringErrors, richErrors };
}
