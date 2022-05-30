<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type FlatPickr from 'flatpickr/dist/typings';
  import { dayjs } from '@mathesar-component-library-dir/common/utils';
  import flatpickr from 'flatpickr';

  const dispatch = createEventDispatcher();

  export let value: string | null | undefined;

  // The following are meant to be non-reactive
  export let type: 'date' | 'time' | 'datetime';
  export let format: string;

  let element: HTMLDivElement;
  let instance: FlatPickr.Instance;

  onMount(() => {
    instance = flatpickr(element, {
      wrap: true,
      enableTime: type !== 'date',
      enableSeconds: true,
      noCalendar: type === 'time',
      dateFormat: format,
      parseDate: (datestr, _format) => dayjs(datestr, _format).toDate(),
      formatDate: (date, _format) => dayjs(date).format(_format),
      time_24hr: true,
      static: true,
      inline: true,
      monthSelectorType: 'static',
      onChange: (val) => {
        if (val[0]) {
          value = dayjs(val[0]).format(format);
          dispatch('change', value);
        }
      },
    });

    return () => instance.destroy();
  });

  $: {
    if (typeof value === 'undefined' || value === null) {
      instance?.clear();
    } else {
      instance?.setDate(value);
    }
  }
</script>

<div bind:this={element} class="flat-pickr">
  <input type="hidden" data-input />
</div>
