<script lang="ts">
  import { getSheetContext } from './utils';

  const { stores } = getSheetContext();
  const { rowWidth } = stores;

  export let style: { [key: string]: string | number };

  function calculateStyle(
    _style: { [key: string]: string | number },
    width: number,
  ) {
    if (!_style) {
      return '';
    }
    return (
      `position:${_style.position};left:${_style.left}px;` +
      `top:${_style.top}px;height:${_style.height}px;` +
      `width:${width}px`
    );
  }

  $: styleString = calculateStyle(style, $rowWidth);

  $: htmlAttributes = {
    'data-sheet-element': 'row',
    'data-sheet-section': 'rows',
  };
</script>

<slot {htmlAttributes} {styleString} />
