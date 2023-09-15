/*
This script defines all the necessary functions to be used for custom aggregates in general.

Currently, we have the following custom aggregate(s):
  - msar.peak_time(time): Calculate the 'average time' (interpreted as peak time) for a column.
  - msar.peak_month(date): Calculate the 'average month' (interpreted as peak month) for a column.

Refer to the official documentation of PostgreSQL custom aggregates to learn more.
link: https://www.postgresql.org/docs/current/xaggr.html

We'll use snake_case for legibility and to avoid collisions with internal PostgreSQL naming
conventions.
*/


CREATE SCHEMA IF NOT EXISTS msar;

CREATE OR REPLACE FUNCTION 
msar.time_to_degrees(time_ TIME) RETURNS DOUBLE PRECISION AS $$/*
Convert the given time to degrees (on a 24 hour clock, indexed from midnight).

To get the fraction of 86400 seconds passed, we divide time_ by 86400 and then 
to get the equivalent fraction of 360°, we multiply by 360, which is equivalent
to divide by 240. 

Examples:
  00:00:00 =>   0
  06:00:00 =>  90
  12:00:00 => 180
  18:00:00 => 270
*/
SELECT EXTRACT(EPOCH FROM time_) / 240;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
msar.degrees_to_time(degrees DOUBLE PRECISION) RETURNS TIME AS $$/*
Convert given degrees to time (on a 24 hour clock, indexed from midnight).

Steps:
- First, the degrees value is confined to range [0,360°)
- Then the resulting value is converted to time indexed from midnight.

To get the fraction of 360°, we divide degrees value by 360 and then to get the
equivalent fractions of 86400 seconds, we multiply by 86400, which is equivalent
to multiply by 240. 

Examples:
    0 => 00:00:00
   90 => 06:00:00
  180 => 12:00:00
  270 => 18:00:00
  540 => 12:00:00
  -90 => 18:00:00

Inverse of msar.time_to_degrees.
*/
SELECT MAKE_INTERVAL(secs => ((degrees::numeric % 360 + 360) % 360)::double precision * 240)::time;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION 
msar.add_time_to_vector(point_ point, time_ TIME) RETURNS point as $$/*
Add the given time, converted to a vector on unit circle, to the vector given in first argument.

We add a time to a point by
- converting the time to a point on the unit circle.
- adding that point to the point given in the first argument.

Args:
  point_: A point representing a vector.
  time_: A time that is converted to a vector and added to the vector represented by point_.

Returns:
  point that stores the resultant vector after the addition.
*/
WITH t(degrees) AS (SELECT msar.time_to_degrees(time_))
SELECT point_ + point(sind(degrees), cosd(degrees)) FROM t;
$$ LANGUAGE SQL STRICT;


CREATE OR REPLACE FUNCTION 
msar.point_to_time(point_ point) RETURNS TIME AS $$/*
Convert a point to degrees and then to time.

Point is converted to time by:
- first converting to degrees by calculating the inverse tangent of the point
- then converting the degrees to the time.
- If the point is on or very near the origin, we return null.

Args:
  point_: A point that represents a vector

Returns:
  time corresponding to the vector represented by point_.
*/
SELECT CASE
  /*
  When both sine and cosine are zero, the answer should be null.

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

State value:
  - state value is a variable of type point which stores the running vector
    sum of the points represented by the time variables.

Steps:
  - Convert time to degrees.
  - Calculate sine and cosine of the degrees.
  - Add this to the state point to update the running sum.
  - Calculate the inverse tangent of the state point.
  - Convert the result to time, which is the peak time.

Refer to the following PR to learn more.
Link: https://github.com/centerofci/mathesar/pull/2981
*/
(
  sfunc = msar.add_time_to_vector,
  stype = point,
  finalfunc = msar.point_to_time,
  initcond = '(0,0)'
);


CREATE OR REPLACE FUNCTION 
msar.month_to_degrees(date_ DATE) returns DOUBLE PRECISION AS $$/*
Convert discrete month to degrees.

To get the fraction of 12 months passed, we extract the month from date, subtract 1 from 
the result to confine it in range [0, 12) and divide by 12, then to get the equivalent
fraction of 360°, we multiply by 360, which is equivalent to multiply by 30.

Examples:
  2023-05-02 => 120
  2023-07-12 => 180
  2023-01-01 =>   0
  2023-12-12 => 330
*/
SELECT ((EXTRACT(MONTH FROM date_) - 1)::double precision) * 30;    
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION 
msar.degrees_to_month(degrees DOUBLE PRECISION) RETURNS INT AS $$/*
Convert degrees to discrete month.

To get the fraction of 360°, we divide degrees value by 360 and then to get the equivalent 
fractions of 12 months, we multiply by 12, which is equivalent to divide by 30.

Examples:
     0 =>  1
   120 =>  5
   240 =>  9
   330 => 12
  -120 =>  9
*/
SELECT (((degrees::numeric % 360 + 360) % 360)::double precision / 30)::int + 1;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION 
msar.add_month_to_vector(point_ point, date_ DATE) RETURNS point as $$/*
Add the month, converted to a vector on unit circle, to the vector in the first argument.

We add a date to a point by
- Exracting the month and converting the result to degrees.
- converting the degrees to a point on the unit circle.
- adding that point to the point given in the first argument.

Args:
  point_: A point representing a vector.
  date_: A date_ that is converted to a vector and added to the vector represented by point_.

Returns:
  point that stores the resultant vector after the addition.
*/
WITH t(degrees) AS (SELECT msar.month_to_degrees(date_))
SELECT point_ + point(sind(degrees), cosd(degrees)) FROM t;
$$ LANGUAGE SQL STRICT;


CREATE OR REPLACE FUNCTION 
msar.point_to_month(point_ point) RETURNS int AS $$/*
Convert a point to degrees and then to discrete month.

Point is converted to month by:
- first converting to degrees by calculating the inverse tangent of the point.
- then converting the degrees to the discrete month.
- If the point is on or very near to the origin, we return null.

Args:
  point_: A point that represents a vector.

Returns:
  discrete month corresponding to the vector represented by point_.
*/
SELECT CASE
  /*
  When both sine and cosine are zero, the answer should be null.

  To avoid garbage output caused by the precision errors of the float
  variables, it's better to extend the condition to:
  Output is null when the distance of the point from the origin is less than
  a certain epsilon. (Epsilon here is 1e-10)
  */
  WHEN point_ <-> point(0,0) < 1e-10 THEN NULL
  ELSE msar.degrees_to_month(atan2d(point_[0],point_[1]))
END;
$$ LANGUAGE SQL;


CREATE OR REPLACE AGGREGATE 
msar.peak_month (DATE)/*
Takes a column of type date and calculates the peak month.

State value:
  - state value is a variable of type point which stores the running vector
    sum of the points represented by the date variables.

Steps:
  - Convert date to discrete month.
  - convert the result to degrees.
  - Calculate sine and cosine of the degrees.
  - Add this to the state point to update the running sum.
  - Calculate the inverse tangent of the state point.
  - Convert the result to a month which is the peak month.

Refer to the following PR to learn more.
Link: https://github.com/centerofci/mathesar/pull/3006
*/
(
  sfunc = msar.add_month_to_vector,
  stype = point,
  finalfunc = msar.point_to_month,
  initcond = '(0,0)'
);
