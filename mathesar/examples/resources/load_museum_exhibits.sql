CREATE TABLE "Acquisition Types" (
    id integer NOT NULL,
    type_name text NOT NULL,
    description text
);


ALTER TABLE "Acquisition Types" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Acquisition Types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Collections" (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE "Collections" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Collections_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Exhibits" (
    id integer NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    location_id integer NOT NULL,
    featured boolean DEFAULT false,
    description text
);


ALTER TABLE "Exhibits" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Exhibits_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Item_Collections" (
    id integer NOT NULL,
    item_id integer NOT NULL,
    collection_id integer NOT NULL
);


ALTER TABLE "Item_Collections" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Item_Collections_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Items" (
    id integer NOT NULL,
    name text NOT NULL,
    serial_number text NOT NULL,
    acquisition_date date NOT NULL,
    acquisition_type_id integer NOT NULL,
    exhibit_id integer
);


ALTER TABLE "Items" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Locations" (
    id integer NOT NULL,
    name text NOT NULL,
    address text
);


ALTER TABLE "Locations" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


INSERT INTO "Acquisition Types" VALUES
  (1, 'Donation', 'Upon candidate center baby.'),
  (2, 'Purchase', 'Individual feel the particular.'),
  (3, 'Bequest', 'Great lawyer main heavy pick.'),
  (4, 'Loan', 'Task father attorney.'),
  (5, 'Exchange', 'Take check teacher talk again.');


INSERT INTO "Collections" VALUES
  (1, '20Th Century Cubist Collection', 'Raise real yet Mrs. Decision thus shake least.'),
  (2, 'Renaissance Baroque Collection', 'Several travel determine decade son.'),
  (3, '20Th Century Impressionist Collection', 'Yet national nice.'),
  (4, '20Th Century Abstract Collection', 'Get continue television. From result late likely.'),
  (5, 'Renaissance Baroque Collection', 'College least apply put direction poor hospital.'),
  (6, '19Th Century Modernist Collection', 'Country myself bit start anyone. Bed head edge.'),
  (7, '20Th Century Cubist Collection', 'Wife administration leg garden glass Congress.'),
  (8, 'Ancient Cubist Collection', 'Fall hundred candidate peace sea record pattern.'),
  (9, '19Th Century Impressionist Collection', 'Unit single interesting than.'),
  (10, 'Renaissance Baroque Collection', 'Green phone fish reality.');


INSERT INTO "Exhibits" VALUES
  (1, 'The Evolution Of Butterfly Sketches', '2025-01-11', '2025-05-15', 3, false, 'Everything majority less. South crime open start.'),
  (2, 'Perspectives On The Home Manuscript', '2025-01-11', '2025-03-08', 5, false, 'Save for prepare group human some wind. Claim future base she.'),
  (3, 'The Evolution Of The Home Sculpture', '2025-01-12', NULL, 1, false, 'Professor from certain enter sound he suggest.'),
  (4, 'Liminal Retreat In Urban Landscapes Sculpture', '2025-01-04', '2025-07-04', 2, true, 'Color project world three public.'),
  (5, 'Reclaiming The Landscape Sculpture', '2025-01-10', NULL, 3, true, 'Approach including modern success whole. Unit market least yard life inside agreement.'),
  (6, 'Silence: Exploring Landscape Portrait Series', '2025-01-02', '2025-03-08', 1, true, 'Understand remain perhaps people hit since. Simple dog sister somebody.'),
  (7, 'Silence: Exploring Butterfly Vase', '2025-01-04', '2025-07-09', 3, true, 'From another talk quality nor minute option. East officer sort rock significant bank network.'),
  (8, 'Decontextualizing Isolation Sketches', '2025-01-15', '2025-05-22', 1, false, 'Able soon necessary upon color chair run. Which concern believe necessary.'),
  (9, 'Perspectives On The Home Artifact', '2025-01-02', '2025-05-02', 5, false, 'His bank human never newspaper discussion. Use itself wish.'),
  (10, 'Silence: Exploring The Home Pot', '2025-01-06', '2025-07-09', 4, false, 'Avoid meet ball study.'),
  (11, 'Perspectives On Bird Sculpture', '2025-01-15', '2025-07-06', 2, true, 'Open strong go.'),
  (12, 'Reclaiming The Urban Landscapes Portrait Series', '2025-01-09', '2025-04-19', 5, false, 'Though save cover indeed case hear write. Approach get a audience forward his wonder.'),
  (13, 'Perspectives On Urban Landscapes Vase', '2025-01-01', '2025-03-12', 3, false, 'Heart cause outside argue sort her sing. However board employee.'),
  (14, 'Reclaiming The Butterfly Portrait Series', '2025-01-02', '2025-05-05', 1, true, 'Information treat story food relationship rule. Ball recognize cold investment mind.'),
  (15, 'Perspectives On Butterfly Sculpture', '2025-01-01', NULL, 4, true, 'Of mean choice staff you. Cost price course series your. Expert size allow create.');


INSERT INTO "Item_Collections" VALUES
  (1, 1, 6),
  (2, 1, 4),
  (3, 1, 3),
  (4, 2, 10),
  (5, 2, 6),
  (6, 3, 4),
  (7, 4, 5),
  (8, 5, 9),
  (9, 5, 10),
  (10, 5, 5),
  (11, 6, 9),
  (12, 6, 1),
  (13, 6, 3),
  (14, 7, 6),
  (15, 7, 8),
  (16, 7, 2),
  (17, 8, 6),
  (18, 9, 1),
  (19, 10, 7),
  (20, 10, 2),
  (21, 11, 2),
  (22, 11, 7),
  (23, 11, 10),
  (24, 12, 1),
  (25, 12, 5),
  (26, 13, 5),
  (27, 13, 4),
  (28, 14, 1),
  (29, 14, 7),
  (30, 15, 1),
  (31, 15, 4),
  (32, 16, 4),
  (33, 16, 6),
  (34, 16, 7),
  (35, 17, 6),
  (36, 17, 4),
  (37, 17, 8),
  (38, 18, 5),
  (39, 19, 5),
  (40, 20, 2),
  (41, 20, 10),
  (42, 20, 7),
  (43, 21, 9),
  (44, 22, 10),
  (45, 23, 1),
  (46, 23, 9),
  (47, 24, 7),
  (48, 25, 10),
  (49, 25, 2),
  (50, 25, 6),
  (51, 26, 4),
  (52, 27, 9),
  (53, 28, 9),
  (54, 29, 8),
  (55, 29, 3),
  (56, 29, 1),
  (57, 30, 7),
  (58, 31, 2),
  (59, 31, 7),
  (60, 32, 7),
  (61, 32, 1),
  (62, 33, 2),
  (63, 33, 4),
  (64, 34, 7),
  (65, 34, 9),
  (66, 35, 1),
  (67, 35, 3),
  (68, 36, 5),
  (69, 37, 7),
  (70, 38, 3),
  (71, 39, 8),
  (72, 40, 1),
  (73, 41, 2),
  (74, 41, 4),
  (75, 41, 6),
  (76, 42, 8),
  (77, 42, 10),
  (78, 43, 4),
  (79, 43, 6),
  (80, 44, 3),
  (81, 44, 5),
  (82, 44, 6),
  (83, 45, 5),
  (84, 45, 2),
  (85, 45, 3),
  (86, 46, 6),
  (87, 46, 4),
  (88, 47, 2),
  (89, 47, 1),
  (90, 47, 10),
  (91, 48, 7),
  (92, 48, 2),
  (93, 49, 5),
  (94, 50, 4),
  (95, 50, 9),
  (96, 50, 7);


INSERT INTO "Items" VALUES
  (1, 'Bronze vase', '1862193314406', '2025-01-05', 3, NULL),
  (2, 'Landscape weathered baroque portrait series', '9535874743896', '2025-01-05', 3, 6),
  (3, 'Baroque asian bronze vase', '4800379049251', '2025-01-06', 1, NULL),
  (4, 'Philosophical medieval egyptian manuscript', '6379059931400', '2025-01-09', 3, 7),
  (5, 'Baroque asian vase', '9933923670481', '2025-01-08', 5, 5),
  (6, 'Polished asian painting', '0144935136233', '2025-01-06', 3, 2),
  (7, 'Weathered greek modernist portrait series', '7268749722130', '2025-01-09', 5, 7),
  (8, 'Baroque medieval european bowl and plate', '2275542342859', '2025-01-02', 5, NULL),
  (9, 'Isolation weathered modernist butterfly drawing', '5388368939145', '2025-01-11', 2, NULL),
  (10, 'Baroque roman pen bowl and plate', '6414803832043', '2025-01-01', 4, 14),
  (11, 'Impressionist portrait series', '0029966751542', '2025-01-03', 1, NULL),
  (12, 'Philosophical 20th century manuscript', '6586913183244', '2025-01-10', 4, 11),
  (13, 'The home weathered egyptian landscape drawing', '1516486210936', '2025-01-04', 3, NULL),
  (14, 'The home cubist medieval european clay bowl and plate', '3938295034066', '2025-01-13', 4, NULL),
  (15, 'Ancient artifact', '7984733976401', '2025-01-14', 3, NULL),
  (16, 'Rough painting', '9480842383768', '2025-01-13', 2, NULL),
  (17, 'Literary 20th century roman manuscript', '8075779896132', '2025-01-09', 4, 12),
  (18, 'Rough greek impressionist portrait series', '0003882794715', '2025-01-07', 3, 13),
  (19, 'Polished egyptian baroque portrait series', '1933437898119', '2025-01-11', 4, 14),
  (20, 'Landscape roman modernist landscape drawing', '4354869487967', '2025-01-07', 3, 15),
  (21, 'Clay sculpture', '6001343163166', '2025-01-15', 4, 12),
  (22, 'Baroque sculpture', '8196716726333', '2025-01-12', 5, 11),
  (23, 'Landscape medieval european sculpture', '9074954082819', '2025-01-14', 5, NULL),
  (24, 'Rough medieval european cubist portrait series', '4886834291786', '2025-01-05', 5, NULL),
  (25, 'Urban landscapes roman pot', '2692004359925', '2025-01-02', 2, 13),
  (26, 'Landscape charcoal artifact', '2383142547670', '2025-01-01', 4, 12),
  (27, 'Weathered cubist portrait series', '9540678654064', '2025-01-14', 3, 15),
  (28, 'The home egyptian pot', '7154717552949', '2025-01-12', 1, NULL),
  (29, 'The home cubist pot', '2218589397260', '2025-01-13', 3, 3),
  (30, 'Isolation smooth medieval european modernist painting', '3499690477112', '2025-01-14', 1, 12),
  (31, 'Landscape medieval european impressionist painting', '5221016819300', '2025-01-12', 1, NULL),
  (32, 'Abstract roman vase', '9188117485055', '2025-01-15', 2, 5),
  (33, 'Urban landscapes scientific polished asian baroque sketches', '2375255060412', '2025-01-04', 4, NULL),
  (34, 'The home 19th century artifact', '9567257514625', '2025-01-02', 4, 12),
  (35, 'Medieval european painting', '0424561107495', '2025-01-09', 1, 7),
  (36, 'Bird abstract asian charcoal vase', '1020427654432', '2025-01-02', 1, 6),
  (37, 'Bird cubist roman marble bowl and plate', '5633822694994', '2025-01-11', 1, NULL),
  (38, 'Baroque pot', '6399700317773', '2025-01-10', 3, NULL),
  (39, 'Cubist egyptian pot', '1939386479751', '2025-01-01', 3, NULL),
  (40, 'Scientific 19th century asian manuscript', '5012449018725', '2025-01-02', 2, 12),
  (41, 'Egyptian baroque wood sculpture', '3923255267295', '2025-01-05', 2, NULL),
  (42, 'Asian impressionist portrait series', '1364389777274', '2025-01-15', 1, 13),
  (43, 'Ancient greek artifact', '6729603764594', '2025-01-14', 3, NULL),
  (44, 'Religious ancient roman manuscript', '7533693134972', '2025-01-06', 2, NULL),
  (45, 'Bird weathered greek baroque painting', '6604095702333', '2025-01-02', 1, 10),
  (46, 'Bird cubist pot', '1439136675278', '2025-01-02', 3, 2),
  (47, 'Medieval european vase', '8903998365378', '2025-01-14', 5, NULL),
  (48, 'Bird roman bowl and plate', '6659922405512', '2025-01-08', 4, NULL),
  (49, '19th century asian artifact', '1103195281151', '2025-01-09', 1, 7),
  (50, 'Landscape marble artifact', '5726845015164', '2025-01-03', 1, 13);


INSERT INTO "Locations" VALUES
  (1, 'Museum Location 1', '96178 Shaw Station New Charles, SC 93243'),
  (2, 'Museum Location 2', '20618 Krystal Park Suite 943 North Cherylmouth, WI 08589'),
  (3, 'Museum Location 3', '9471 Cheryl Station Suite 488 Ramseyton, OR 12788'),
  (4, 'Museum Location 4', '705 Butler Causeway Suite 166 Port Anthony, MO 73573'),
  (5, 'Museum Location 5', 'PSC 4330, Box 7699 APO AA 73204');


SELECT pg_catalog.setval('"Acquisition Types_id_seq"', 5, true);
SELECT pg_catalog.setval('"Collections_id_seq"', 10, true);
SELECT pg_catalog.setval('"Exhibits_id_seq"', 15, true);
SELECT pg_catalog.setval('"Item_Collections_id_seq"', 96, true);
SELECT pg_catalog.setval('"Items_id_seq"', 50, true);
SELECT pg_catalog.setval('"Locations_id_seq"', 5, true);


ALTER TABLE ONLY "Acquisition Types"
    ADD CONSTRAINT "Acquisition Types_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Acquisition Types"
    ADD CONSTRAINT "Acquisition Types_type_name_key" UNIQUE (type_name);


ALTER TABLE ONLY "Collections"
    ADD CONSTRAINT "Collections_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Exhibits"
    ADD CONSTRAINT "Exhibits_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Item_Collections"
    ADD CONSTRAINT "Item_Collections_item_id_collection_id_key" UNIQUE (item_id, collection_id);


ALTER TABLE ONLY "Item_Collections"
    ADD CONSTRAINT "Item_Collections_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Items"
    ADD CONSTRAINT "Items_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Items"
    ADD CONSTRAINT "Items_serial_number_key" UNIQUE (serial_number);


ALTER TABLE ONLY "Locations"
    ADD CONSTRAINT "Locations_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Exhibits"
    ADD CONSTRAINT "Exhibits_location_id_fkey" FOREIGN KEY (location_id) REFERENCES "Locations"(id);


ALTER TABLE ONLY "Item_Collections"
    ADD CONSTRAINT "Item_Collections_collection_id_fkey" FOREIGN KEY (collection_id) REFERENCES "Collections"(id) ON DELETE CASCADE;


ALTER TABLE ONLY "Item_Collections"
    ADD CONSTRAINT "Item_Collections_item_id_fkey" FOREIGN KEY (item_id) REFERENCES "Items"(id) ON DELETE CASCADE;


ALTER TABLE ONLY "Items"
    ADD CONSTRAINT "Items_acquisition_type_id_fkey" FOREIGN KEY (acquisition_type_id) REFERENCES "Acquisition Types"(id);


ALTER TABLE ONLY "Items"
    ADD CONSTRAINT "Items_exhibit_id_fkey" FOREIGN KEY (exhibit_id) REFERENCES "Exhibits"(id);
