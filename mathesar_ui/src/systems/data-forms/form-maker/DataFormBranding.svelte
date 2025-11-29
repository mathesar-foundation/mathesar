<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Logo from '@mathesar/components/Logo.svelte';
  import MathesarName from '@mathesar/components/MathesarName.svelte';
  import { RichText } from '@mathesar/components/rich-text';
</script>

<div class="form-branding">
  <RichText text={$_('form_created_with_mathesar')} let:slotName>
    {#if slotName === 'mathesarLogo'}
      <a
        {...$$restProps}
        href="https://mathesar.org"
        target="_blank"
        class="mathesar-link"
      >
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
      &:hover {
        color: var(--color-fg-base);
        border-bottom: solid 2px var(--color-brand);
      }
    }
  }

  .mathesar-link {
    color: var(--base-text-color);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .mathesar-link:hover,
  .mathesar-link:focus {
    text-decoration: underline;
  }
</style>
