<script lang="ts">
  import { StringifiedNumberInput } from '@mathesar-component-library';
  import type { NumberFormat } from '@mathesar/api/tables/columns';
  import { StringifiedNumberFormatter } from '@mathesar/component-library/number-input/number-formatter';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { NumberCellProps } from '../typeDefinitions';

  type $$Props = NumberCellProps;

  type ParentValue = $$Props['value'];
  type ChildValue = string | null;

  export let isActive: $$Props['isActive'];
  let parentValue: ParentValue = undefined;
  export { parentValue as value };
  export let disabled: $$Props['disabled'];

  export let format: $$Props['format'];
  // TODO connect this to StringifiedNumberInput
  export let isPercentage: $$Props['isPercentage'];

  // prettier-ignore
  const localeMap = new Map<NumberFormat, string>([
    ['english' , 'en'    ],
    ['german'  , 'de'    ],
    ['french'  , 'fr'    ],
    ['hindi'   , 'hi'    ],
    ['swiss'   , 'de-CH' ],
  ]);

  $: formatterOptions = {
    locale: (format && localeMap.get(format)) ?? undefined,
    allowFloat: true, // TODO set based on DB options
    allowNegative: true,
  };
  $: formatter = new StringifiedNumberFormatter(formatterOptions);

  let childValue: ChildValue = null;

  function getNewChildValue(newParentValue: ParentValue): ChildValue {
    if (newParentValue === undefined || newParentValue === null) {
      return null;
    }
    return String(newParentValue);
  }
  function handleParentValueChange(newParentValue: ParentValue) {
    childValue = getNewChildValue(newParentValue);
  }
  $: handleParentValueChange(parentValue);

  function formatValue(
    v: string | number | null | undefined,
  ): string | null | undefined {
    if (v === undefined || v === null) {
      return v;
    }
    return formatter.format(String(v));
  }
</script>

<SteppedInputCell
  value={parentValue}
  {isActive}
  {disabled}
  {formatValue}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:update
>
  <StringifiedNumberInput
    focusOnMount={true}
    {disabled}
    value={childValue}
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
    on:input={({ detail: newChildValue }) => {
      parentValue = newChildValue;
    }}
    {...formatterOptions}
  />
</SteppedInputCell>
