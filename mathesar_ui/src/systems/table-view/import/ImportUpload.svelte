<script lang="ts">
  import { FileUpload } from '@mathesar/component-library';

  export let setFile: (file: File) => void;
</script>

<FileUpload
  on:add={(event) => {
    const file = event.detail.added.at(0)?.file;
    if (!file) return;
    setFile(file);
  }}
/>
