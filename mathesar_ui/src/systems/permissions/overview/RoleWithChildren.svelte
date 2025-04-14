<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconTreeChildNodeArrow } from '@mathesar/icons';
  import type { Role } from '@mathesar/models/Role';
  import { Icon, type ImmutableMap } from '@mathesar-component-library';

  export let rolesMap: ImmutableMap<Role['oid'], Role>;
  export let roleOid: Role['oid'];

  $: role = rolesMap.get(roleOid);
  $: members = role?.members;
  $: membersWithUsage = [...($members?.values() ?? [])].filter(
    (member) => rolesMap.get(member.oid)?.inherits,
  );
</script>

<div class="role-with-children">
  <div class="name-and-size">
    <span class="name">{role?.name ?? roleOid}</span>
    {#if membersWithUsage.length}
      <span class="member-count">
        + {$_('child_roles_count', {
          values: { count: membersWithUsage.length },
        })}
      </span>
    {/if}
  </div>
  <div class="members">
    {#each membersWithUsage as member (member.oid)}
      <div class="member">
        <Icon {...iconTreeChildNodeArrow} size="0.75em" />
        <span>{rolesMap.get(member.oid)?.name ?? member.oid}</span>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .role-with-children {
    .name {
      padding: var(--size-extreme-small) var(--size-small);
      background: var(--stormy-100);
      border: 1px solid var(--stormy-300);
      border-radius: var(--border-radius-xl);
      font-weight: var(--font-weight-bold);
      display: inline-flex;
      align-items: center;
      gap: var(--size-ultra-small);
      color: var(--text-color-primary);
      font-size: var(--text-size-base);
    }
    .member-count {
      font-size: var(--text-size-small);
      color: var(--text-color-muted);
      margin-left: var(--size-ultra-small);
    }
    .members {
      .member {
        margin: var(--size-xx-small) var(--size-large);
        display: flex;
        align-items: center;
        gap: var(--size-ultra-small);
        color: var(--text-color-muted);
        font-size: var(--text-size-small);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  :global(body.theme-dark) .role-with-children {
    .name {
      background: var(--stormy-900);
      border-color: var(--stormy-400);
    }
  }
</style>
