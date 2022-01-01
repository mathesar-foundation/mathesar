<script lang="ts">
  import { Form, makeForm } from '@mathesar-component-library';
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractTypeDbConfigOptions } from '@mathesar/stores/abstract-types/types';

  export let selectedDbType: DbType;
  export let dbOptions: AbstractTypeDbConfigOptions;

  $: form = makeForm(dbOptions.form);
</script>

<Form {form}/>
