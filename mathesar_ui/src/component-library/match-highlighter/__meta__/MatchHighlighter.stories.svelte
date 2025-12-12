<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import MatchHighlighter from '../MatchHighlighter.svelte';
</script>

<Meta title="Components/MatchHighlighter" />

<Story name="Basic">
  <MatchHighlighter text="Hello world" substring="world" />
</Story>

<Story name="Words next to each other">
  <MatchHighlighter text="foobarbazbat" substring="bar" />
</Story>

<Story name="Overlapping matches">
  <MatchHighlighter text="hotshotshotshots" substring="hotshot" />
</Story>
