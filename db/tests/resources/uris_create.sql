CREATE TABLE "uris" (
    id integer NOT NULL,
    "uri" character varying(250)
);

CREATE SEQUENCE "uris_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "uris_id_seq" OWNED BY "uris".id;

ALTER TABLE ONLY "uris" ALTER COLUMN id SET DEFAULT nextval('"uris_id_seq"'::regclass);

INSERT INTO "uris" VALUES
(1, 'http://soundcloud.com/denzo-1/denzo-in-mix-0knackpunkt-nr-15-0-electro-swing'),
(2, 'http://picasaweb.google.com/lh/photo/94RGMDCSTmCW04l6SPnteTBPFtERcSvqpRI6vP3N6YI?feat=embedwebsite'),
(3, 'http://banedon.posterous.com/bauforstschritt-2262010'),
(4, 'http://imgur.com/M2v2H.png'),
(5, 'http://tweetphoto.com/31300678'),
(6, 'http://www.youtube.com/watch?v=zXLGHyGxY2E'),
(7, 'http://tweetphoto.com/31103212'),
(8, 'http://soundcloud.com/dj-soro'),
(9, 'http://i.imgur.com/H6yyu.jpg'),
(10, 'http://www.flickr.com/photos/jocke66/4657443374/'),
(11, 'http://tweetphoto.com/31332311'),
(12, 'http://tweetphoto.com/31421017'),
(13, 'http://yfrog.com/j6cimg3038gj'),
(14, 'https://yfrog.com/msradon2p'),
(15, 'http://soundcloud.com/hedo/hedo-der-groove-junger-knospen'),
(16, 'http://soundcloud.com/strawberryhaze/this-is-my-house-in-summer-2010'),
(17, 'http://tumblr.com/x4acyiuxf'),
(18, 'ftp://foobar.com/179179'),
(19, 'ftps://asldp.com/158915'),
(20, 'ftps://asldp.com/158915'),
(21, 'ftp://abcdefg.com/x-y-z'),
(22, 'ftp://abcdefg.com/x-y-z');

SELECT pg_catalog.setval('"uris_id_seq"', 1000, true);

ALTER TABLE ONLY "uris"
    ADD CONSTRAINT "uris_pkey" PRIMARY KEY (id);
