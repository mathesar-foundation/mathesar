<script lang="ts">
    import { Skeleton } from '@mathesar/component-library';
  </script>
  
  <div class="user-skeleton-container">
    <Skeleton loading={true} />
  </div>
  
  <style lang="scss">
    .user-skeleton-container {
      border-radius: var(--border-radius-l);
      overflow: hidden;
      position: relative;
      height: 15rem;
    }
  </style>