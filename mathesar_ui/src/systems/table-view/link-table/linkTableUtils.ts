import type { LinkType } from '@mathesar/api/links';
import { getAvailableName } from '@mathesar/utils/db';

/**
 * The API is as simple as possible and does not support a 'many-to-one'
 * relationship type. Instead, it models the 'many-to-one' scenario as a
 * 'one-to-many' scenario with the referent/reference tables swapped. In the
 * front end, however, we _do_ need to present the the 'many-to-one' and
 * 'one-to-many' scenarios to the user as two distinct relationship types.
 */
export type RelationshipType = LinkType | 'many-to-one';

export function getRelationshipType(
  thisHasManyOfThat: boolean | undefined,
  thatHasManyOfThis: boolean | undefined,
  isSelfReferential: boolean,
): RelationshipType | undefined {
  if (thisHasManyOfThat === undefined) {
    return undefined;
  }
  if (isSelfReferential) {
    return thisHasManyOfThat ? 'many-to-many' : 'one-to-one';
  }
  if (thatHasManyOfThis === undefined) {
    return undefined;
  }
  if (thisHasManyOfThat && thatHasManyOfThis) {
    return 'many-to-many';
  }
  if (thisHasManyOfThat) {
    return 'one-to-many';
  }
  if (thatHasManyOfThis) {
    return 'many-to-one';
  }
  return 'one-to-one';
}

// prettier-ignore
const relationshipTypeNames = new Map<RelationshipType, string>([
  ['many-to-many' , 'Many to Many'],
  ['many-to-one'  , 'Many to One'],
  ['one-to-many'  , 'One to Many'],
  ['one-to-one'   , 'One to One'],
]);

export function getRelationshipTypeName(
  relationshipType: RelationshipType,
): string {
  return relationshipTypeNames.get(relationshipType) || '';
}

export function makeFkColumnName(
  targetTableName: string,
  existingColumns: Set<string> = new Set(),
): string {
  return getAvailableName(targetTableName, existingColumns);
}
