<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { FieldLayout } from '@mathesar/components/form';
  import {
    Fieldset,
    LabeledInput,
    RadioGroup,
    TextInput,
  } from '@mathesar-component-library';

  import DisplayACustomNicknameLabel from '../create-database/DisplayACustomNicknameLabel.svelte';

  const strategyOptions = {
    useName: $_('display_the_database_name'),
    useNickname: { component: DisplayACustomNicknameLabel },
  };
  type Strategy = keyof typeof strategyOptions;
  const strategyOptionKeys = Object.keys(strategyOptions) as Strategy[];
  function getStrategyOptionLabel(v: Strategy) {
    return strategyOptions[v];
  }

  export let value: string | undefined = undefined;
</script>

<Fieldset label={$_('in_mathesar')} boxed>
  <FieldLayout>
    <RadioGroup
      options={strategyOptionKeys}
      getRadioLabel={getStrategyOptionLabel}
      isInline
      value={value !== undefined ? 'useNickname' : 'useName'}
      on:change={({ detail: { value: newStrategy } }) => {
        if (newStrategy === 'useName') {
          value = undefined;
        } else {
          value = '';
        }
      }}
    />
  </FieldLayout>
  {#if value !== undefined}
    <FieldLayout>
      <LabeledInput layout="stacked" label={$_('nickname')}>
        <TextInput bind:value />
      </LabeledInput>
    </FieldLayout>
  {/if}
</Fieldset>
