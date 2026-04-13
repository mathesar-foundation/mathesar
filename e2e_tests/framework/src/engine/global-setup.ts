import { outcomeStore } from '../store/outcome-store';

export default async function globalSetup() {
  outcomeStore.clear();
}
