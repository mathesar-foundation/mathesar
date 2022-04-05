<script lang="ts">
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Label from '../Label.svelte';
  import { LabelController } from '../LabelController';

  const meta = {
    title: 'Components/Label',
  };

  const controller = new LabelController();
</script>

<Meta {...meta} />

<Story name="Basic">
  <p><tt>LabelController</tt> is passed through context</p>
  <Label>
    <Checkbox />
    <span>Foo</span>
  </Label>
</Story>

<Story name="Disabled">
  <p>
    Through the <tt>LabelController</tt>, the input is able to inform the
    <tt>Label</tt>
    that it's disabled. The <tt>Label</tt> then styles itself accordingly.
  </p>
  <Label>
    <Checkbox disabled />
    <span>Foo</span>
  </Label>
</Story>

<Story name="Slot props">
  <p>
    <tt>Label</tt> generates an <tt>inputId</tt> and passes it through slot
    props. A descendant input can then use it to set its own <tt>id</tt>. The
    input will have no way to update the <tt>disabled</tt> state of the label though.
  </p>
  <Label let:inputId>
    <input type="checkbox" id={inputId} />
    <span>Foo</span>
  </Label>
</Story>

<Story name="Manually created controller">
  <p>
    If (for some uncommon reason) you want to associate a <tt>Label</tt> with an
    input that it doesn't contain, then you can manually create a
    <tt>LabelController</tt>
    and pass it to both. You can even use this technique to associate
    <em>multiple</em> labels with one input (though for semantic purposes you should
    not associate multiple inputs with one label).
  </p>
  <ul>
    <li><Label {controller}>First label</Label></li>
    <li><Checkbox labelController={controller} /></li>
    <li><Label {controller}>Second label</Label></li>
  </ul>
</Story>
