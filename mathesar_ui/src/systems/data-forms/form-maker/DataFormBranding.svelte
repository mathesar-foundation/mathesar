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
  color: var(--color-fg-base-muted); /* main form text color */

  a {
    color: var(--color-fg-base);           /* This sets link color to base text color */
    text-decoration: none;
    transition: color 0.2s, border-bottom 0.2s;

    &:hover,
    &:focus {
      color: var(--color-brand);           /* Brand color on hover (or keep base if you want muted hover) */
      border-bottom: solid 2px var(--color-brand);  /* Visible underline on hover/focus */
      text-decoration: underline;
    }
  }
}

</style>
