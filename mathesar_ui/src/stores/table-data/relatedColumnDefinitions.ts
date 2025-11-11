import type { JoinPath, JoinableTablesResult } from '@mathesar/api/rpc/tables';
import numberType from '@mathesar/components/cell-fabric/data-types/number';
import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
import {
  getCellCap,
  getCountLinkedRecordCellCap,
  getDisplayFormatter,
  getMultiLinkedRecordCellCap,
} from '@mathesar/components/cell-fabric/utils';
import type {
  getFiltersForAbstractType } from '@mathesar/stores/abstract-types';
import {
  getAbstractTypeForDbType,
  getPreprocFunctionsForAbstractType,
} from '@mathesar/stores/abstract-types';
import { abstractTypeCategory } from '@mathesar/stores/abstract-types/constants';
import type {
  AbstractType,
  AbstractTypePreprocFunctionDefinition,
} from '@mathesar/stores/abstract-types/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import {
  type IntermediateTableInfo,
  extractIntermediateTableInfo,
} from './joinPathUtils';
import type { RecordSummariesForSheet } from './record-summaries/recordSummaryUtils';
import type {
  AggregationType,
  RelatedColumnEntry,
  RelatedColumns,
} from './relatedColumns';

// Inline MD5 implementation (spark-md5)
// Based on https://github.com/satazor/js-spark-md5
export function md5Hash(str: string): string {
  const hex_chr = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  ];

  function add32(a: number, b: number): number {
    return (a + b) & 0xffffffff;
  }

  function md5cycle(x: number[], k: number[]): void {
    let a = x[0];
    let b = x[1];
    let c = x[2];
    let d = x[3];

    a = (a + ((b & c) | (~b & d)) + k[0] - 680876936) | 0;
    a = (((a << 7) | (a >>> 25)) + b) | 0;
    d = (d + ((a & b) | (~a & c)) + k[1] - 389564586) | 0;
    d = (((d << 12) | (d >>> 20)) + a) | 0;
    c = (c + ((d & a) | (~d & b)) + k[2] + 606105819) | 0;
    c = (((c << 17) | (c >>> 15)) + d) | 0;
    b = (b + ((c & d) | (~c & a)) + k[3] - 1044525330) | 0;
    b = (((b << 22) | (b >>> 10)) + c) | 0;
    a = (a + ((b & c) | (~b & d)) + k[4] - 176418897) | 0;
    a = (((a << 7) | (a >>> 25)) + b) | 0;
    d = (d + ((a & b) | (~a & c)) + k[5] + 1200080426) | 0;
    d = (((d << 12) | (d >>> 20)) + a) | 0;
    c = (c + ((d & a) | (~d & b)) + k[6] - 1473231341) | 0;
    c = (((c << 17) | (c >>> 15)) + d) | 0;
    b = (b + ((c & d) | (~c & a)) + k[7] - 45705983) | 0;
    b = (((b << 22) | (b >>> 10)) + c) | 0;
    a = (a + ((b & c) | (~b & d)) + k[8] + 1770035416) | 0;
    a = (((a << 7) | (a >>> 25)) + b) | 0;
    d = (d + ((a & b) | (~a & c)) + k[9] - 1958414417) | 0;
    d = (((d << 12) | (d >>> 20)) + a) | 0;
    c = (c + ((d & a) | (~d & b)) + k[10] - 42063) | 0;
    c = (((c << 17) | (c >>> 15)) + d) | 0;
    b = (b + ((c & d) | (~c & a)) + k[11] - 1990404162) | 0;
    b = (((b << 22) | (b >>> 10)) + c) | 0;
    a = (a + ((b & c) | (~b & d)) + k[12] + 1804603682) | 0;
    a = (((a << 7) | (a >>> 25)) + b) | 0;
    d = (d + ((a & b) | (~a & c)) + k[13] - 40341101) | 0;
    d = (((d << 12) | (d >>> 20)) + a) | 0;
    c = (c + ((d & a) | (~d & b)) + k[14] - 1502002290) | 0;
    c = (((c << 17) | (c >>> 15)) + d) | 0;
    b = (b + ((c & d) | (~c & a)) + k[15] + 1236535329) | 0;
    b = (((b << 22) | (b >>> 10)) + c) | 0;

    a = (a + ((b & d) | (c & ~d)) + k[1] - 165796510) | 0;
    a = (((a << 5) | (a >>> 27)) + b) | 0;
    d = (d + ((a & c) | (b & ~c)) + k[6] - 1069501632) | 0;
    d = (((d << 9) | (d >>> 23)) + a) | 0;
    c = (c + ((d & b) | (a & ~b)) + k[11] + 643717713) | 0;
    c = (((c << 14) | (c >>> 18)) + d) | 0;
    b = (b + ((c & a) | (d & ~a)) + k[0] - 373897302) | 0;
    b = (((b << 20) | (b >>> 12)) + c) | 0;
    a = (a + ((b & d) | (c & ~d)) + k[5] - 701558691) | 0;
    a = (((a << 5) | (a >>> 27)) + b) | 0;
    d = (d + ((a & c) | (b & ~c)) + k[10] + 38016083) | 0;
    d = (((d << 9) | (d >>> 23)) + a) | 0;
    c = (c + ((d & b) | (a & ~b)) + k[15] - 660478335) | 0;
    c = (((c << 14) | (c >>> 18)) + d) | 0;
    b = (b + ((c & a) | (d & ~a)) + k[4] - 405537848) | 0;
    b = (((b << 20) | (b >>> 12)) + c) | 0;
    a = (a + ((b & d) | (c & ~d)) + k[9] + 568446438) | 0;
    a = (((a << 5) | (a >>> 27)) + b) | 0;
    d = (d + ((a & c) | (b & ~c)) + k[14] - 1019803690) | 0;
    d = (((d << 9) | (d >>> 23)) + a) | 0;
    c = (c + ((d & b) | (a & ~b)) + k[3] - 187363961) | 0;
    c = (((c << 14) | (c >>> 18)) + d) | 0;
    b = (b + ((c & a) | (d & ~a)) + k[8] + 1163531501) | 0;
    b = (((b << 20) | (b >>> 12)) + c) | 0;
    a = (a + ((b & d) | (c & ~d)) + k[13] - 1444681467) | 0;
    a = (((a << 5) | (a >>> 27)) + b) | 0;
    d = (d + ((a & c) | (b & ~c)) + k[2] - 51403784) | 0;
    d = (((d << 9) | (d >>> 23)) + a) | 0;
    c = (c + ((d & b) | (a & ~b)) + k[7] + 1735328473) | 0;
    c = (((c << 14) | (c >>> 18)) + d) | 0;
    b = (b + ((c & a) | (d & ~a)) + k[12] - 1926607734) | 0;
    b = (((b << 20) | (b >>> 12)) + c) | 0;

    a = (a + (b ^ c ^ d) + k[5] - 378558) | 0;
    a = (((a << 4) | (a >>> 28)) + b) | 0;
    d = (d + (a ^ b ^ c) + k[8] - 2022574463) | 0;
    d = (((d << 11) | (d >>> 21)) + a) | 0;
    c = (c + (d ^ a ^ b) + k[11] + 1839030562) | 0;
    c = (((c << 16) | (c >>> 16)) + d) | 0;
    b = (b + (c ^ d ^ a) + k[14] - 35309556) | 0;
    b = (((b << 23) | (b >>> 9)) + c) | 0;
    a = (a + (b ^ c ^ d) + k[1] - 1530992060) | 0;
    a = (((a << 4) | (a >>> 28)) + b) | 0;
    d = (d + (a ^ b ^ c) + k[4] + 1272893353) | 0;
    d = (((d << 11) | (d >>> 21)) + a) | 0;
    c = (c + (d ^ a ^ b) + k[7] - 155497632) | 0;
    c = (((c << 16) | (c >>> 16)) + d) | 0;
    b = (b + (c ^ d ^ a) + k[10] - 1094730640) | 0;
    b = (((b << 23) | (b >>> 9)) + c) | 0;
    a = (a + (b ^ c ^ d) + k[13] + 681279174) | 0;
    a = (((a << 4) | (a >>> 28)) + b) | 0;
    d = (d + (a ^ b ^ c) + k[0] - 358537222) | 0;
    d = (((d << 11) | (d >>> 21)) + a) | 0;
    c = (c + (d ^ a ^ b) + k[3] - 722521979) | 0;
    c = (((c << 16) | (c >>> 16)) + d) | 0;
    b = (b + (c ^ d ^ a) + k[6] + 76029189) | 0;
    b = (((b << 23) | (b >>> 9)) + c) | 0;
    a = (a + (b ^ c ^ d) + k[9] - 640364487) | 0;
    a = (((a << 4) | (a >>> 28)) + b) | 0;
    d = (d + (a ^ b ^ c) + k[12] - 421815835) | 0;
    d = (((d << 11) | (d >>> 21)) + a) | 0;
    c = (c + (d ^ a ^ b) + k[15] + 530742520) | 0;
    c = (((c << 16) | (c >>> 16)) + d) | 0;
    b = (b + (c ^ d ^ a) + k[2] - 995338651) | 0;
    b = (((b << 23) | (b >>> 9)) + c) | 0;

    a = (a + (c ^ (b | ~d)) + k[0] - 198630844) | 0;
    a = (((a << 6) | (a >>> 26)) + b) | 0;
    d = (d + (b ^ (a | ~c)) + k[7] + 1126891415) | 0;
    d = (((d << 10) | (d >>> 22)) + a) | 0;
    c = (c + (a ^ (d | ~b)) + k[14] - 1416354905) | 0;
    c = (((c << 15) | (c >>> 17)) + d) | 0;
    b = (b + (d ^ (c | ~a)) + k[5] - 57434055) | 0;
    b = (((b << 21) | (b >>> 11)) + c) | 0;
    a = (a + (c ^ (b | ~d)) + k[12] + 1700485571) | 0;
    a = (((a << 6) | (a >>> 26)) + b) | 0;
    d = (d + (b ^ (a | ~c)) + k[3] - 1894986606) | 0;
    d = (((d << 10) | (d >>> 22)) + a) | 0;
    c = (c + (a ^ (d | ~b)) + k[10] - 1051523) | 0;
    c = (((c << 15) | (c >>> 17)) + d) | 0;
    b = (b + (d ^ (c | ~a)) + k[1] - 2054922799) | 0;
    b = (((b << 21) | (b >>> 11)) + c) | 0;
    a = (a + (c ^ (b | ~d)) + k[8] + 1873313359) | 0;
    a = (((a << 6) | (a >>> 26)) + b) | 0;
    d = (d + (b ^ (a | ~c)) + k[15] - 30611744) | 0;
    d = (((d << 10) | (d >>> 22)) + a) | 0;
    c = (c + (a ^ (d | ~b)) + k[6] - 1560198380) | 0;
    c = (((c << 15) | (c >>> 17)) + d) | 0;
    b = (b + (d ^ (c | ~a)) + k[13] + 1309151649) | 0;
    b = (((b << 21) | (b >>> 11)) + c) | 0;
    a = (a + (c ^ (b | ~d)) + k[4] - 145523070) | 0;
    a = (((a << 6) | (a >>> 26)) + b) | 0;
    d = (d + (b ^ (a | ~c)) + k[11] - 1120210379) | 0;
    d = (((d << 10) | (d >>> 22)) + a) | 0;
    c = (c + (a ^ (d | ~b)) + k[2] + 718787259) | 0;
    c = (((c << 15) | (c >>> 17)) + d) | 0;
    b = (b + (d ^ (c | ~a)) + k[9] - 343485551) | 0;
    b = (((b << 21) | (b >>> 11)) + c) | 0;

    x[0] = (a + x[0]) | 0;
    x[1] = (b + x[1]) | 0;
    x[2] = (c + x[2]) | 0;
    x[3] = (d + x[3]) | 0;
  }

  function md5blk(s: string): number[] {
    const md5blks: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        s.charCodeAt(i) +
        (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) +
        (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  function md51(s: string): number[] {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i: number;
    let length: number;
    let tail: number[];
    let tmp: RegExpMatchArray | null;
    let lo: number;
    let hi: number;

    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    length = s.length;
    tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < length; i += 1) {
      tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
    }
    tail[i >> 2] |= 0x80 << (i % 4 << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i += 1) {
        tail[i] = 0;
      }
    }

    tmp = (n * 8).toString(16).match(/(.*?)(.{0,8})$/);
    lo = parseInt(tmp?.[2] || '0', 16);
    hi = parseInt(tmp?.[1] || '0', 16) || 0;

    tail[14] = lo;
    tail[15] = hi;

    md5cycle(state, tail);
    return state;
  }

  function rhex(n: number): string {
    let s = '';
    for (let j = 0; j < 4; j += 1) {
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0f] + hex_chr[(n >> (j * 8)) & 0x0f];
    }
    return s;
  }

  function hex(x: number[]): string {
    const result: string[] = [];
    for (let i = 0; i < x.length; i += 1) {
      result.push(rhex(x[i]));
    }
    return result.join('');
  }

  function toUtf8(str: string): string {
    if (/[\u0080-\uFFFF]/.test(str)) {
      str = unescape(encodeURIComponent(str));
    }
    return str;
  }

  const hash = md51(toUtf8(str));
  return hex(hash);
}

/**
 * A related column that represents data from a related table.
 * Similar to ProcessedColumn but for columns that don't exist in the current table.
 */
export class RelatedColumn implements CellColumnFabric {
  readonly id: number | string;

  readonly column: {
    id: number | string;
    name: string;
    type: string;
    type_options: null;
    description: string | null;
    nullable: boolean;
    primary_key: boolean;
    metadata: null;
    current_role_priv: string[];
  };

  readonly columnIndex: number;

  readonly tableOid: number;

  readonly isVirtual = true; // Keep for backward compatibility

  readonly sourceTableName: string;

  readonly sourceColumnName: string;

  readonly joinPath: JoinPath;

  readonly multipleResults: boolean;

  readonly aggregation?: AggregationType;

  readonly abstractType: AbstractType;

  readonly cellComponentAndProps: ComponentAndProps;

  readonly inputComponentAndProps: ComponentAndProps;

  readonly simpleInputComponentAndProps: ComponentAndProps;

  readonly allowedFiltersMap: ReturnType<typeof getFiltersForAbstractType>;

  readonly preprocFunctions: AbstractTypePreprocFunctionDefinition[];

  formatCellValue: (
    cellValue: unknown,
    recordSummaries?: RecordSummariesForSheet,
  ) => string | null | undefined;

  readonly currentRolePrivileges: Set<string>;

  readonly isEditable = true; // Will be editable in the future

  readonly initialInputValue = null;

  readonly targetTableOid: number;

  readonly databaseId: number;

  constructor(props: {
    entry: RelatedColumnEntry;
    joinableTablesResult: JoinableTablesResult;
    columnIndex: number;
    baseTableOid: number;
    databaseId: number;
  }) {
    const {
      entry,
      joinableTablesResult,
      columnIndex,
      baseTableOid,
      databaseId,
    } = props;

    // Find the target table info
    // The join path is [[[table_oid, column_attnum], ...]], so we need the last pair in the last array
    // Each pair is [table_oid, column_attnum], and the last pair's table_oid is the target table
    const lastPathSegment = entry.joinPath[entry.joinPath.length - 1];
    const lastPair = lastPathSegment[lastPathSegment.length - 1];
    const targetTableOid = lastPair[0];
    this.targetTableOid = targetTableOid;
    this.databaseId = databaseId;
    const tableInfo =
      joinableTablesResult.target_table_info[String(targetTableOid)];

    if (!tableInfo) {
      throw new Error(
        `Table info not found for OID ${targetTableOid} in join path`,
      );
    }

    // Column IDs in target_table_info.columns are stringified attnums
    const columnInfo = tableInfo.columns[String(entry.columnId)];

    if (!columnInfo) {
      throw new Error(
        `Column info not found for column ID ${entry.columnId} (attnum) in table ${tableInfo.name} (OID ${targetTableOid})`,
      );
    }

    this.sourceTableName = tableInfo.name;
    this.sourceColumnName = columnInfo.name;
    this.joinPath = entry.joinPath;
    this.multipleResults = entry.multipleResults;
    this.aggregation = entry.aggregation;
    this.tableOid = baseTableOid;
    this.columnIndex = columnIndex;

    // Extract intermediate table info for many-to-many relationships with list aggregation
    this.intermediateTableInfo =
      entry.multipleResults && entry.aggregation === 'list'
        ? extractIntermediateTableInfo(
            entry.joinPath,
            baseTableOid,
            targetTableOid,
          )
        : null;

    // Create a unique ID for this related column
    // Using a string to differentiate from real column IDs (which are numbers)
    // Keep 'related_' prefix for backward compatibility with existing URLs
    // Use MD5 hash to match backend ID generation (md5(replace(join_path::text, ' ', '')))
    // Backend removes spaces from JSON, so we do the same for consistency
    const joinPathJson = JSON.stringify(entry.joinPath);
    const normalizedJoinPath = joinPathJson.replace(/\s+/g, '');
    const joinPathHash = md5Hash(normalizedJoinPath);
    this.id = `related_${joinPathHash}_${entry.columnId}`;

    // Create a column-like object
    this.column = {
      id: this.id,
      name: `${this.sourceTableName} → ${this.sourceColumnName}`,
      type: columnInfo.type,
      type_options: null,
      description: null,
      nullable: true,
      primary_key: false,
      metadata: null,
      current_role_priv: ['SELECT'], // related columns are read-only for now
    };

    this.abstractType = getAbstractTypeForDbType(this.column.type, null);

    // Use MultiLinkedRecordCell for list aggregation
    if (this.aggregation === 'list') {
      const multiLinkedRecordCap = getMultiLinkedRecordCellCap({
        tableId: this.targetTableOid,
        databaseId: this.databaseId,
      });
      this.cellComponentAndProps = multiLinkedRecordCap;
      this.inputComponentAndProps = multiLinkedRecordCap;
      this.simpleInputComponentAndProps = multiLinkedRecordCap;
    } else if (this.aggregation === 'count') {
      // Use CountLinkedRecordCell for count aggregation
      // Get formatForDisplay from number type for formatting the count
      const numberCellProps = numberType.get(this.column);
      const sumLinkedRecordCap = getCountLinkedRecordCellCap({
        tableId: this.targetTableOid,
        databaseId: this.databaseId,
        formatForDisplay: numberCellProps.props.formatForDisplay,
      });
      this.cellComponentAndProps = sumLinkedRecordCap;
      this.inputComponentAndProps = sumLinkedRecordCap;
      this.simpleInputComponentAndProps = sumLinkedRecordCap;
    } else {
      // Use the cell capabilities from the abstract type
      const cellCap = getCellCap({
        cellInfo: this.abstractType.cellInfo,
        column: this.column,
      });
      this.cellComponentAndProps = cellCap;
      this.inputComponentAndProps = cellCap;
      this.simpleInputComponentAndProps = cellCap;
    }

    // Related columns are not filterable
    this.allowedFiltersMap = new Map();
    this.preprocFunctions = getPreprocFunctionsForAbstractType(
      this.abstractType.identifier,
    );

    this.formatCellValue = getDisplayFormatter(this.column);

    this.currentRolePrivileges = new Set(['SELECT']);
  }

  /**
   * Checks if a column ID belongs to a related column
   */
  static isRelatedColumnId(id: number | string): boolean {
    return typeof id === 'string' && id.startsWith('related_');
  }

  /**
   * @deprecated Use isRelatedColumnId instead
   */
  static isVirtualColumnId(id: number | string): boolean {
    return RelatedColumn.isRelatedColumnId(id);
  }
}

/**
 * Builds related column definitions from related columns state
 */
export function buildRelatedColumnsFromRelatedColumns(
  relatedColumns: RelatedColumns,
  joinableTablesResult: JoinableTablesResult | undefined,
  baseTableOid: number,
  startingIndex: number,
  databaseId: number,
): RelatedColumn[] {
  if (!joinableTablesResult || relatedColumns.entries.length === 0) {
    return [];
  }

  const relatedColumnsArray: RelatedColumn[] = [];
  let index = 0;

  for (const entry of relatedColumns.entries) {
    try {
      relatedColumnsArray.push(
        new RelatedColumn({
          entry,
          joinableTablesResult,
          columnIndex: startingIndex + index,
          baseTableOid,
          databaseId,
        }),
      );
      index++;
    } catch (error) {
      // Skip invalid entries - they might be from tables/columns that no longer exist
      console.warn('Failed to build related column:', error);
    }
  }

  return relatedColumnsArray;
}

/**
 * @deprecated Use buildRelatedColumnsFromRelatedColumns instead
 */
export function buildVirtualColumnsFromRelatedColumns(
  relatedColumns: RelatedColumns,
  joinableTablesResult: JoinableTablesResult | undefined,
  baseTableOid: number,
  startingIndex: number,
  databaseId: number,
): RelatedColumn[] {
  return buildRelatedColumnsFromRelatedColumns(
    relatedColumns,
    joinableTablesResult,
    baseTableOid,
    startingIndex,
    databaseId,
  );
}
