SELECT
  "Country",
  "Item Type",
  jsonb_build_object(
    'count',
    COUNT(1) OVER (
      PARTITION BY "Country", "Item Type"
      RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ),
    'first_value',
    first_value(
      jsonb_build_object('Country', "Country", 'Item Type', "Item Type")
    ) OVER (
      PARTITION BY "Country", "Item Type"
      ORDER BY "Country", "Item Type"
      RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ),
    'last_value',
    last_value(
      jsonb_build_object('Country', "Country", 'Item Type', "Item Type")
    ) OVER (
      PARTITION BY "Country", "Item Type"
      ORDER BY "Country", "Item Type"
      RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ),
    'group_id',
    dense_rank() OVER (
      ORDER BY "Country", "Item Type"
      RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
  ) AS mathesar_metadata_col
FROM "5m Sales Records" ORDER BY "Country" , "Item Type" LIMIT 500 OFFSET 2000;
