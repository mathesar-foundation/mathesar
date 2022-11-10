import type { DbType } from '@mathesar/AppTypes';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import { TextInput } from '@mathesar-component-library';
import ArrayCell from './components/array/ArrayCell.svelte';
import type { CellComponentFactory, CellColumnLike } from './typeDefinitions';

export interface ArrayColumn extends CellColumnLike {
  type_options: {
    item_type: DbType;
  } | null;
}

const arrayType: CellComponentFactory = {
  get: (): ComponentAndProps =>
    /**
     * TODO: Pass down type options to get array element type
     * and display options
     */
    ({ component: ArrayCell }),
  getInput: (): ComponentAndProps => ({ component: TextInput }),
};

export default arrayType;
