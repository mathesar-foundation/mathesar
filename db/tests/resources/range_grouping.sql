WITH cume_dist_cte AS (
  SELECT *, cume_dist() OVER (ORDER BY "Center") AS cume_dist
  FROM patents
),
ranges AS (
  SELECT *, CASE
    WHEN cume_dist > 0.00 AND cume_dist <= 0.25 THEN 1
    WHEN cume_dist > 0.25 AND cume_dist <= 0.50 THEN 2
    WHEN cume_dist > 0.50 AND cume_dist <= 0.75 THEN 3
    WHEN cume_dist > 0.75 AND cume_dist <= 1.00 THEN 4
  END as range
  FROM cume_dist_cte
)
SELECT
  range,
  MIN("Center"),
  MAX("Center"),
  COUNT(1)
FROM ranges GROUP BY range ORDER BY range;
