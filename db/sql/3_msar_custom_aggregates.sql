CREATE OR REPLACE FUNCTION time_to_degrees(_time TIME)
	RETURNS DOUBLE PRECISION AS $$
	SELECT EXTRACT(EPOCH FROM _time) * 360 / 86400;
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


CREATE OR REPLACE FUNCTION dow_to_degrees(_date DATE)
	returns DOUBLE PRECISION AS $$
    SELECT (EXTRACT(DOW FROM _date)::double precision) * 360 / 7;    
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION degrees_to_dow(degrees DOUBLE PRECISION)
	returns INT AS $$
    SELECT (ROUND(degrees * 7 / 360)::int) % 7;
$$ LANGUAGE SQL;



CREATE OR REPLACE FUNCTION dow_to_string(_dow INT)
    RETURNS TEXT AS $$
    SELECT CASE
        WHEN _dow = 0 THEN 'Sunday'
        WHEN _dow = 1 THEN 'Monday'
        WHEN _dow = 2 THEN 'Tuesday'
        WHEN _dow = 3 THEN 'Wednesday'
        WHEN _dow = 4 THEN 'Thursday'
        WHEN _dow = 5 THEN 'Friday'
        WHEN _dow = 6 THEN 'Saturday'
    END;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION accum_dow(state DOUBLE PRECISION[], _date DATE)
	RETURNS DOUBLE PRECISION[] as $$
	SELECT ARRAY[state[1] + SIND(dow_to_degrees(_date)), state[2] + COSD(dow_to_degrees(_date))];
$$ LANGUAGE SQL STRICT;


CREATE OR REPLACE FUNCTION final_func_peak_dow(state DOUBLE PRECISION[])
    RETURNS TEXT AS $$
	SELECT CASE
        WHEN @state[1] + @state[2] < 1e-10 THEN NULL
        ELSE dow_to_string(
                degrees_to_dow(
                    CASE
                        WHEN ATAN2D(state[1], state[2]) < 0 THEN ATAN2D(state[1], state[2]) + 360
                        ELSE ATAN2D(state[1], state[2])
                    END
                )
        )
    END;
$$ LANGUAGE SQL;


CREATE OR REPLACE AGGREGATE peak_day_of_week (DATE)
(
    sfunc = accum_dow,
    stype = DOUBLE PRECISION[],
    finalfunc = final_func_peak_dow,
    initcond = '{0,0}'
);