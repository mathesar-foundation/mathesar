CREATE TABLE "Hardware Store"."Assets" (
    id integer NOT NULL,
    name text NOT NULL,
    serial_number text NOT NULL,
    rental_price mathesar_types.mathesar_money,
    sale_price mathesar_types.mathesar_money,
    rental_period text,
    location text,
    store_id integer NOT NULL
);


ALTER TABLE "Hardware Store"."Assets" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Hardware Store"."Assets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Hardware Store"."Customers" (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email mathesar_types.email,
    phone text,
    address text
);


ALTER TABLE "Hardware Store"."Customers" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Hardware Store"."Customers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Hardware Store"."Rentals" (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    rental_start timestamp without time zone,
    rental_end timestamp without time zone,
    time_out timestamp without time zone,
    time_in timestamp without time zone,
    rental_time interval
);


ALTER TABLE "Hardware Store"."Rentals" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Hardware Store"."Rentals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Hardware Store"."Store Locations" (
    id integer NOT NULL,
    name text NOT NULL,
    address text
);


ALTER TABLE "Hardware Store"."Store Locations" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Hardware Store"."Store Locations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE "Hardware Store"."Transactions" (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    customer_id integer NOT NULL,
    transaction_type text,
    transaction_date timestamp without time zone NOT NULL,
    total_charge mathesar_types.mathesar_money,
    note text,
    CONSTRAINT "Transactions_transaction_type_check" CHECK ((transaction_type = ANY (ARRAY['Sale'::text, 'Rental'::text, 'Return'::text])))
);


ALTER TABLE "Hardware Store"."Transactions" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "Hardware Store"."Transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


INSERT INTO "Hardware Store"."Assets" VALUES (1, 'Cordless Sm Leaf Blower', '0574437137986', 31.34, NULL, 'monthly', 'Aisle 18 - Shelf 3', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (2, 'Lightweight Ergonomic Xl Drill', '6488355187432', 17.86, NULL, 'weekly', 'Aisle 7 - Shelf 9', 1);
INSERT INTO "Hardware Store"."Assets" VALUES (3, 'Heavy-Duty Leaf Blower', '2663332158740', 53.26, NULL, 'monthly', 'Aisle 2 - Shelf 5', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (4, '10Pc Adjustable Oversized Socket Set', '1059198945593', 71.26, 52.76, 'monthly', 'Aisle 17 - Shelf 2', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (5, 'Deluxe Xl Wheelbarrow', '1317106696587', 18.72, NULL, 'daily', 'Aisle 10 - Shelf 9', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (6, 'Industrial Collapsible Oversized Drill', '8963774291192', 44.87, NULL, 'monthly', 'Aisle 14 - Shelf 3', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (7, 'Industrial Collapsible Air Compressor', '7560418869840', 15.03, NULL, 'monthly', 'Aisle 3 - Shelf 4', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (8, 'Industrial Compact Hand Axe', '1217013427888', 59.52, NULL, 'weekly', 'Aisle 1 - Shelf 6', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (9, 'Sm Leaf Blower', '6130913686481', 12.56, NULL, 'monthly', 'Aisle 9 - Shelf 6', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (10, 'Professional Cordless Power Saw', '6416306814335', 57.82, NULL, 'monthly', 'Aisle 7 - Shelf 10', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (11, 'Compact Pliers Set', '4777970730638', 80.93, NULL, 'monthly', 'Aisle 6 - Shelf 10', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (12, 'Lightweight Sm Workbench', '8153516242807', 34.69, NULL, 'monthly', 'Aisle 10 - Shelf 4', 1);
INSERT INTO "Hardware Store"."Assets" VALUES (13, 'Basic Oversized Chainsaw', '2918456724631', 59.68, NULL, 'daily', 'Aisle 3 - Shelf 9', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (14, 'Professional Oversized Drill', '7260544423892', 9.53, 5.0, 'monthly', 'Aisle 14 - Shelf 5', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (15, 'Workbench', '7172419939233', 12.36, NULL, 'weekly', 'Aisle 4 - Shelf 5', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (16, 'Industrial 5Pc Oversized Wrench Set', '8565854998207', 44.74, NULL, 'monthly', 'Aisle 17 - Shelf 7', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (17, '10Pc Ergonomic Portable Screwdriver Set', '2941284297916', 16.55, 10.27, 'weekly', 'Aisle 15 - Shelf 6', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (18, 'Lightweight Heavy-Duty Xl Lawn Mower', '5995520241918', 92.19, 65.69, 'daily', 'Aisle 1 - Shelf 5', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (19, '5Pc Cordless Oversized Socket Set', '2460274532054', 17.18, NULL, 'weekly', 'Aisle 10 - Shelf 3', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (20, 'Industrial Cordless Lawn Mower', '3146538540308', 82.13, NULL, 'monthly', 'Aisle 15 - Shelf 10', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (21, 'Basic Collapsible Sm Chainsaw', '3582832945898', 30.91, NULL, 'weekly', 'Aisle 2 - Shelf 10', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (22, 'Adjustable Power Saw', '8850535651930', 87.84, 65.62, 'monthly', 'Aisle 13 - Shelf 5', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (23, 'Deluxe Adjustable Oversized Workbench', '9227790843063', 91.04, NULL, 'monthly', 'Aisle 8 - Shelf 1', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (24, '20Pc Sm Pliers Set', '4307793540154', 34.12, NULL, 'weekly', 'Aisle 10 - Shelf 8', 1);
INSERT INTO "Hardware Store"."Assets" VALUES (25, 'Basic Cordless Portable Air Compressor', '7129179035668', 72.9, NULL, 'weekly', 'Aisle 7 - Shelf 10', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (26, 'Heavy-Duty Xl Leaf Blower', '0919413045174', 55.96, NULL, 'monthly', 'Aisle 7 - Shelf 10', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (27, 'Industrial Chainsaw', '0517149954441', 8.25, NULL, 'weekly', 'Aisle 15 - Shelf 2', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (28, 'Deluxe Hand Axe', '9291143638118', 88.23, NULL, 'monthly', 'Aisle 1 - Shelf 5', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (29, '10Pc Pliers Set', '6050005970017', 36.41, NULL, 'weekly', 'Aisle 12 - Shelf 9', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (30, 'Socket Set', '6903549366955', 55.35, NULL, 'weekly', 'Aisle 3 - Shelf 3', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (31, 'Industrial Sm Hand Axe', '8709844754552', 73.38, NULL, 'weekly', 'Aisle 12 - Shelf 5', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (32, 'Xl Socket Set', '7223302823778', 75.44, 40.27, 'monthly', 'Aisle 14 - Shelf 2', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (33, 'Adjustable Industrial Hammer', '8447912337305', 73.32, NULL, 'weekly', 'Aisle 8 - Shelf 4', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (34, 'Cordless Professional Hammer', '1025389301721', 16.21, 10.64, 'monthly', 'Aisle 7 - Shelf 6', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (35, 'Professional Ergonomic Power Saw', '5449975865316', 43.97, NULL, 'weekly', 'Aisle 8 - Shelf 7', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (36, 'Portable Leaf Blower', '7904884317946', 64.91, NULL, 'monthly', 'Aisle 11 - Shelf 3', 1);
INSERT INTO "Hardware Store"."Assets" VALUES (37, '20Pc Heavy-Duty Sm Screwdriver Set', '9953725511294', 73.74, 48.2, 'monthly', 'Aisle 8 - Shelf 2', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (38, 'Sm Screwdriver Set', '2549934771405', 74.81, 59.76, 'monthly', 'Aisle 4 - Shelf 7', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (39, 'Professional Hammer', '2000904792320', 62.4, NULL, 'monthly', 'Aisle 11 - Shelf 1', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (40, 'Screwdriver Set', '4061449507921', 42.97, NULL, 'monthly', 'Aisle 2 - Shelf 8', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (41, 'Heavy-Duty Leaf Blower', '5113291161376', 74.27, 48.15, 'weekly', 'Aisle 11 - Shelf 8', 5);
INSERT INTO "Hardware Store"."Assets" VALUES (42, 'Basic Adjustable Compact Lawn Mower', '6686523447108', 76.4, NULL, 'weekly', 'Aisle 15 - Shelf 1', 3);
INSERT INTO "Hardware Store"."Assets" VALUES (43, '10Pc Screwdriver Set', '4785884903321', 82.8, NULL, 'daily', 'Aisle 5 - Shelf 7', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (44, 'Professional Collapsible Compact Air Compressor', '4037593164037', 76.56, 43.75, 'weekly', 'Aisle 18 - Shelf 3', 1);
INSERT INTO "Hardware Store"."Assets" VALUES (45, '5Pc Ergonomic Screwdriver Set', '6810216720814', 25.92, 17.52, 'weekly', 'Aisle 13 - Shelf 7', 2);
INSERT INTO "Hardware Store"."Assets" VALUES (46, 'Collapsible Chainsaw', '6225496600051', 69.57, NULL, 'weekly', 'Aisle 8 - Shelf 4', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (47, 'Professional Oversized Wrench Set', '3136269884192', 27.04, 15.85, 'daily', 'Aisle 13 - Shelf 4', 1);
INSERT INTO "Hardware Store"."Assets" VALUES (48, 'Deluxe Wrench Set', '8854452317191', 48.77, NULL, 'monthly', 'Aisle 6 - Shelf 9', 1);
INSERT INTO "Hardware Store"."Assets" VALUES (49, 'Collapsible Portable Leaf Blower', '6342074974271', 63.71, NULL, 'monthly', 'Aisle 16 - Shelf 9', 4);
INSERT INTO "Hardware Store"."Assets" VALUES (50, 'Basic Adjustable Compact Workbench', '4960648616000', 73.89, NULL, 'monthly', 'Aisle 10 - Shelf 5', 5);


INSERT INTO "Hardware Store"."Customers" VALUES (1, 'Thomas', 'Jackson', 'jgonzalez@example.org', '362-837-5867x2899', '609 White Viaduct South Cynthiaborough, MD 83104');
INSERT INTO "Hardware Store"."Customers" VALUES (2, 'Jennifer', 'Johnson', 'randyherman@example.net', '728-444-8558', '06541 Jonathan Cape Sullivanburgh, MD 63946');
INSERT INTO "Hardware Store"."Customers" VALUES (3, 'Ashley', 'Love', 'mark13@example.com', '901.428.0252x586', '648 Thomas Haven Suite 578 East Kenneth, MA 39887');
INSERT INTO "Hardware Store"."Customers" VALUES (4, 'Whitney', 'Smith', 'woodsregina@example.com', '+1-695-532-4668x89672', '0102 Brock Mission Donnastad, VA 97687');
INSERT INTO "Hardware Store"."Customers" VALUES (5, 'Jeremiah', 'Martin', 'suarezryan@example.net', '+1-217-943-7072', '7510 Hernandez Center Suite 573 Barnesberg, UT 89733');
INSERT INTO "Hardware Store"."Customers" VALUES (6, 'Kayla', 'Johnson', 'alexis63@example.net', '7519843054', '092 Stanley Throughway Tinafort, TX 99119');
INSERT INTO "Hardware Store"."Customers" VALUES (7, 'Joy', 'May', 'anita14@example.com', '(927)920-0205', '891 Laura Islands East Ariel, NV 94940');
INSERT INTO "Hardware Store"."Customers" VALUES (8, 'Jennifer', 'Acosta', 'joshua33@example.net', '001-214-901-0253', '522 Li Rue West Colinchester, GA 42286');
INSERT INTO "Hardware Store"."Customers" VALUES (9, 'Katrina', 'Lee', 'chelsea00@example.com', '(360)257-2698x51410', '4981 Robert Circle Apt. 498 Knightport, MD 20332');
INSERT INTO "Hardware Store"."Customers" VALUES (10, 'William', 'Mendez', 'johnjones@example.net', '235-779-7223', '78543 Crosby Walk Deborahland, FL 63430');
INSERT INTO "Hardware Store"."Customers" VALUES (11, 'James', 'Ryan', 'natasha70@example.com', '389.685.3529', '93495 James Mount Annaside, CA 82169');
INSERT INTO "Hardware Store"."Customers" VALUES (12, 'Gloria', 'Li', 'ihernandez@example.org', '336.927.6257', '36963 Wu Heights Port Anabury, TX 44715');
INSERT INTO "Hardware Store"."Customers" VALUES (13, 'Kim', 'Beltran', 'marshaaron@example.com', '529-681-7888x38684', '7475 Logan Crest Apt. 371 Monicachester, FL 67857');
INSERT INTO "Hardware Store"."Customers" VALUES (14, 'Cassandra', 'Burns', 'margaretweiss@example.com', '(470)918-6426', '1277 Burton Track Thompsonborough, NY 59472');
INSERT INTO "Hardware Store"."Customers" VALUES (15, 'Andrea', 'Solomon', 'katiemack@example.com', '+1-810-775-7845x530', '625 Becky Skyway Suite 833 Stacyview, PW 12442');
INSERT INTO "Hardware Store"."Customers" VALUES (16, 'James', 'Jones', 'wayne73@example.net', '001-745-443-1959', '772 Davis Branch West Kellyfurt, NV 36159');
INSERT INTO "Hardware Store"."Customers" VALUES (17, 'Lisa', 'Dixon', 'christina78@example.org', '3799989111', '384 Taylor Glens Apt. 082 Mooreport, RI 83558');
INSERT INTO "Hardware Store"."Customers" VALUES (18, 'Matthew', 'Adams', 'collinsamy@example.com', '231-387-3903x91236', '8840 Ryan Manors Apt. 036 New Jeremyview, MP 35584');
INSERT INTO "Hardware Store"."Customers" VALUES (19, 'Nicole', 'Price', 'halljimmy@example.net', '001-519-235-3715x80381', '2202 Christine Stravenue Pettyborough, AS 95530');
INSERT INTO "Hardware Store"."Customers" VALUES (20, 'Lori', 'Marsh', 'perezjonathan@example.net', '(675)596-2593x8823', '766 Hanson Junction Apt. 926 Juanborough, ME 30242');


INSERT INTO "Hardware Store"."Rentals" VALUES (1, 1, '2025-01-14 04:26:26.328177', '2025-01-15 22:58:33.557403', '2025-01-14 04:26:26.328177', '2025-01-15 22:58:33.557403', '1 day 18:32:07.229226');
INSERT INTO "Hardware Store"."Rentals" VALUES (2, 7, '2025-01-11 14:56:41.332181', '2025-01-16 09:30:04.717844', '2025-01-11 14:56:41.332181', '2025-01-16 09:30:04.717844', '4 days 18:33:23.385663');
INSERT INTO "Hardware Store"."Rentals" VALUES (3, 42, '2025-01-11 09:20:58.716115', '2025-01-15 19:13:41.348131', '2025-01-11 09:20:58.716115', '2025-01-15 19:13:41.348131', '4 days 09:52:42.632016');
INSERT INTO "Hardware Store"."Rentals" VALUES (4, 25, '2025-01-11 00:40:10.462173', '2025-01-11 10:49:54.928587', '2025-01-11 00:40:10.462173', '2025-01-11 10:49:54.928587', '10:09:44.466414');
INSERT INTO "Hardware Store"."Rentals" VALUES (5, 57, '2025-01-08 05:21:36.066744', '2025-01-15 16:22:16.706849', '2025-01-08 05:21:36.066744', '2025-01-15 16:22:16.706849', '7 days 11:00:40.640105');
INSERT INTO "Hardware Store"."Rentals" VALUES (6, 44, '2025-01-09 12:08:15.365088', '2025-01-11 11:13:53.172388', '2025-01-09 12:08:15.365088', '2025-01-11 11:13:53.172388', '1 day 23:05:37.8073');
INSERT INTO "Hardware Store"."Rentals" VALUES (7, 33, '2025-01-14 17:19:55.122743', '2025-01-16 02:04:22.282941', '2025-01-14 17:19:55.122743', '2025-01-16 02:04:22.282941', '1 day 08:44:27.160198');
INSERT INTO "Hardware Store"."Rentals" VALUES (8, 12, '2025-01-15 16:37:02.143343', '2025-01-16 03:42:55.016759', '2025-01-15 16:37:02.143343', '2025-01-16 03:42:55.016759', '11:05:52.873416');
INSERT INTO "Hardware Store"."Rentals" VALUES (9, 33, '2025-01-07 04:10:04.30405', '2025-01-14 06:17:22.136856', '2025-01-07 04:10:04.30405', '2025-01-14 06:17:22.136856', '7 days 02:07:17.832806');
INSERT INTO "Hardware Store"."Rentals" VALUES (10, 20, '2025-01-15 14:09:47.385854', '2025-01-15 18:44:30.03826', '2025-01-15 14:09:47.385854', '2025-01-15 18:44:30.03826', '04:34:42.652406');
INSERT INTO "Hardware Store"."Rentals" VALUES (11, 51, '2025-01-01 00:59:52.59656', '2025-01-13 06:43:48.551291', '2025-01-01 00:59:52.59656', '2025-01-13 06:43:48.551291', '12 days 05:43:55.954731');
INSERT INTO "Hardware Store"."Rentals" VALUES (12, 28, '2025-01-02 06:47:28.206004', '2025-01-14 19:53:03.403793', '2025-01-02 06:47:28.206004', '2025-01-14 19:53:03.403793', '12 days 13:05:35.197789');
INSERT INTO "Hardware Store"."Rentals" VALUES (13, 35, '2025-01-08 22:14:02.275092', '2025-01-11 13:22:11.275146', '2025-01-08 22:14:02.275092', '2025-01-11 13:22:11.275146', '2 days 15:08:09.000054');
INSERT INTO "Hardware Store"."Rentals" VALUES (14, 17, '2025-01-07 21:36:32.756117', '2025-01-12 04:19:45.223709', '2025-01-07 21:36:32.756117', '2025-01-12 04:19:45.223709', '4 days 06:43:12.467592');
INSERT INTO "Hardware Store"."Rentals" VALUES (15, 53, '2025-01-10 00:34:32.546673', '2025-01-13 22:10:33.702885', '2025-01-10 00:34:32.546673', '2025-01-13 22:10:33.702885', '3 days 21:36:01.156212');
INSERT INTO "Hardware Store"."Rentals" VALUES (16, 41, '2025-01-03 14:01:49.125384', '2025-01-08 15:07:54.39755', '2025-01-03 14:01:49.125384', '2025-01-08 15:07:54.39755', '5 days 01:06:05.272166');
INSERT INTO "Hardware Store"."Rentals" VALUES (17, 41, '2025-01-06 19:04:06.435975', '2025-01-09 02:27:22.195577', '2025-01-06 19:04:06.435975', '2025-01-09 02:27:22.195577', '2 days 07:23:15.759602');
INSERT INTO "Hardware Store"."Rentals" VALUES (18, 29, '2025-01-08 07:24:11.936044', '2025-01-12 18:36:12.78049', '2025-01-08 07:24:11.936044', '2025-01-12 18:36:12.78049', '4 days 11:12:00.844446');
INSERT INTO "Hardware Store"."Rentals" VALUES (19, 2, '2025-01-04 10:46:35.348547', '2025-01-11 11:52:22.688845', '2025-01-04 10:46:35.348547', '2025-01-11 11:52:22.688845', '7 days 01:05:47.340298');
INSERT INTO "Hardware Store"."Rentals" VALUES (20, 10, '2025-01-15 09:40:05.11226', '2025-01-15 22:14:33.721039', '2025-01-15 09:40:05.11226', '2025-01-15 22:14:33.721039', '12:34:28.608779');
INSERT INTO "Hardware Store"."Rentals" VALUES (21, 15, '2025-01-14 19:00:10.133783', '2025-01-14 21:37:13.933264', '2025-01-14 19:00:10.133783', '2025-01-14 21:37:13.933264', '02:37:03.799481');
INSERT INTO "Hardware Store"."Rentals" VALUES (22, 42, '2025-01-06 16:55:11.12182', '2025-01-14 09:21:06.182009', '2025-01-06 16:55:11.12182', '2025-01-14 09:21:06.182009', '7 days 16:25:55.060189');
INSERT INTO "Hardware Store"."Rentals" VALUES (23, 7, '2025-01-04 20:04:51.794343', '2025-01-08 00:52:56.852043', '2025-01-04 20:04:51.794343', '2025-01-08 00:52:56.852043', '3 days 04:48:05.0577');
INSERT INTO "Hardware Store"."Rentals" VALUES (24, 12, '2025-01-16 05:58:10.433179', '2025-01-16 13:41:28.318825', '2025-01-16 05:58:10.433179', '2025-01-16 13:41:28.318825', '07:43:17.885646');
INSERT INTO "Hardware Store"."Rentals" VALUES (25, 28, '2025-01-03 11:42:20.829689', '2025-01-04 11:42:49.848795', '2025-01-03 11:42:20.829689', '2025-01-04 11:42:49.848795', '1 day 00:00:29.019106');
INSERT INTO "Hardware Store"."Rentals" VALUES (26, 54, '2025-01-14 23:16:57.35903', '2025-01-15 01:39:05.735848', '2025-01-14 23:16:57.35903', '2025-01-15 01:39:05.735848', '02:22:08.376818');
INSERT INTO "Hardware Store"."Rentals" VALUES (27, 18, '2025-01-13 07:47:10.263691', '2025-01-14 02:44:11.996043', '2025-01-13 07:47:10.263691', '2025-01-14 02:44:11.996043', '18:57:01.732352');
INSERT INTO "Hardware Store"."Rentals" VALUES (28, 19, '2025-01-10 01:51:29.314503', '2025-01-16 00:29:42.51351', '2025-01-10 01:51:29.314503', '2025-01-16 00:29:42.51351', '5 days 22:38:13.199007');
INSERT INTO "Hardware Store"."Rentals" VALUES (29, 49, '2025-01-16 06:51:14.826388', '2025-01-16 07:34:47.029669', '2025-01-16 06:51:14.826388', '2025-01-16 07:34:47.029669', '00:43:32.203281');
INSERT INTO "Hardware Store"."Rentals" VALUES (30, 50, '2025-01-10 05:25:10.205822', '2025-01-15 03:01:21.308648', '2025-01-10 05:25:10.205822', '2025-01-15 03:01:21.308648', '4 days 21:36:11.102826');


INSERT INTO "Hardware Store"."Store Locations" VALUES (1, 'Hurley-Solis', '536 Harris Lodge Suite 008 North Thomaston, NH 71798');
INSERT INTO "Hardware Store"."Store Locations" VALUES (2, 'Thompson, Patel and Fernandez', '89803 Huerta Fields Apt. 469 Marytown, NV 46853');
INSERT INTO "Hardware Store"."Store Locations" VALUES (3, 'Kramer Group', '92494 Adam Prairie Suite 859 North Lisaport, MT 75809');
INSERT INTO "Hardware Store"."Store Locations" VALUES (4, 'Garcia, Colon and Greene', '489 Gill Run Suite 432 Campbellside, AR 57973');
INSERT INTO "Hardware Store"."Store Locations" VALUES (5, 'Black, Evans and Larson', '679 Bradley Vista Darlenemouth, ID 66594');


--
-- Data for Name: Transactions; Type: TABLE DATA; Schema: Hardware Store; Owner: -
--

INSERT INTO "Hardware Store"."Transactions" VALUES (1, 44, 6, 'Return', '2025-01-14 01:12:15.71713', 372.56, 'Hour voice physical child skin idea.');
INSERT INTO "Hardware Store"."Transactions" VALUES (2, 11, 15, 'Sale', '2025-01-10 16:36:17.374514', 481.98, 'Machine group decide throughout exist weight.');
INSERT INTO "Hardware Store"."Transactions" VALUES (3, 10, 2, 'Rental', '2025-01-05 14:03:26.880986', 61.41, 'Our house none author.');
INSERT INTO "Hardware Store"."Transactions" VALUES (4, 23, 17, 'Sale', '2025-01-02 20:53:55.237754', 255.96, 'Shake arrive way reach difficult interesting.');
INSERT INTO "Hardware Store"."Transactions" VALUES (5, 34, 19, 'Return', '2025-01-09 14:50:12.946386', 361.52, 'Per couple east PM.');
INSERT INTO "Hardware Store"."Transactions" VALUES (6, 19, 17, 'Return', '2025-01-05 19:59:45.238171', 496.21, 'Forward eight political unit color.');
INSERT INTO "Hardware Store"."Transactions" VALUES (7, 2, 19, 'Return', '2025-01-03 07:41:02.759297', 466.65, 'Actually court camera my.');
INSERT INTO "Hardware Store"."Transactions" VALUES (8, 27, 18, 'Return', '2025-01-05 11:16:01.558993', 192.4, 'Book stock possible and city since only.');
INSERT INTO "Hardware Store"."Transactions" VALUES (9, 29, 4, 'Return', '2025-01-12 12:58:30.17451', 284.69, 'Simply wish grow these better fly individual court.');
INSERT INTO "Hardware Store"."Transactions" VALUES (10, 36, 8, 'Sale', '2025-01-12 06:34:26.184055', 145.83, 'Action send teach section prevent.');
INSERT INTO "Hardware Store"."Transactions" VALUES (11, 38, 9, 'Sale', '2025-01-06 09:04:29.809872', 297.73, 'Decision reason light international.');
INSERT INTO "Hardware Store"."Transactions" VALUES (12, 14, 12, 'Return', '2025-01-05 16:55:11.441694', 418.45, 'Hour deep over teacher how.');
INSERT INTO "Hardware Store"."Transactions" VALUES (13, 3, 13, 'Sale', '2025-01-15 15:09:08.714173', 415.33, 'Pattern pick unit bad budget picture subject.');
INSERT INTO "Hardware Store"."Transactions" VALUES (14, 36, 12, 'Sale', '2025-01-15 17:46:17.720273', 34.54, 'Even foot culture simple lay.');
INSERT INTO "Hardware Store"."Transactions" VALUES (15, 2, 20, 'Rental', '2025-01-07 19:01:11.503356', 107.09, 'American environmental challenge both actually small network.');
INSERT INTO "Hardware Store"."Transactions" VALUES (16, 39, 20, 'Rental', '2025-01-07 15:19:43.028895', 353.71, 'Deal response blood recognize wife.');
INSERT INTO "Hardware Store"."Transactions" VALUES (17, 16, 19, 'Return', '2025-01-13 12:30:20.008234', 248.42, 'Address animal quite resource artist street.');
INSERT INTO "Hardware Store"."Transactions" VALUES (18, 15, 16, 'Return', '2025-01-10 11:58:24.509332', 204.97, 'Network middle game.');
INSERT INTO "Hardware Store"."Transactions" VALUES (19, 34, 16, 'Rental', '2025-01-05 05:33:20.805026', 104.96, 'Live late long will.');
INSERT INTO "Hardware Store"."Transactions" VALUES (20, 30, 11, 'Return', '2025-01-08 20:57:14.361743', 49.3, 'Discover avoid focus throughout.');
INSERT INTO "Hardware Store"."Transactions" VALUES (21, 36, 3, 'Rental', '2025-01-04 21:05:46.269181', 391.02, 'Right five heavy per which month list author.');
INSERT INTO "Hardware Store"."Transactions" VALUES (22, 12, 6, 'Rental', '2025-01-07 21:03:25.304081', 235.41, 'Reduce base order despite.');
INSERT INTO "Hardware Store"."Transactions" VALUES (23, 18, 17, 'Return', '2025-01-02 04:31:17.728158', 463.37, 'Few lawyer artist miss.');
INSERT INTO "Hardware Store"."Transactions" VALUES (24, 36, 13, 'Return', '2025-01-12 05:42:42.700571', 94.84, 'Drive floor hard majority.');
INSERT INTO "Hardware Store"."Transactions" VALUES (25, 7, 15, 'Sale', '2025-01-08 19:20:13.03261', 86.63, 'Minute marriage message.');
INSERT INTO "Hardware Store"."Transactions" VALUES (26, 38, 8, 'Return', '2025-01-11 02:02:47.264664', 489.45, 'During important black term.');
INSERT INTO "Hardware Store"."Transactions" VALUES (27, 27, 8, 'Return', '2025-01-03 20:59:37.959371', 207.93, 'Poor actually career protect better.');
INSERT INTO "Hardware Store"."Transactions" VALUES (28, 29, 13, 'Rental', '2025-01-16 01:13:51.361029', 497.01, 'Laugh ok free center.');
INSERT INTO "Hardware Store"."Transactions" VALUES (29, 33, 10, 'Return', '2025-01-16 12:51:15.013598', 228.4, 'Smile choose statement area.');
INSERT INTO "Hardware Store"."Transactions" VALUES (30, 25, 10, 'Rental', '2025-01-01 19:53:13.532603', 160.27, 'Recent while game deep visit nor.');
INSERT INTO "Hardware Store"."Transactions" VALUES (31, 2, 7, 'Rental', '2025-01-10 15:16:00.754944', 14.21, 'Good memory lot fast project.');
INSERT INTO "Hardware Store"."Transactions" VALUES (32, 36, 3, 'Return', '2025-01-12 07:17:53.33167', 395.63, 'Baby go film major approach bed determine.');
INSERT INTO "Hardware Store"."Transactions" VALUES (33, 41, 13, 'Sale', '2025-01-12 04:48:31.866474', 344.47, 'Good investment seem remember baby.');
INSERT INTO "Hardware Store"."Transactions" VALUES (34, 5, 13, 'Rental', '2025-01-13 15:54:05.788319', 403.56, 'Determine to force degree paper technology.');
INSERT INTO "Hardware Store"."Transactions" VALUES (35, 26, 11, 'Rental', '2025-01-09 06:33:14.537233', 182.81, 'Should action few anyone believe not.');
INSERT INTO "Hardware Store"."Transactions" VALUES (36, 36, 20, 'Rental', '2025-01-16 01:34:35.357456', 465.57, 'Manage minute red continue consider image air.');
INSERT INTO "Hardware Store"."Transactions" VALUES (37, 48, 4, 'Rental', '2025-01-12 22:37:28.43251', 127.22, 'Purpose few box.');
INSERT INTO "Hardware Store"."Transactions" VALUES (38, 2, 18, 'Rental', '2025-01-09 17:57:35.583112', 128.78, 'Force along health message popular great.');
INSERT INTO "Hardware Store"."Transactions" VALUES (39, 40, 8, 'Sale', '2025-01-12 18:12:45.966812', 218.51, 'Whose much see notice certainly.');
INSERT INTO "Hardware Store"."Transactions" VALUES (40, 39, 18, 'Return', '2025-01-05 02:48:30.732469', 139.36, 'Imagine deep design claim institution.');
INSERT INTO "Hardware Store"."Transactions" VALUES (41, 28, 19, 'Sale', '2025-01-03 07:31:01.414544', 193.07, 'Yourself five address arm character.');
INSERT INTO "Hardware Store"."Transactions" VALUES (42, 15, 16, 'Return', '2025-01-06 08:54:28.655614', 313.55, 'Side sure likely interview north follow unit.');
INSERT INTO "Hardware Store"."Transactions" VALUES (43, 5, 20, 'Sale', '2025-01-01 19:06:02.820357', 69.45, 'Marriage work here form particular.');
INSERT INTO "Hardware Store"."Transactions" VALUES (44, 15, 10, 'Sale', '2025-01-09 08:57:47.577757', 299.72, 'Per news party themselves magazine.');
INSERT INTO "Hardware Store"."Transactions" VALUES (45, 30, 8, 'Sale', '2025-01-14 22:28:57.191851', 154.51, 'Charge performance somebody much religious these war.');
INSERT INTO "Hardware Store"."Transactions" VALUES (46, 40, 13, 'Return', '2025-01-04 02:08:05.297604', 63.93, 'How paper here serious wrong media safe let.');
INSERT INTO "Hardware Store"."Transactions" VALUES (47, 11, 11, 'Sale', '2025-01-01 11:27:05.672644', 94.34, 'Blood throughout huge authority cover one edge.');
INSERT INTO "Hardware Store"."Transactions" VALUES (48, 10, 4, 'Return', '2025-01-12 10:23:06.752172', 12.07, 'Themselves near image truth knowledge let draw.');
INSERT INTO "Hardware Store"."Transactions" VALUES (49, 13, 16, 'Sale', '2025-01-09 04:08:23.584846', 296.43, 'Beyond vote drug north kitchen knowledge create.');
INSERT INTO "Hardware Store"."Transactions" VALUES (50, 16, 9, 'Rental', '2025-01-03 14:40:26.249933', 63.62, 'Gun war by.');
INSERT INTO "Hardware Store"."Transactions" VALUES (51, 2, 6, 'Sale', '2025-01-08 10:01:02.917752', 378.66, 'Reduce strong medical national organization.');
INSERT INTO "Hardware Store"."Transactions" VALUES (52, 31, 3, 'Return', '2025-01-15 11:36:43.645435', 346.99, 'Full reason four sometimes option kind.');
INSERT INTO "Hardware Store"."Transactions" VALUES (53, 29, 11, 'Rental', '2025-01-10 02:16:43.360853', 371.81, 'Firm trip here once response gun future.');
INSERT INTO "Hardware Store"."Transactions" VALUES (54, 4, 2, 'Return', '2025-01-14 14:25:19.33676', 205.94, 'Impact without name process easy hand science head.');
INSERT INTO "Hardware Store"."Transactions" VALUES (55, 1, 17, 'Rental', '2025-01-09 17:18:50.76331', 426.62, 'Ok up treat rock window generation speech.');
INSERT INTO "Hardware Store"."Transactions" VALUES (56, 23, 5, 'Rental', '2025-01-15 21:26:55.649941', 119.73, 'Maybe war together school.');
INSERT INTO "Hardware Store"."Transactions" VALUES (57, 25, 16, 'Rental', '2025-01-11 12:42:07.58472', 356.6, 'Follow public would else bag himself value.');
INSERT INTO "Hardware Store"."Transactions" VALUES (58, 34, 7, 'Sale', '2025-01-06 10:26:49.227023', 408.63, 'Three miss leader.');
INSERT INTO "Hardware Store"."Transactions" VALUES (59, 2, 12, 'Return', '2025-01-11 12:27:05.764802', 485.43, 'Board even community onto help him.');
INSERT INTO "Hardware Store"."Transactions" VALUES (60, 8, 17, 'Sale', '2025-01-11 00:08:08.258023', 175.51, 'Cold current moment level road.');


-- reset sequences
SELECT pg_catalog.setval('"Hardware Store"."Assets_id_seq"', 50, true);
SELECT pg_catalog.setval('"Hardware Store"."Customers_id_seq"', 20, true);
SELECT pg_catalog.setval('"Hardware Store"."Rentals_id_seq"', 30, true);
SELECT pg_catalog.setval('"Hardware Store"."Store Locations_id_seq"', 5, true);
SELECT pg_catalog.setval('"Hardware Store"."Transactions_id_seq"', 60, );


ALTER TABLE ONLY "Hardware Store"."Assets"
    ADD CONSTRAINT "Assets_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Hardware Store"."Assets"
    ADD CONSTRAINT "Assets_serial_number_key" UNIQUE (serial_number);


ALTER TABLE ONLY "Hardware Store"."Customers"
    ADD CONSTRAINT "Customers_email_key" UNIQUE (email);


ALTER TABLE ONLY "Hardware Store"."Customers"
    ADD CONSTRAINT "Customers_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Hardware Store"."Rentals"
    ADD CONSTRAINT "Rentals_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Hardware Store"."Store Locations"
    ADD CONSTRAINT "Store Locations_pkey" PRIMARY KEY (id);


ALTER TABLE ONLY "Hardware Store"."Transactions"
    ADD CONSTRAINT "Transactions_pkey" PRIMARY KEY (id);


CREATE INDEX idx_assets_store_id ON "Hardware Store"."Assets" USING btree (store_id);


CREATE INDEX idx_rentals_transaction_id ON "Hardware Store"."Rentals" USING btree (transaction_id);


CREATE INDEX idx_transactions_asset_id ON "Hardware Store"."Transactions" USING btree (asset_id);


CREATE INDEX idx_transactions_customer_id ON "Hardware Store"."Transactions" USING btree (customer_id);


ALTER TABLE ONLY "Hardware Store"."Assets"
    ADD CONSTRAINT "Assets_store_id_fkey" FOREIGN KEY (store_id) REFERENCES "Hardware Store"."Store Locations"(id) ON DELETE SET NULL;


ALTER TABLE ONLY "Hardware Store"."Rentals"
    ADD CONSTRAINT "Rentals_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES "Hardware Store"."Transactions"(id) ON DELETE CASCADE;


ALTER TABLE ONLY "Hardware Store"."Transactions"
    ADD CONSTRAINT "Transactions_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES "Hardware Store"."Assets"(id) ON DELETE CASCADE;


ALTER TABLE ONLY "Hardware Store"."Transactions"
    ADD CONSTRAINT "Transactions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES "Hardware Store"."Customers"(id) ON DELETE SET NULL;
