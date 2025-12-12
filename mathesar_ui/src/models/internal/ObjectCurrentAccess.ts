import { type Readable, writable } from 'svelte/store';

import type { Role } from '../Role';

export class ObjectCurrentAccess<Privilege> {
  private _ownerOid;

  get ownerOid(): Readable<Role['oid']> {
    return this._ownerOid;
  }

  private _currentRolePrivileges;

  get currentRolePrivileges(): Readable<Set<Privilege>> {
    return this._currentRolePrivileges;
  }

  private _currentRoleOwns;

  get currentRoleOwns(): Readable<boolean> {
    return this._currentRoleOwns;
  }

  constructor(props: {
    owner_oid: Role['oid'];
    current_role_priv: Privilege[];
    current_role_owns: boolean;
  }) {
    this._ownerOid = writable(props.owner_oid);
    this._currentRolePrivileges = writable(new Set(props.current_role_priv));
    this._currentRoleOwns = writable(props.current_role_owns);
  }

  set(props: {
    owner_oid: Role['oid'];
    current_role_priv: Privilege[];
    current_role_owns: boolean;
  }) {
    this._ownerOid.set(props.owner_oid);
    this._currentRolePrivileges.set(new Set(props.current_role_priv));
    this._currentRoleOwns.set(props.current_role_owns);
  }
}
