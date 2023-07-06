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


CREATE OR REPLACE FUNCTION dow_to_degrees(_date DATE)
	returns DOUBLE PRECISION AS $$
DECLARE
	_dow INT;
	degrees DOUBLE PRECISION;
BEGIN
	_dow = EXTRACT(DOW FROM _date);
	degrees := ((_dow*360)::DOUBLE PRECISION)/7;	
	return degrees;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION degrees_to_dow(degrees DOUBLE PRECISION)
	returns INT AS $$
DECLARE
	_dow INT;	
BEGIN
	_dow = (ROUND((degrees*7)/360)::INT)%7;
	RETURN _dow;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION dow_to_string(_dow INT)
    RETURNS TEXT AS $$
DECLARE
    _dow_string TEXT;
BEGIN
    CASE _dow
        WHEN 0 THEN _dow_string := 'Sunday';
        WHEN 1 THEN _dow_string := 'Monday';
        WHEN 2 THEN _dow_string := 'Tuesday';
        WHEN 3 THEN _dow_string := 'Wednesday';
        WHEN 4 THEN _dow_string := 'Thursday';
        WHEN 5 THEN _dow_string := 'Friday';
        WHEN 6 THEN _dow_string := 'Saturday';        
    END CASE;

    RETURN _dow_string;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION accum_dow(state DOUBLE PRECISION[], _date DATE)
	RETURNS DOUBLE PRECISION[] as $$
DECLARE	
	degrees DOUBLE PRECISION;
BEGIN	
	degrees = dow_to_degrees(_date);
	state[1] := state[1]+sind(degrees);
	state[2] := state[2]+cosd(degrees);
	RETURN state;
END;
$$ LANGUAGE plpgsql STRICT;


CREATE OR REPLACE FUNCTION final_func_peak_dow(state DOUBLE PRECISION[])
	RETURNS TEXT as $$
DECLARE 
	degrees DOUBLE PRECISION;
	_dow INT;
	_dow_string TEXT;
BEGIN
	/* 
	- Handle singularity when all the days are equally spaced.
	*/
	IF @state[1] + @state[2] < 1e-10 THEN
    	RETURN NULL;  	
  	END IF;
	degrees = atan2d(state[1],state[2]);
	/* 
	- Range of atan2d is (-180,180]
	- 360° should be added to degrees to make it positive
	*/
	IF degrees<0 THEN
   		degrees := degrees+(360::DOUBLE PRECISION);
	END IF;
	_dow = degrees_to_dow(degrees);
	_dow_string = dow_to_string(_dow);
	RETURN _dow_string;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE AGGREGATE peak_day_of_week (DATE)
(
    sfunc = accum_dow,
    stype = DOUBLE PRECISION[],
    finalfunc = final_func_peak_dow,
    initcond = '{0,0}'
);