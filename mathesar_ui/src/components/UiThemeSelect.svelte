<script lang="ts">
  import { Select } from '@mathesar/component-library';
  import { uiThemePreference } from '@mathesar/stores/localStorage';
  import type { UiTheme } from '@mathesar/utils/uiThemePreference';
  import { _ } from 'svelte-i18n';

  let options: { id: number; value: UiTheme; label: string }[] = [
    { id: 1, value: 'light', label: $_('theme_light') },
    { id: 2, value: 'dark', label: $_('theme_dark') },
    { id: 3, value: 'system', label: $_('theme_system') },
  ];
  let value = options.find((i) => i.value === $uiThemePreference);

  function setUiTheme(event: CustomEvent<(typeof options)[0] | undefined>) {
    if (!event.detail) return;
    uiThemePreference.set(event.detail.value);
  }
</script>

<Select {value} {options} on:change={setUiTheme} triggerAppearance="action" />
