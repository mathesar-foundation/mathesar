<script>
  import { Icon } from '@mathesar-component-library';
  import { iconAddNew } from '@mathesar/icons';
</script>

<div class="new-indicator">
  <span class="icon"><Icon {...iconAddNew} /></span>
  <span class="label">New</span>
  <div class="background" />
  <svg class="arrow" viewBox="0 0 19 18">
    <path
      d="m0-4.537e-7v18h4.548a8.975 9.034 0 0 0 5.372-1.798l7.185-5.405a2.229
        2.244 0 0 0 0-3.595l-7.185-5.403a8.975 9.034 0 0 0-5.372-1.798z"
      style="fill: currentcolor;"
    />
  </svg>
</div>

<style>
  .new-indicator {
    display: inline-flex;
    position: relative;
    align-items: center;
    --bg-color: #43793d;
    padding: 0.2rem 0 0.2rem 0.2rem;
    color: white;
    pointer-events: none;
    font-size: 0.7rem;
    /* Allows the text to flow into the arrow area a bit, keeping the overall
    width of the indicator short */
    --shift-right-edge: 0.5rem;
  }
  .icon {
    position: relative;
    margin: 0 0.1rem 0.05rem 0;
    z-index: 2;
  }
  .label {
    position: relative;
    text-transform: uppercase;
    font-weight: bold;
    z-index: 2;
  }
  .background {
    position: absolute;
    height: 100%;
    width: calc(100% - var(--shift-right-edge));
    top: 0;
    left: 0;
    width: calc(100% - 0.4rem);
    background: var(--bg-color);
    border-radius: 0.3rem 0 0 0.3rem;
    z-index: 1;
  }
  .arrow {
    position: absolute;
    height: 100%;
    left: calc(100% - var(--shift-right-edge));
    color: var(--bg-color);
    z-index: 1;
  }
</style>
