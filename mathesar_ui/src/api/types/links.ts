interface Referent {
  referent_table: number;
  column_name: string;
}

interface OneToAny {
  reference_table: number;
  reference_column_name: string;
  referent_table: number;
}

export interface OneToOne extends OneToAny {
  link_type: 'one-to-one';
}
export interface OneToMany extends OneToAny {
  link_type: 'one-to-many';
}

export interface ManyToMany {
  link_type: 'many-to-many';
  mapping_table_name: string;
  referents: Referent[];
}

export type LinksPostRequest = OneToOne | OneToMany | ManyToMany;

export type LinkType = LinksPostRequest['link_type'];
