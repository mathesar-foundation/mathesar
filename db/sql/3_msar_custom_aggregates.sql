CREATE OR REPLACE FUNCTION time_to_degrees(_time TIME)
	returns DOUBLE PRECISION AS $$
DECLARE
	seconds INT;
	degrees DOUBLE PRECISION;
BEGIN
	seconds := EXTRACT(SECOND FROM _time);
	seconds := seconds + 60*EXTRACT(MINUTE FROM _time);
	seconds := seconds + 3600*EXTRACT(HOUR FROM _time);	
	degrees := ((seconds*360)::DOUBLE PRECISION)/86400;	
	return degrees;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION degrees_to_time(degrees DOUBLE PRECISION)
	returns TIME AS $$
DECLARE
	hours INT;
	minutes INT;
	seconds INT;
	_time TIME;
BEGIN		
	seconds := (degrees*86400)/360;	
	minutes := seconds/60;
	seconds := seconds%60;
	hours := minutes/60;
	minutes := minutes%60;
	_time = make_time(hours,minutes,seconds);
	RETURN _time;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION accum_time(state DOUBLE PRECISION[], _time TIME)
	RETURNS DOUBLE PRECISION[] as $$
DECLARE	
	degrees DOUBLE PRECISION;
BEGIN
	degrees = time_to_degrees(_time);
	state[1] := state[1]+sind(degrees);
	state[2] := state[2]+cosd(degrees);
	RETURN state;
END;
$$ LANGUAGE plpgsql STRICT;


CREATE OR REPLACE FUNCTION final_func_peak_time(state DOUBLE PRECISION[])
	RETURNS TIME as $$
DECLARE 
	degrees DOUBLE PRECISION;
	_time TIME;
BEGIN
	/* 
	- Handle singularity when all the times are equally spaced.
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
	_time = degrees_to_time(degrees);
	RETURN _time;
END;
$$ LANGUAGE plpgsql;


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