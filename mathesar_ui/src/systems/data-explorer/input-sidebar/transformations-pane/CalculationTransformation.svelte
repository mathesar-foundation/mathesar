<script lang="ts">
  export let model;
  export let columns;
  export let limitEditing = false;

  let formula = model?.spec?.formula || '';
  let outputColumn = model?.spec?.outputColumn || '';

  function handleFormulaChange(event) {
    formula = event.target.value;
    model.spec = { ...model.spec, formula };
    // You would trigger update to parent here
  }

  function handleOutputColumnChange(event) {
    outputColumn = event.target.value;
    model.spec = { ...model.spec, outputColumn };
    // You would trigger update to parent here
  }
</script>

<div class="calculation-transform">
  <label>
    Formula:
    <input type="text" bind:value={formula} on:input={handleFormulaChange} {disabled:limitEditing} />
  </label>
  <label>
    Output Column Name:
    <input type="text" bind:value={outputColumn} on:input={handleOutputColumnChange} {disabled:limitEditing} />
  </label>
</div>

<style>
.calculation-transform {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
