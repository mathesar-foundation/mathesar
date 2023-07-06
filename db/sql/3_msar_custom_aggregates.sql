CREATE OR REPLACE FUNCTION time_to_degrees(_time TIME)
	RETURNS DOUBLE PRECISION AS $$
	SELECT EXTRACT(EPOCH FROM _time)*360 / 86400;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION degrees_to_time(degrees DOUBLE PRECISION)
	RETURNS TIME AS $$
	SELECT MAKE_INTERVAL(secs => degrees * 86400 / 360)::time;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION accum_time(state DOUBLE PRECISION[], _time TIME)
	RETURNS DOUBLE PRECISION[] as $$
	SELECT ARRAY[state[1] + SIND(time_to_degrees(_time)), state[2] + COSD(time_to_degrees(_time))];
$$ LANGUAGE SQL STRICT;


CREATE OR REPLACE FUNCTION final_func_peak_time(state DOUBLE PRECISION[])
    RETURNS TIME AS $$
	SELECT CASE
        WHEN @state[1] + @state[2] < 1e-10 THEN NULL
        ELSE degrees_to_time(
                CASE
                    WHEN ATAN2D(state[1], state[2]) < 0 THEN ATAN2D(state[1], state[2]) + 360
                    ELSE ATAN2D(state[1], state[2])
                END
            )
    END;
$$ LANGUAGE SQL;


CREATE OR REPLACE AGGREGATE peak_time (TIME)
(
    sfunc = accum_time,
    stype = DOUBLE PRECISION[],
    finalfunc = final_func_peak_time,
    initcond = '{0,0}'
);
