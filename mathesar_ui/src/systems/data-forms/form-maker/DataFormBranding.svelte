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
      text-decoration: none;
      transition:
        color 0.2s ease,
        text-decoration 0.2s ease;
      &:hover {
        color: var(--color-fg-base);
        border-bottom: solid 2px var(--color-brand);
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 2px;
      }

      &:focus {
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 2px;
        outline: none;
      }

      &:focus-visible {
        outline: 2px solid var(--color-focus, #4a90e2);
        outline-offset: 2px;
        border-radius: 2px;
      }

      &:visited {
        color: var(--color-fg-base);
      }

      &:active {
        opacity: 0.85;
      }
    }
  }
</style>
