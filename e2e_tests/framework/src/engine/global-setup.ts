import { outcomeStore } from '../store/outcome-store';
import { resourceStore } from '../store/resource-store';

export default async function globalSetup() {
  outcomeStore.clear();
  resourceStore.clear();
}
