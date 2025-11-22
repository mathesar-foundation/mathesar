<script lang="ts">
  export let text = '';

  function getInitials(_text: string) {
    const splitText = _text?.split(/,|_| |\./) || [];
    if (splitText.length > 1) {
      const firstLetter = splitText[0][0]?.toUpperCase() ?? '';
      const secondLetter =
        splitText[splitText.length - 1][0]?.toUpperCase() ?? '';
      return `${firstLetter}${secondLetter}`;
    }
    return splitText[0]?.[0]?.toUpperCase() ?? '';
  }

  function calcColor(_text: string) {
    let hash = 0;
    for (let i = 0; i < _text.length; i += 1) {
      hash = _text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsla(${360 * hash},70%,70%,1)`;
  }

  $: initials = getInitials(text);
  $: color = calcColor(text);
</script>

<div class="text-avatar" style="background:{color}">
  <div>{initials}</div>
</div>
