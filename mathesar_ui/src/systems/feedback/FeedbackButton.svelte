<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconFeedback } from '@mathesar/icons';
  import { DropdownMenu, Icon } from '@mathesar-component-library';

  import Feedback from './Feedback.svelte';
</script>

<div class="feedback-button">
  <DropdownMenu
    triggerAppearance="custom"
    size="small"
    closeOnInnerClick={false}
    showArrow={false}
    menuStyle="--Menu__padding-x: 0.3em;"
  >
    <div class="trigger" slot="trigger">
      <Icon {...iconFeedback} size="0.9em" />
      {$_('feedback')}
    </div>
    <div class="feedback-content">
      <Feedback />
    </div>
  </DropdownMenu>
</div>

<style lang="scss">
  .feedback-button {
    --button-border: none;
    --button-color: var(--yellow-300);
  }
  .trigger {
    display: flex;
    align-items: center;
    gap: var(--size-ultra-small);
  }
  .feedback-content {
    padding: var(--size-small);
  }
</style>
