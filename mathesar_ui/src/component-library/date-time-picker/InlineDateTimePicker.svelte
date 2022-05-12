<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type FlatPickr from 'flatpickr/dist/typings';
  import { dayjs } from '@mathesar-component-library-dir/common/utils';
  import flatpickr from 'flatpickr';

  const dispatch = createEventDispatcher();

  export let value: string | null | undefined;

  // The following should be non-reactive
  // To support more options, refer:
  // https://flatpickr.js.org/options/
  export let enableTime = false;
  export let noCalendar = false;
  export let time24hr = true;
  export let dateFormat: string;

  let element: HTMLDivElement;
  let instance: FlatPickr.Instance;

  onMount(() => {
    instance = flatpickr(element, {
      wrap: true,
      enableTime,
      noCalendar,
      dateFormat,
      parseDate: (datestr, format) => dayjs(datestr, format).toDate(),
      formatDate: (date, format) => dayjs(date).format(format),
      time_24hr: time24hr,
      static: true,
      inline: true,
      monthSelectorType: 'static',
      onChange: (val) => {
        if (val[0]) {
          value = dayjs(val[0]).format(dateFormat);
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

<div class="flat-pickr-wrapper">
  <div bind:this={element} class="flat-pickr">
    <input type="hidden" data-input style="display: none;" />
  </div>
</div>
