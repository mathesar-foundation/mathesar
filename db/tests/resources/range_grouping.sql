WITH cume_dist_cte AS (
  SELECT "Center", "Patent Expiration Date", cume_dist() OVER (ORDER BY "Center", "Patent Expiration Date") AS cume_dist
  FROM patents
),
ranges AS (
  SELECT "Center", "Patent Expiration Date", CASE
    WHEN cume_dist > 0.00 AND cume_dist <= 0.25 THEN 1
    WHEN cume_dist > 0.25 AND cume_dist <= 0.50 THEN 2
    WHEN cume_dist > 0.50 AND cume_dist <= 0.75 THEN 3
    WHEN cume_dist > 0.75 AND cume_dist <= 1.00 THEN 4
  END as range
  FROM cume_dist_cte
)
SELECT DISTINCT
  range,
  first_value(ROW("Center", "Patent Expiration Date")) OVER w AS min_row,
  last_value(ROW("Center", "Patent Expiration Date")) OVER w AS max_row,
  COUNT(1) OVER w
FROM ranges
WINDOW w AS (
  PARTITION BY range ORDER BY "Center", "Patent Expiration Date" RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
);
