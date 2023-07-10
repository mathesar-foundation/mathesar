/*
This script defines all the necessary functions to be used for custom aggregates.

Currently, we have the following custom aggregate(s):
  - Peak time aggregation (takes a list of times and calculates the modular average)

A PostgreSQL custom aggregate function should have the following structure:

  CREATE AGGREGATE sum (complex)
  (
      sfunc = ...,
      stype = ...,
      finalfunc = ...,  // (optional)
      initcond = ...
  );


  - sfunc stands for "state transition function", which updates the state
    value as each successive input row is processed.
  - stype stands for "state value type", which defines the data type of the
    state value.
  - finalfunc stands for "final function", which calculates the final value
    of the aggregate from the state value.
  - initcond stands for "initial condition", which defines the initial condition
    (value) of the state.


Refer to the official documentation for PostgreSQL custom aggregates function
to dive deeper.
link: https://www.postgresql.org/docs/current/xaggr.html


We'll use snake_case for legibility and to avoid collisions with internal
PostgreSQL naming conventions.

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
The function converts (degrees/360°) to an equivalent fraction of 86400 seconds,
and then converts it to a variable of the time datatype.
*/
  SELECT MAKE_INTERVAL(secs => degrees * 86400 / 360)::time;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION 
msar.accum_vectors_point_to_time(state DOUBLE PRECISION[], time_ TIME) RETURNS DOUBLE PRECISION[] as $$/*
The state value here is a vector of type DOUBLE PRECISION[] (of length 2)

The state transition function takes the current state and time_, converts
the time_ to degrees, calculates the sin and cosine and then adds these
to the state.
*/
  SELECT ARRAY[state[1] + SIND(msar.time_to_degrees(time_)), state[2] + COSD(msar.time_to_degrees(time_))];
$$ LANGUAGE SQL STRICT;


CREATE OR REPLACE FUNCTION 
msar.final_func_peak_time(state DOUBLE PRECISION[]) RETURNS TIME AS $$/*
The state vector now stores the sum of the sines and cosines of each
degrees variable corresponding to each time variable.

To get the mean degrees, we need to calculate the inverse tangent of
(∑sine/∑cosine) which is equivalent to ATAN2D(state[1], state[2])

Then it is converted to the corresponding variable of the time datatype,
which is the actual result of the aggregate.
*/
  SELECT CASE
    /*
    When both ∑sine and ∑cosine are zero, the time variables are evenly
    spaced and the answer should be null.

    To avoid garbage output caused by the precision errors of the float
    variables, it's better to extend the condition to:
    Output is null when the sum of absolute values is less than epsilon.
    (which is 1e-10 while the float precision is in the range of 1e-15)
    */
    WHEN @state[1] + @state[2] < 1e-10 THEN NULL
    ELSE msar.degrees_to_time(
      CASE
        /*
        Range of ATAN2D is (-180°,180°].
        So, we need to add 360° when the result is negative.
        */
        WHEN ATAN2D(state[1], state[2]) < 0 THEN ATAN2D(state[1], state[2]) + 360
        ELSE ATAN2D(state[1], state[2])
      END
    )
  END;
$$ LANGUAGE SQL;


CREATE OR REPLACE AGGREGATE
msar.peak_time (TIME)/*
The aggregate takes a column of type time and calculates the peak time.

Steps:
  - Convert time variable to degrees.
  - Calculate sine and cosine of the degrees.
  - Add this to the state vector so that we have the summation of 
    sine and cosine.
  - Calculate the inverse tangent from the state vector.
  - Convert this to time, which is the result.

Refer to the PR to learn more.
Link: https://github.com/centerofci/mathesar/pull/2981
*/
(
  sfunc = msar.accum_vectors_point_to_time,
  stype = DOUBLE PRECISION[],
  finalfunc = msar.final_func_peak_time,
  initcond = '{0,0}'
);
