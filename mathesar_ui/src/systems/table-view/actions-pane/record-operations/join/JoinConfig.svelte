<script lang="ts">
  import { _ } from 'svelte-i18n';

  import TableName from '@mathesar/components/TableName.svelte';
  import {
    CheckboxGroup,
    Collapsible,
    Help,
    component,
  } from '@mathesar-component-library';

  import type { SimpleManyToManyRelationship } from './joinConfigUtils';

  export let simpleManyToManyRelationships: SimpleManyToManyRelationship[];
</script>

<div class="join-config">
  <Collapsible triggerAppearance="ghost" isOpen>
    <div slot="header">
      {$_('simple_many_to_many_relationships')}
      <Help>{$_('simple_many_to_many_relationships_help')}</Help>
    </div>
    <section slot="content">
      <CheckboxGroup
        options={simpleManyToManyRelationships}
        getCheckboxLabel={(r) =>
          component(TableName, { table: { name: r.targetTable.name } })}
      />
    </section>
  </Collapsible>
</div>

<style>
  section {
    padding-left: 2rem;
  }
</style>
