<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Select from '@mathesar-component-library-dir/select/Select.svelte';
  import Dropdown from '../Dropdown.svelte';

  const meta = {
    title: 'Components/Dropdown',
    component: Dropdown,
    parameters: {
      controls: {
        hideNoControlsWarning: true,
        expanded: true,
      },
    },
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <Dropdown>
    <svelte:fragment slot="trigger">
      <span>Click to open</span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="content">Here is some content</div>
    </svelte:fragment>
  </Dropdown>
</Story>

<Story name="Nested">
  <Dropdown>
    <svelte:fragment slot="trigger">
      <span>Favorites</span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="content">
        <div>
          Color:
          <Select
            options={[
              { id: 1, label: 'Burgundy' },
              { id: 2, label: 'Chartreuse' },
              { id: 3, label: 'Mauve' },
              { id: 4, label: 'Taupe' },
            ]}
          />
        </div>
        <div>
          Fruit:
          <Select
            options={[
              { id: 1, label: 'Durian' },
              { id: 2, label: 'Pawpaw' },
              { id: 3, label: 'Imbe' },
              { id: 4, label: 'Rambutan' },
            ]}
          />
        </div>
      </div>
    </svelte:fragment>
  </Dropdown>
  <div style="height: 200px;" />
</Story>

<Story name="Deeply Nested">
  <Dropdown>
    <svelte:fragment slot="trigger">
      <span>Preferences</span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="content">
        <Dropdown>
          <svelte:fragment slot="trigger">
            <span>Favorites</span>
          </svelte:fragment>
          <svelte:fragment slot="content">
            <div class="content">
              <div>
                Color:
                <Select
                  options={[
                    { id: 1, label: 'Burgundy' },
                    { id: 2, label: 'Chartreuse' },
                    { id: 3, label: 'Mauve' },
                    { id: 4, label: 'Taupe' },
                  ]}
                />
              </div>
              <div>
                Fruit:
                <Select
                  options={[
                    { id: 1, label: 'Durian' },
                    { id: 2, label: 'Pawpaw' },
                    { id: 3, label: 'Imbe' },
                    { id: 4, label: 'Rambutan' },
                  ]}
                />
              </div>
            </div>
          </svelte:fragment>
        </Dropdown>
      </div>
    </svelte:fragment>
  </Dropdown>
  <div style="height: 300px;" />
</Story>

<style>
  .content {
    padding: 10px;
  }
</style>
