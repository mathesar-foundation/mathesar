<script lang="ts">
  import { Icon, LabeledInput } from '@mathesar-component-library';
  import { faFileContract } from '@fortawesome/free-solid-svg-icons';
  import EditableTitle from '@mathesar/components/EditableTitle.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import type QueryManager from './QueryManager';

  export let queryManager: QueryManager;

  const { query } = queryManager;
</script>

<div class="query-builder">
  <div class="title-bar">
    <div class="icon">
      <Icon data={faFileContract} size="2em" />
    </div>
    <div class="name">
      <EditableTitle value={$query.name} size={1.3}/>
      <SaveStatusIndicator status="new"/>
    </div>
    <!-- Save status -->
    <div class="toolbar">
      <!--
        Undo
        Redo
        View SQL
        Close
      -->
    </div>
  </div>
  <div class="content-pane">
    <div class="input-sidebar">
      <div>
        <LabeledInput label="Select Base Table" layout="stacked">
          <SelectTableWithinCurrentSchema prependBlank />
        </LabeledInput>
      </div>
    </div>
    <div class="result" />
    <div class="output-config-sidebar" />
  </div>
</div>

<style lang="scss">
  .query-builder {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    .title-bar {
      display: flex;
      height: 3.5rem;
      align-items: center;
      border-bottom: 1px solid #efefef;
      position: relative;
      overflow: hidden;

      .icon {
        padding: 0 0.3rem 0 1rem;
        flex-shrink: 0;
        flex-grow: 0;

        :global(svg.fa-icon) {
          color: #4285f4;
        }
      }
      .name {
        flex-grow: 1;
        padding-right: 1rem;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;

        :global(.save-status) {
          display: inline-flex;
          flex-shrink: 0;
        }
      }
    }
    .content-pane {
      display: flex;
      position: absolute;
      top: 3.5rem;
      bottom: 0;
      left: 0;
      right: 0;

      .input-sidebar {
        width: 19rem;
        border-right: 1px solid #efefef;
        padding: 0.6rem;
      }
      .result {

      }
      .output-config-sidebar {

      }
    }
  }
</style>
