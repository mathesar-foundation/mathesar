<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Logo from '@mathesar/components/Logo.svelte';
  import MathesarName from '@mathesar/components/MathesarName.svelte';
  import { RichText } from '@mathesar/components/rich-text';
</script>

<div class="form-branding">
  <RichText text={$_('form_created_with_mathesar')} let:slotName>
    {#if slotName === 'mathesarLogo'}
      <a {...$$restProps} href="https://mathesar.org" target="_blank">
        <Logo />
        <MathesarName />
      </a>
    {/if}
  </RichText>
</div>

<style lang="scss">
  .form-branding {
    padding: var(--sm1);
    color: var(--text-muted);
    a {
      text-decoration: none;
      &:hover {
        color: var(--text-primary);
        border-bottom: solid 2px var(--color-brand);
      }
    }
  }
</style>
