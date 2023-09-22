import type { Database } from '@mathesar/AppTypes';
import { getAPI, patchAPI, postAPI } from './utils/requestUtils';

export interface NewDatabaseConnection {
  name: string;
  db_name: string;
  username: string;
  host: string;
  port: string;
  password: string;
}

function add(connectionDetails: NewDatabaseConnection) {
  return postAPI<Database>('/api/db/v0/databases/', connectionDetails);
}

export default {
  add,
};
