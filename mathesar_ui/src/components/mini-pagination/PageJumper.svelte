<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { FieldLayout } from '@mathesar/components/form';
  import { staticText } from '@mathesar/i18n/staticText';
  import type Pagination from '@mathesar/utils/Pagination';
  import {
    Button,
    InputGroup,
    Label,
    LabelController,
    NumberInput,
  } from '@mathesar-component-library';

  const labelController = new LabelController();

  export let pagination: Pagination;
  export let recordCount: number;
  export let goToPage: (page: number) => void;

  let { page } = pagination;
  let input: HTMLInputElement;

  $: showingMin = pagination.leftBound;
  $: showingMax = Math.min(pagination.rightBound, recordCount);
  $: maxPage = pagination.getMaxPage(recordCount);

  onMount(() => {
    input.focus();
    input.select();
  });
</script>

<FieldLayout>
  <div>{$_('total_records')}: {recordCount}</div>
  <div>{$_('showing')}: {showingMin}{staticText.EN_DASH}{showingMax}</div>
</FieldLayout>

<FieldLayout>
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
    {$_('enter_a_number_between_1_and_max', { values: { max: maxPage } })}
  </div>
</FieldLayout>

<style>
  .input {
    width: 8em;
  }
  .help {
    font-size: var(--sm1);
    color: var(--text-color-muted);
  }
</style>
