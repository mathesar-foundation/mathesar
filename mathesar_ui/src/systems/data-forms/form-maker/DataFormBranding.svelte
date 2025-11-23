<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Logo from '@mathesar/components/Logo.svelte';
  import MathesarName from '@mathesar/components/MathesarName.svelte';
  import { RichText } from '@mathesar/components/rich-text';

  // Optional: localized accessible label for the link
  const linkLabel = $_('form_created_with_mathesar') ?? 'Created with Mathesar';
</script>

<div class="form-branding" aria-hidden={false}>
  <RichText text={$_('form_created_with_mathesar')} let:slotName>
    {#if slotName === 'mathesarLogo'}
      <!-- keep $$restProps so consumers can provide id/class/data-* etc -->
      <a
        {...$$restProps}
        href="https://mathesar.org"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={linkLabel}
        class="form-branding__link"
      >
        <!-- assume Logo renders decorative SVG; explicitly mark decorative for screen readers -->
        <Logo aria-hidden="true" class="form-branding__logo" />
        <MathesarName class="form-branding__name" />
      </a>
    {/if}
  </RichText>
</div>

<style lang="scss">
  /* Theme tokens expected:
     --sm1, --color-fg-base-muted, --color-fg-base, --color-focus-ring
     Adjust tokens to match your design system variables if named differently.
  */

  .form-branding {
    padding: var(--sm1);
    color: var(--color-fg-base-muted);

    /* allow the branding container to be used inline/stacked safely */
    display: block;

    &__link {
      /* inherit the container text color so link matches theme base text */
      color: inherit;              /* use the parent's computed color */
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      vertical-align: middle;

      /* smoother underline behavior and skip the ink for nicer rendering */
      text-decoration-skip-ink: auto;

      /* keep focus visible and consistent with theme */
      outline: none;
      border-radius: 6px; /* soften focus ring corners */

      /* subtle transition for hover/focus; respect reduced motion preference */
      transition: box-shadow 120ms ease, color 120ms ease, border-color 120ms ease;
    }

    /* Underline on hover and focus (visible to both mouse & keyboard users) */
    .form-branding__link:hover,
    .form-branding__link:focus {
      text-decoration: underline;
      color: var(--color-fg-base); /* ensure hover color is readable / base text */
    }

    /* Improved focus ring for keyboard users - uses theme token */
    .form-branding__link:focus-visible {
      /* Use a subtle ring; ensure contrast against both light/dark */
      box-shadow: 0 0 0 3px var(--color-focus-ring);
      text-decoration: underline;
    }

    /* Logo sizing and accessibility niceties */
    .form-branding__logo {
      display: inline-block;
      width: 1.25rem;    /* adjust to taste */
      height: 1.25rem;
      line-height: 0;
      flex-shrink: 0;
    }

    .form-branding__name {
      display: inline-block;
      font-weight: 600;
      /* ensure the name inherits color, does not impose its own color */
      color: inherit;
    }
  }

  /* Disable transitions for users who prefer reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .form-branding__link {
      transition: none !important;
    }
  }
</style>
