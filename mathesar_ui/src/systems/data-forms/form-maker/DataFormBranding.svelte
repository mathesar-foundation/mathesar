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
    color: var(--color-fg-base-muted);

    a {
      color: var(--color-fg-base);
      text-decoration: none;
      transition:
        color 120ms ease,
        text-decoration 120ms ease;

      &:hover,
      &:focus {
        text-decoration: underline;
        outline: none;
      }
    }
  }
</style>
