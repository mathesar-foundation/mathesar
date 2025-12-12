<script lang="ts">
  export let percentage = 0;
  export let ariaValueText = 'Progress';
</script>

<div
  class="progress"
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuetext={ariaValueText}
  {...$$restProps}
>
  <div style="width:{percentage}%" />
</div>
