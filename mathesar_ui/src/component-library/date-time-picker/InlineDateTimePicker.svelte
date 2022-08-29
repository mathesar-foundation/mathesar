<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type FlatPickr from 'flatpickr/dist/typings';
  import { dayjs } from '@mathesar-component-library-dir/common/utils';
  import flatpickr from 'flatpickr';
  import type { InlineDateTimePickerProps } from './DateTimePickerTypes';

  type $$Props = InlineDateTimePickerProps;
  type DefinedProps = Required<$$Props>;

  const dispatch = createEventDispatcher();

  export let value: $$Props['value'];

  // The following are meant to be non-reactive
  export let type: DefinedProps['type'];
  export let format: DefinedProps['format'];
  export let timeShow24Hr: DefinedProps['timeShow24Hr'] = true;
  export let timeEnableSeconds: DefinedProps['timeEnableSeconds'] = true;

  let element: HTMLDivElement;
  let instance: FlatPickr.Instance;

  onMount(() => {
    instance = flatpickr(element, {
      wrap: true,
      enableTime: type !== 'date',
      enableSeconds: timeEnableSeconds,
      noCalendar: type === 'time',
      dateFormat: format,
      parseDate: (datestr, _format) => dayjs(datestr, _format).toDate(),
      formatDate: (date, _format) => dayjs(date).format(_format),
      time_24hr: timeShow24Hr,
      static: true,
      inline: true,
      monthSelectorType: 'static',
      onChange: (val) => {
        if (val[0]) {
          const prevValue = value;
          const newDayJs = dayjs(val[0]);
          value = newDayJs.format(format);
          dispatch('change', value);
          if (type === 'date') {
            dispatch('dateChange', value);
          } else if (type === 'time') {
            dispatch('timeChange', value);
          } else {
            const prevDayJs = dayjs(prevValue, format);
            if (!prevDayJs.isValid()) {
              dispatch('dateChange', value);
              dispatch('timeChange', value);
              return;
            }
            if (
              prevDayJs.format('YYYY-MM-DD') !== newDayJs.format('YYYY-MM-DD')
            ) {
              dispatch('dateChange', value);
            }
            if (prevDayJs.format('HH:mm') !== newDayJs.format('HH:mm')) {
              dispatch('timeChange', value);
            }
          }
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
