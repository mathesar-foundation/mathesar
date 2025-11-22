<script>
  import {
    faBacon,
    faBreadSlice,
    faCheese,
    faCookie,
  } from '@fortawesome/free-solid-svg-icons';

  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import MultiSelect from '../MultiSelect.svelte';
  import Side from './Side.svelte';

  const meta = {
    title: 'Components/MultiSelect',
    component: MultiSelect,
  };

  const cheese = {
    name: 'block of cheese',
    icon: { data: faCheese },
    price: 0.95,
  };
  const cookie = {
    name: 'chocolate chip cookie',
    icon: { data: faCookie },
    price: 1.95,
  };
  const bread = {
    name: 'wheat bread',
    icon: { data: faBreadSlice },
    price: 0.75,
  };
  const bacon = { name: 'crispy bacon', icon: { data: faBacon }, price: 2.5 };
  const sides = [cheese, cookie, bread, bacon];
  const defaults = [cookie, bacon];

  function getLabel(side) {
    return {
      component: Side,
      props: { side },
    };
  }

  let selectedSides = defaults;
  $: total = selectedSides.map((s) => s.price).reduce((a, b) => a + b, 0);
  $: formattedTotal = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(total);
</script>

<Meta {...meta} />

<Story name="Basic">
  <div>
    Total: {formattedTotal}
    <button
      on:click={() => {
        selectedSides = defaults;
      }}>Reset</button
    >
  </div>
  <div>
    <MultiSelect options={sides} bind:values={selectedSides} {getLabel} />
  </div>
</Story>
