<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Logo from '@mathesar/components/Logo.svelte';
  import MathesarName from '@mathesar/components/MathesarName.svelte';
  import { RichText } from '@mathesar/components/rich-text';
</script>

<div class="powered-by-branding">
  <RichText text={$_('powered_by_mathesar')} let:slotName>
    {#if slotName === 'mathesarLogo'}
      <a {...$$restProps} href="https://mathesar.org" target="_blank">
        <Logo />
        <MathesarName />
      </a>
    {/if}
  </RichText>
</div>

<style lang="scss">
  .powered-by-branding {
    padding: var(--sm1);
    color: var(--color-fg-base-muted);
    a {
      text-decoration: none;
      &:hover {
        color: var(--color-fg-base);
        border-bottom: solid 2px var(--color-brand);
      }
    }
  }
</style>
