<!--
  @component Trims the outer margins of its children.
-->
<script lang="ts"></script>

<div class="margin-trim">
  <slot />
</div>

<style>
  .margin-trim > :first-child {
    margin-top: 0;
  }
  .margin-trim > :last-child {
    margin-bottom: 0;
  }
</style>
