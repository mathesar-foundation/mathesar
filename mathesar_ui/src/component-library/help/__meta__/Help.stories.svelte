<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Help from '../Help.svelte';

  const meta = {
    title: 'Components/Help',
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <ul>
    <li>
      A small amount of content. <Help>I'm helpful!</Help>
    </li>
    <li>
      A large amount of content.

      <Help>
        <h2>How to make a pizza</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Soluta id
          eius cumque, dolor deserunt suscipit distinctio ab, hic dignissimos
          iure fuga dolorem officia animi non atque quod voluptas velit illo!
        </p>
        <h3>Roll the dough</h3>
        <p>Yada yada</p>
        <h3>Apply your toppings</h3>
        <ul>
          <li>Asparagus</li>
          <li>Broccoli</li>
          <li>Cheese</li>
        </ul>
        <h3>Cook!</h3>
        <p>🍕</p>
      </Help>
    </li>
  </ul>
</Story>
