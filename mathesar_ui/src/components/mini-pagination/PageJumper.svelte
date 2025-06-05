<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type Pagination from '@mathesar/utils/Pagination';
  import {
    Button,
    InputGroup,
    Label,
    LabelController,
    NumberInput,
  } from '@mathesar-component-library';

  const labelController = new LabelController();
  const numberFormatter = new Intl.NumberFormat();

  export let pagination: Pagination;
  export let recordCount: number;
  export let goToPage: (page: number) => void;

  let { page } = pagination;
  let input: HTMLInputElement;

  $: maxPage = pagination.getMaxPage(recordCount);

  onMount(() => {
    input.focus();
    input.select();
  });
</script>

<form on:submit={() => goToPage(page)}>
  <Label controller={labelController}>{$_('go_to_page')}</Label>
  <div class="input">
    <InputGroup>
      <NumberInput {labelController} bind:value={page} bind:element={input} />
      <Button appearance="primary" type="submit">{$_('go')}</Button>
    </InputGroup>
  </div>
</form>
<div class="help">
  {$_('total_pages')}: {numberFormatter.format(maxPage)}
</div>

<style>
  .input {
    width: 8em;
  }
  .help {
    font-size: var(--sm1);
    color: var(--text-color-muted);
  }
</style>
