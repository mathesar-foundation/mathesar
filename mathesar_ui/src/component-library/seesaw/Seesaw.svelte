<script lang="ts">
  export let position: 'left' | 'right' = 'left';

  $: isLeft = position === 'left';
  $: isRight = position === 'right';
</script>

<div class="seesaw" class:isLeft class:isRight>
  <div class="switcher">
    <div class="left">
      <slot name="left" />
    </div>
    <div class="right">
      <slot name="right" />
    </div>
  </div>
</div>
