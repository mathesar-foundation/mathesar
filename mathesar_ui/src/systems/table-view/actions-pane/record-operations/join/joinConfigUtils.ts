/**
 * This represents a "simple" many-to-many relationship such that the mapping
 * table only contains FK columns for the mapping and does not contain any other
 * data. A common use case would be tagging.
 *
 * The relationship is taken from the context of the "current" table, which is
 * not represented in this data structure.
 *
 * For example, if the current table is "movies", the target table could be
 * "genres" and the intermediate table could be "movie_genres".
 */
export interface SimpleManyToManyRelationship {
  target_table: {
    oid: number;
    name: string;
    /** Keys are stringified column attnum values */
    columns: {
      [key: string]: {
        name: string;
        type: string;
      };
    };
  };
  intermediate_table: {
    oid: number;
    name: string;
    /** Keys are stringified column attnum values */
    columns: {
      [key: string]: {
        name: string;
        type: string;
      };
    };
    fk_to_current_table: {
      constraint_oid: number;
      column_attnum: number;
    };
    fk_to_target_table: {
      constraint_oid: number;
      column_attnum: number;
    };
  };
}
