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
      padding: var(--sm6) var(--sm2);
      background: var(--neutral-50);
      border: 1px solid var(--neutral-300);
      border-radius: var(--border-radius-xl);
      font-weight: var(--font-weight-bold);
      display: inline-flex;
      align-items: center;
      gap: var(--sm4);
      color: var(--text-color-primary);
      font-size: 1rem;
    }
    .member-count {
      font-size: var(--sm1);
      color: var(--text-color-muted);
      margin-left: var(--sm4);
    }
    .members {
      .member {
        margin: var(--sm3) var(--lg1);
        display: flex;
        align-items: center;
        gap: var(--sm4);
        color: var(--text-color-muted);
        font-size: var(--sm1);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  :global(body.theme-dark) .role-with-children {
    .name {
      background: var(--slate-800);
      border-color: var(--slate-600);
    }
  }
</style>
