<script lang="ts">
  import { onMount } from 'svelte';
  import FormInput from './FormInput.svelte';
  import FormLayout from './FormLayout.svelte';
  import Switch from './Switch.svelte';
  import If from './If.svelte';
  import type {
    FormElement,
    FormBuildConfiguration,
    FormValidationResult,
  } from './types.d';

  export let element: FormElement;
  export let stores: FormBuildConfiguration['stores'];
  export let storeUsage: FormBuildConfiguration['storeUsage'];
  export let variables: FormBuildConfiguration['variables'];
  export let validationResult: FormValidationResult;

  $: store = 'variable' in element ? stores.get(element.variable) : undefined;

  onMount(() => {
    if ('variable' in element) {
      const variableName = element.variable;
      storeUsage.update((existingMap) => {
        const newMap = new Map(existingMap);
        const existingCount = newMap.get(variableName) ?? 0;
        newMap.set(variableName, existingCount + 1);
        return newMap;
      });

      return () => {
        storeUsage.update((existingMap) => {
          const newMap = new Map(existingMap);
          const existingCount = newMap.get(variableName) ?? 0;
          if (existingCount > 0) {
            newMap.set(variableName, existingCount - 1);
          } else {
            newMap.delete(variableName);
          }
          return newMap;
        });
      };
    }
    return () => {};
  });
</script>

{#if element.type === 'input' && store}
  <FormInput
    {...element}
    {...variables[element.variable]}
    {store}
    validationErrors={validationResult.failedChecks[element.variable] || []}
  />
{:else if element.type === 'switch' && store}
  <Switch {store} cases={element.cases} let:element={childElement}>
    <svelte:self {...$$props} element={childElement} />
  </Switch>
{:else if element.type === 'if' && store}
  <If {store} {...element} let:element={childElement}>
    <svelte:self {...$$props} element={childElement} />
  </If>
{:else if element.type === 'layout' || !element.type}
  <FormLayout
    orientation={element.orientation}
    elements={element.elements}
    let:element={childElement}
  >
    <svelte:self {...$$props} element={childElement} />
  </FormLayout>
{/if}
