<script lang="ts">
  import { makeForm, Form } from '../index';
  
  export let formConfig;

  $: form = makeForm(formConfig);
</script>

<p>
  <Form {form}/>
</p>

<br/>

<div>
  <pre>
    <code>
      formConfig = {JSON.stringify(formConfig, null, 2)}
    </code>
  </pre>
</div>
