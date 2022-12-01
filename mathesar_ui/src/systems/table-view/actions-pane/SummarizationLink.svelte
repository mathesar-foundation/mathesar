<script lang="ts">
  export let summarizationUrl: string;
</script>

<a href={summarizationUrl}>
  <div class="table-summarization">
    <span>
      Open a pre-configured exploration based on the current table display.
    </span>
    <span class="call-to-action">Summarize Table</span>
  </div>
</a>

<style lang="scss">
  a {
    text-decoration: none;
    color: inherit;
  }

  .table-summarization {
    display: flex;
    flex-direction: row;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius-m);

    > :global(* + *) {
      margin-left: 0.5rem;
    }

    border-left: 4px solid var(--brand-500);
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    background-color: var(--yellow-100);
  }

  .call-to-action {
    color: var(--brand-500);
  }
</style>
