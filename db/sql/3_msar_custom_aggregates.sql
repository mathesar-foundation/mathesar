/*
This script defines all the necessary functions to be used for custom aggregates.

Currently, we have the following custom aggregate(s):
  - msar.peak_time(time): Calculate the 'average time' (interpreted as peak time) for a column.

Refer to the official documentation of PostgreSQL custom aggregates to learn more.
link: https://www.postgresql.org/docs/current/xaggr.html

We'll use snake_case for legibility and to avoid collisions with internal PostgreSQL naming
conventions.
*/


CREATE SCHEMA IF NOT EXISTS msar;

CREATE OR REPLACE FUNCTION 
msar.time_to_degrees(time_ TIME) RETURNS DOUBLE PRECISION AS $$/*
Convert the given time to degrees (on a 24 hour clock, indexed from midnight).

Examples:
  00:00:00 =>   0
  06:00:00 =>  90
  12:00:00 => 180
  18:00:00 => 270
*/
SELECT EXTRACT(EPOCH FROM time_) * 360 / 86400;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
msar.degrees_to_time(degrees DOUBLE PRECISION) RETURNS TIME AS $$/*
Convert given degrees to time (on a 24 hour clock, indexed from midnight).

Steps:
- First, the degrees value is confined to range [0,360°)
- Then the resulting value is converted to time indexed from midnight.

Examples:
    0 => 00:00:00
   90 => 06:00:00
  180 => 12:00:00
  270 => 18:00:00
  540 => 12:00:00
  -90 => 18:00:00

Inverse of msar.time_to_degrees.
*/
SELECT MAKE_INTERVAL(secs => ((degrees::numeric % 360 + 360) % 360)::double precision * 86400 / 360)::time;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION 
msar.add_time_to_vector(sum_so_far point, time_ TIME) RETURNS point as $$/*
Add the given time, converted to a vector on unit circle, to the vector given in first argument.

We add a time to a point by
- converting the time to a point on the unit circle.
- adding that point to the point given in the first argument.

Args:
  sum_so_far: This is a point representing the sum of point so far.
  time_: This is the time to be added to the running sum.

Returns:
  updated value of sum_so_far after adding the time_ to the previous value of sum_so_far.
*/
SELECT point(
  sum_so_far[0] + sind(msar.time_to_degrees(time_)),
  sum_so_far[1] + cosd(msar.time_to_degrees(time_))
);
$$ LANGUAGE SQL STRICT;


CREATE OR REPLACE FUNCTION 
msar.point_to_time(point_ point) RETURNS TIME AS $$/*
Convert a point to degrees and then to time.

Point is converted to time by:
- first converting a point to degrees by calculating the inverse tangent of
  (sum(sine)/sum(cosine))
- then converting the degrees to the time.
- If the point is on the origin, will return null.

Args:
  state: point_ stores the sum of all the times converted to points

Returns:
  time corresponding to the point_ that stores the cumulative sum of points.
*/
SELECT CASE
  /*
  When both sum(sine) and sum(cosine) are zero, the time variables are evenly
  spaced and the answer should be null.

  To avoid garbage output caused by the precision errors of the float
  variables, it's better to extend the condition to:
  Output is null when the distance of the point from the origin is less than
  a certain epsilon. (Epsilon here is 1e-10)
  */
  WHEN point_ <-> point(0,0) < 1e-10 THEN NULL
  ELSE msar.degrees_to_time(atan2d(point_[0],point_[1]))
END;
$$ LANGUAGE SQL;


CREATE OR REPLACE AGGREGATE
msar.peak_time (TIME)/*
Takes a column of type time and calculates the peak time.

Steps:
  - Convert time to degrees.
  - Calculate sine and cosine of the degrees.
  - Add this to the state point so that we have the summation of
    sine and cosine.
  - Calculate the inverse tangent from the state point.
  - Convert this to time, which is the result.

Refer to the following PR to learn more.
Link: https://github.com/centerofci/mathesar/pull/2981
*/
(
  sfunc = msar.add_time_to_vector,
  stype = point,
  finalfunc = msar.point_to_time,
  initcond = '(0,0)'
);
