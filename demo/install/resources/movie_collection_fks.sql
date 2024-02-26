SELECT pg_catalog.setval('"Departments_id_seq"', 12, true);
SELECT pg_catalog.setval('"Genres_id_seq"', 10770, true);
SELECT pg_catalog.setval('"Jobs_id_seq"', 419, true);
SELECT pg_catalog.setval('"Movie Cast Map_id_seq"', 159012, true);
SELECT pg_catalog.setval('"Movie Crew Map_id_seq"', 130711, true);
SELECT pg_catalog.setval('"Movie Genre Map_id_seq"', 25886, true);
SELECT pg_catalog.setval('"Movie Production Company Map_id_seq"', 19959, true);
SELECT pg_catalog.setval('"Movie Production Country Map_id_seq"', 14087, true);
SELECT pg_catalog.setval('"Movie Spoken Language Map_id_seq"', 14951, true);
SELECT pg_catalog.setval('"Movies_id_seq"', 469172, true);
SELECT pg_catalog.setval('"People_id_seq"', 1908262, true);
SELECT pg_catalog.setval('"Production Companies_id_seq"', 95940, true);
SELECT pg_catalog.setval('"Production Countries_id_seq"', 122, true);
SELECT pg_catalog.setval('"Spoken Languages_id_seq"', 107, true);
SELECT pg_catalog.setval('"Sub-Collections_id_seq"', 479971, true);

ALTER TABLE ONLY "Departments"
    ADD CONSTRAINT "Departments_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Genres"
    ADD CONSTRAINT "Genres_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Jobs"
    ADD CONSTRAINT "Jobs_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Movie Cast Map"
    ADD CONSTRAINT "Movie Cast Map_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Movie Crew Map"
    ADD CONSTRAINT "Movie Crew Map_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Movie Genre Map"
    ADD CONSTRAINT "Movie Genre Map_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Movie Production Company Map"
    ADD CONSTRAINT "Movie Production Company Map_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Movie Production Country Map"
    ADD CONSTRAINT "Movie Production Country Map_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Movie Spoken Language Map"
    ADD CONSTRAINT "Movie Spoken Language Map_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Movies"
    ADD CONSTRAINT "Movies_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "People"
    ADD CONSTRAINT "People_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Production Companies"
    ADD CONSTRAINT "Production Companies_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Production Countries"
    ADD CONSTRAINT "Production Countries_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Spoken Languages"
    ADD CONSTRAINT "Spoken Languages_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Sub-Collections"
    ADD CONSTRAINT "Sub-Collections_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Movie Cast Map"
    ADD CONSTRAINT "Movie Cast Map_Cast Member_fkey" FOREIGN KEY ("Cast Member") REFERENCES "People"(id);

ALTER TABLE ONLY "Movie Cast Map"
    ADD CONSTRAINT "Movie Cast Map_Movie_fkey" FOREIGN KEY ("Movie") REFERENCES "Movies"(id);

ALTER TABLE ONLY "Movie Crew Map"
    ADD CONSTRAINT "Movie Crew Map_Crew Member_fkey" FOREIGN KEY ("Crew Member") REFERENCES "People"(id);

ALTER TABLE ONLY "Movie Crew Map"
    ADD CONSTRAINT "Movie Crew Map_Department_fkey" FOREIGN KEY ("Department") REFERENCES "Departments"(id);

ALTER TABLE ONLY "Movie Crew Map"
    ADD CONSTRAINT "Movie Crew Map_Job_fkey" FOREIGN KEY ("Job") REFERENCES "Jobs"(id);

ALTER TABLE ONLY "Movie Crew Map"
    ADD CONSTRAINT "Movie Crew Map_Movie_fkey" FOREIGN KEY ("Movie") REFERENCES "Movies"(id);

ALTER TABLE ONLY "Movie Genre Map"
    ADD CONSTRAINT "Movie Genre Map_Genre_fkey" FOREIGN KEY ("Genre") REFERENCES "Genres"(id);

ALTER TABLE ONLY "Movie Genre Map"
    ADD CONSTRAINT "Movie Genre Map_Movie_fkey" FOREIGN KEY ("Movie") REFERENCES "Movies"(id);

ALTER TABLE ONLY "Movie Production Company Map"
    ADD CONSTRAINT "Movie Production Company Map_Movie_fkey" FOREIGN KEY ("Movie") REFERENCES "Movies"(id);

ALTER TABLE ONLY "Movie Production Company Map"
    ADD CONSTRAINT "Movie Production Company Map_Production Company_fkey" FOREIGN KEY ("Production Company") REFERENCES "Production Companies"(id);

ALTER TABLE ONLY "Movie Production Country Map"
    ADD CONSTRAINT "Movie Production Country Map_Movie_fkey" FOREIGN KEY ("Movie") REFERENCES "Movies"(id);

ALTER TABLE ONLY "Movie Production Country Map"
    ADD CONSTRAINT "Movie Production Country Map_Production Country_fkey" FOREIGN KEY ("Production Country") REFERENCES "Production Countries"(id);

ALTER TABLE ONLY "Movie Spoken Language Map"
    ADD CONSTRAINT "Movie Spoken Language Map_Movie_fkey" FOREIGN KEY ("Movie") REFERENCES "Movies"(id);

ALTER TABLE ONLY "Movie Spoken Language Map"
    ADD CONSTRAINT "Movie Spoken Language Map_Spoken Language_fkey" FOREIGN KEY ("Spoken Language") REFERENCES "Spoken Languages"(id);

ALTER TABLE ONLY "Movies"
    ADD CONSTRAINT "Movies_Sub-Collection_fkey" FOREIGN KEY ("Sub-Collection") REFERENCES "Sub-Collections"(id);