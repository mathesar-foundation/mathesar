import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';

const DB_TYPES = {
  MATHESAR_TYPES__URI: 'MATHESAR_TYPES.URI',
};

const dbForm: AbstractTypeConfigForm = {
  variables: {},
  layout: {
    orientation: 'vertical',
    elements: [],
  },
};

const uriType: AbstractTypeConfiguration = {
  icon: '?',
  defaultDbType: DB_TYPES.MATHESAR_TYPES__URI,
  cell: {
    type: 'uri',
  },
  getDbConfig: () => ({
    form: dbForm,
    determineDbTypeAndOptions: () => ({
      dbType: DB_TYPES.MATHESAR_TYPES__URI,
      typeOptions: null,
    }),
    constructDbFormValuesFromTypeOptions: () => ({}),
  }),
};

export default uriType;
