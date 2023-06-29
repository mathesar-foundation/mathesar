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


CREATE OR REPLACE FUNCTION final_func(state DOUBLE PRECISION[])
	RETURNS TIME as $$
DECLARE 
	degrees DOUBLE PRECISION;
	_time TIME;
BEGIN
	/* 
	- Handle singularity when all the times equally spaced.
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
    finalfunc = final_func,
    initcond = '{0,0}'
);
