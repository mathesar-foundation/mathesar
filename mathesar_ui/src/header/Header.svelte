<script lang="ts">
  import {
    faDragon,
    faProjectDiagram,
    faUser,
  } from '@fortawesome/free-solid-svg-icons';

  import { selectedDB } from '@mathesar/stores/databases';
  import { selectedSchema } from '@mathesar/stores/schemas';
  import { newImport } from '@mathesar/stores/fileImports';

  import {
    TextAvatar,
    Dropdown,
    Icon,
    Button,
  } from '@mathesar-components';
</script>

<header>
  <div class="logo">
    <div class="image-wrapper">
      <Icon data={faDragon}/>
    </div>
  </div>

  {#if $selectedDB}
    <Dropdown triggerAppearance="plain" triggerClass="selector"
              contentClass="selector-content">
      <svelte:fragment slot="trigger">
        <TextAvatar text={$selectedDB.name}/>
        {$selectedDB.name}
        <span class="separator">/</span>
        {#if $selectedSchema}
          <Icon class="schema" data={faProjectDiagram} />
          {$selectedSchema?.name || ''}
        {/if}
      </svelte:fragment>

      <svelte:fragment slot="content">
        Dropdown
      </svelte:fragment>
    </Dropdown>
  {/if}

  <div class="right-options">
    {#if $selectedSchema}
      <div class="quick-links">
        <Button on:click={() => newImport($selectedDB.name)}>
          New table
        </Button>
      </div>
    {/if}

    <div class="image-wrapper">
      <Icon data={faUser}/>
    </div>
  </div>
</header>

<style global lang="scss">
  @import "Header.scss";
</style>
