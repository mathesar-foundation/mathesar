import { outcomeStore } from '../store/outcome-store';
import { resetResolverState } from './dependency-resolver';

export default async function globalSetup() {
  outcomeStore.clear();
  resetResolverState();
}
