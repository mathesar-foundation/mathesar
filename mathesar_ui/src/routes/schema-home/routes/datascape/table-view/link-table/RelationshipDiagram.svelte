<script lang="ts">
  import type { RelationshipType } from './linkTableUtils';

  export let type: RelationshipType;

  const connectors = new Map<RelationshipType, string>([
    [
      'many-to-many',
      'M 52,61 c 0,15 40,7 40,22 ' +
        'M 52,61 C 52,76 12,68 12,83 ' +
        'M 52,61 V 83 ' +
        'M 52,43 C 52,28 92,36 92,21 ' +
        'M 52,43 C 52,28 12,36 12,21 ' +
        'M 52,43 V 21',
    ],
    [
      'one-to-many',
      'M 52,21 c 0,15 40,47 40,62 M 52,21 C 52,36 12,68 12,83 M 52,21 v 62',
    ],
    [
      'many-to-one',
      'M 52,83 C 52,68 92,36 92,21 M 52,83 C 52,68 12,36 12,21 M 52,83 V 21',
    ],
    ['one-to-one', 'M 52,83 V 21'],
  ]);
  const classes = new Map<RelationshipType, string>([
    ['many-to-many', 'mm'],
    ['one-to-many', 'om'],
    ['many-to-one', 'mo'],
    ['one-to-one', 'oo'],
  ]);

  const rectProps = { width: 20, height: 20, ry: 2 };
</script>

<svg
  viewBox="0 0 104 104"
  xmlns="http://www.w3.org/2000/svg"
  class={classes.get(type)}
>
  <path d={connectors.get(type)} />
  <rect {...rectProps} x="2" y="2" class="this mo" />
  <rect {...rectProps} x="42" y="2" class="this om mo oo" />
  <rect {...rectProps} x="82" y="2" class="this mo" />
  <rect {...rectProps} x="42" y="42" class="mapping" />
  <rect {...rectProps} x="2" y="82" class="that om" />
  <rect {...rectProps} x="42" y="82" class="that om mo oo" />
  <rect {...rectProps} x="82" y="82" class="that om" />
</svg>

<style>
  svg.om rect:not(.om) {
    visibility: hidden;
  }
  svg.mo rect:not(.mo) {
    visibility: hidden;
  }
  svg.oo rect:not(.oo) {
    visibility: hidden;
  }
  .this {
    fill: var(--this-table-color);
  }
  .that {
    fill: var(--that-table-color);
  }
  .mapping {
    fill: var(--mapping-table-color);
  }
  path {
    stroke-width: 3.1px;
    stroke: #888;
    fill: none;
  }
</style>
