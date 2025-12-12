<script>
  import { FormBuilder, makeForm } from '../index';

  export let formConfig;

  $: form = makeForm(formConfig);
</script>

<p>
  <FormBuilder {form} />
</p>

<br />

<div>
  <pre>
    <code>
      formConfig = {JSON.stringify(formConfig, null, 2)}
    </code>
  </pre>
</div>
