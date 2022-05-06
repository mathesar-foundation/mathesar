<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import flatpickr from 'flatpickr';

  const dispatch = createEventDispatcher();

  export let value: string;

  // The following should be non-reactive
  // To support more options, refer:
  // https://flatpickr.js.org/options/
  export let enableTime = false;
  export let noCalendar = false;
  export let time24hr = true;

  let element: HTMLDivElement;

  onMount(() => {
    const instance = flatpickr(element, {
      wrap: true,
      enableTime,
      noCalendar,
      time_24hr: time24hr,
      static: true,
      inline: true,
      monthSelectorType: 'static',
      onChange: (val) => {
        console.log(val);
        dispatch('change', val);
      },
    });

    return () => instance.destroy();
  });
</script>

<div bind:this={element} class="flat-pickr">
  <input type="hidden" bind:value data-input style="display: none;" />
</div>
