<script lang="ts">
  import { isSchemaCountChanged } from '@mathesar/stores/schemas';
  import { refetchSchemasForDB } from '@mathesar/stores/schemas';
  import Logo from '../Logo.svelte';

  let isReloadNecessary = false;
  isSchemaCountChanged.subscribe((value: boolean) => {
    isReloadNecessary = value;
  });
  const getDatabaseNamefromURL = (str: string): string => {
    const strTokens = str.split('/');
    for (let i = 0; i < strTokens.length; i += 1) {
      if (strTokens[i].length) {
        return strTokens[i];
      }
    }
    return '/';
  };

  export let hasResponsiveAbridgement = false;
  export let href: string;
</script>

<a
  {href}
  on:click={async () => {
    if (isReloadNecessary) {
      await refetchSchemasForDB(getDatabaseNamefromURL(href));
      isSchemaCountChanged.set(false);
    }
  }}
  class="home-link"
  class:has-responsive-abridgement={hasResponsiveAbridgement}
>
  <Logo />
  <div class="mathesar">Mathesar</div>
</a>

<style>
  .home-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
  }
  .home-link > :global(svg) {
    font-size: 2rem;
    display: block;
  }
  .mathesar {
    font-size: var(--text-size-x-large);
    margin-left: 0.5rem;
  }
  @media (max-width: 45rem) {
    .has-responsive-abridgement .mathesar {
      display: none;
    }
  }
</style>
