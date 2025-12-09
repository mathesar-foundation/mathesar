<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { type SslMode, sslModeOptions } from '@mathesar/api/rpc/servers';
  import { Select, defined } from '@mathesar-component-library';

  const labels: Record<SslMode, string> = {
    prefer: $_('ssl_mode_prefer'),
    require: $_('ssl_mode_require'),
    disable: $_('ssl_mode_disable'),
  };

  export let value: SslMode = 'prefer';
</script>

<Select
  {...$$restProps}
  options={sslModeOptions}
  bind:value
  getLabel={(mode) => defined(mode, (m) => labels[m]) ?? ''}
/>
