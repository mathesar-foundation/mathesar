import { getAvailableName } from '@mathesar/utils/db';

export type RelationshipType =
  | 'many-to-many'
  | 'many-to-one'
  | 'one-to-many'
  | 'one-to-one';

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
const relationshipTypeNames = new Map([
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
  return getAvailableName(`${targetTableName}_id`, existingColumns);
}
