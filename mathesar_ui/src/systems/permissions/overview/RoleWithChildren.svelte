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
      padding: var(--size-extreme-small) var(--size-xx-small);
      background: var(--slate-100);
      border-radius: var(--border-radius-xl);
      font-weight: 500;
      display: inline-block;
    }
    .member-count {
      font-size: var(--text-size-small);
    }
    .members {
      .member {
        margin: var(--size-xx-small) var(--size-large);
        display: flex;
        align-items: flex-start;
        gap: var(--size-ultra-small);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
</style>
