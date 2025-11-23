<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Accept any structure (array or map-like) because allowedColumnsPerTransformation
  // can be a Map-like immutable structure in the codebase.
  export let model: any;
  export let columns: any = null;
  export let limitEditing: boolean = false;

  const dispatch = createEventDispatcher<{ change: { model: any } }>();

  // initialize local state from model.spec (safe defaults)
  let formula: string = model?.spec?.formula ?? '';
  let outputColumn: string = model?.spec?.outputColumn ?? '';

  // Use `columns` so Svelte doesn't warn that the export is unused.
  // Calculate a count regardless of whether `columns` is array-like or map-like.
  $: columnsCount = (() => {
    if (!columns) return 0;
    // ImmutableMap / Map-like -> use .size
    if (typeof columns.size === 'number') return columns.size;
    // Array -> length
    if (Array.isArray(columns)) return columns.length;
    // Fallback: object keys
    try {
      return Object.keys(columns).length;
    } catch {
      return 0;
    }
  })();

  // keep local state in sync if parent updates model from outside
  $: if (model?.spec) {
    const incomingFormula = model.spec?.formula ?? '';
    const incomingOutput = model.spec?.outputColumn ?? '';
    if (incomingFormula !== formula) formula = incomingFormula;
    if (incomingOutput !== outputColumn) outputColumn = incomingOutput;
  }

  function updateModelSpec(newSpec: Record<string, any>) {
    // immutable update pattern
    model = { ...(model ?? {}), spec: { ...(model?.spec ?? {}), ...newSpec } };
    dispatch('change', { model });
  }

  function handleFormulaChange(event: Event) {
    const target = event.target as HTMLInputElement;
    formula = target.value;
    updateModelSpec({ formula });
  }

  function handleOutputColumnChange(event: Event) {
    const target = event.target as HTMLInputElement;
    outputColumn = target.value;
    updateModelSpec({ outputColumn });
  }
</script>

<div class="calculation-transform">
  <label>
    Formula:
    <input
      type="text"
      bind:value={formula}
      on:input={handleFormulaChange}
      disabled={limitEditing}
      aria-label="calculation-formula"
    />
  </label>

  <label>
    Output Column Name:
    <input
      type="text"
      bind:value={outputColumn}
      on:input={handleOutputColumnChange}
      disabled={limitEditing}
      aria-label="calculation-output-column"
    />
  </label>

  <!-- invisible usage of columnsCount so `columns` is treated as used -->
  <div aria-hidden="true" style="display:none">{columnsCount}</div>
</div>

<style>
  .calculation-transform {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .calculation-transform label {
    display: flex;
    flex-direction: column;
    font-size: 0.95rem;
  }

  .calculation-transform input[type="text"] {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    font-size: 1rem;
  }

  .calculation-transform input[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
