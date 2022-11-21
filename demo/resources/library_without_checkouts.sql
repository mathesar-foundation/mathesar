-- Authors

CREATE TABLE "Authors" (
    id integer NOT NULL,
    "First Name" text,
    "Last Name" text,
    "Website" mathesar_types.uri
);

CREATE SEQUENCE "Authors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Authors_id_seq" OWNED BY "Authors".id;

ALTER TABLE ONLY "Authors"
  ALTER COLUMN id SET DEFAULT nextval('"Authors_id_seq"'::regclass);


-- Checkouts

CREATE TABLE "Checkouts" (
    id integer NOT NULL,
    "Item" integer,
    "Patron" integer,
    "Checkout Time" timestamp without time zone,
    "Due Date" date,
    "Check In Time" timestamp without time zone
);

CREATE SEQUENCE "Checkouts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Checkouts_id_seq" OWNED BY "Checkouts".id;

ALTER TABLE ONLY "Checkouts"
  ALTER COLUMN id SET DEFAULT nextval('"Checkouts_id_seq"'::regclass);


-- Items

CREATE TABLE "Items" (
    id integer NOT NULL,
    "Publication" integer NOT NULL,
    "Barcode ID" text NOT NULL,
    "Acquisition Date" date,
    "Acquisition Price" mathesar_types.mathesar_money
);

CREATE SEQUENCE "Items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Items_id_seq" OWNED BY "Items".id;

ALTER TABLE ONLY "Items"
  ALTER COLUMN id SET DEFAULT nextval('"Items_id_seq"'::regclass);


-- Patrons

CREATE TABLE "Patrons" (
    id integer NOT NULL,
    "First Name" text,
    "Last Name" text,
    "Email" mathesar_types.email
);

CREATE SEQUENCE "Patrons_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Patrons_id_seq" OWNED BY "Patrons".id;

ALTER TABLE ONLY "Patrons"
  ALTER COLUMN id SET DEFAULT nextval('"Patrons_id_seq"'::regclass);


-- Publications

CREATE TABLE "Publications" (
    id integer NOT NULL,
    "Title" text,
    "Author" integer NOT NULL,
    "Publisher" integer NOT NULL,
    "Year" integer,
    "ISBN" text
);

CREATE SEQUENCE "Publications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Publications_id_seq" OWNED BY "Publications".id;

ALTER TABLE ONLY "Publications"
  ALTER COLUMN id SET DEFAULT nextval('"Publications_id_seq"'::regclass);


-- Publishers

CREATE TABLE "Publishers" (
    id integer NOT NULL,
    "Name" text
);

CREATE SEQUENCE "Publishers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Publishers_id_seq" OWNED BY "Publishers".id;

ALTER TABLE ONLY "Publishers"
  ALTER COLUMN id SET DEFAULT nextval('"Publishers_id_seq"'::regclass);


INSERT INTO "Authors" (id, "First Name", "Last Name", "Website") VALUES
(14, 'Zachary', 'Medina', null),
(6, 'Jennifer', 'Newman', null),
(9, 'Melissa', 'Harris', 'http://harris.info'),
(10, 'Raymond', 'Diaz', 'https://diaz.net'),
(13, 'Vincent', 'Edwards', 'https://edwards.info'),
(1, 'Anthony', 'Herrera', null),
(5, 'Jennifer', 'Castillo', 'https://jennifercastillo.com'),
(3, 'Catherine', 'Edwards', 'https://catherineedwards.com'),
(12, 'Sean', 'Robinson', 'https://seanrobinson.com'),
(4, 'Hannah', 'Jensen', 'http://hannahjensen.org'),
(11, 'Rose', 'Dunlap', 'https://dunlap.com'),
(7, 'Jose', 'Munoz', 'https://munoz.com'),
(8, 'Kimberly', 'Johnson', 'https://kimberlyjohnson.net'),
(2, 'Bonnie', 'Evans', 'https://bonnieevans.com')
;

INSERT INTO "Items" (id, "Acquisition Date", "Acquisition Price", "Publication", "Barcode ID") VALUES
(66, '2004-08-31', 11.05, 9, 'YLYGUJO7Z7GOJ8O'),
(67, '1915-01-29', 14.94, 9, 'P7J0CZ26S7HVXFU'),
(23, '1971-09-09', 1.31, 12, '5O7W4D4U96C4N8E'),
(32, '2012-08-14', 7.77, 13, 'PJI5LZOM7743G1O'),
(31, '1985-01-04', 2.06, 13, 'INC4BQLGTSXO90W'),
(21, '1929-07-29', 8.26, 14, 'ZE50MOEKN2I8DK6'),
(12, '1991-01-23', 2.03, 17, '7CBSL9R3XYE3M8J'),
(11, '2002-01-16', 3.23, 17, 'ANUA95C87QZH0A5'),
(63, '1993-10-24', 9.77, 18, 'Z2YNQV8V3N94QRZ'),
(61, '1929-04-02', 3.62, 18, 'ZYRT2TQ8ER2NQJD'),
(64, '2020-04-28', 5.45, 18, 'CIV611D36LHYZCI'),
(62, '1924-11-17', 10.78, 18, 'JY3EX4OG08DASNQ'),
(65, '1985-06-15', 9.55, 19, '8MXO9825EJKQ7G1'),
(90, '1949-02-17', 4.69, 23, 'SJHWYIEM002JAZR'),
(91, '1991-02-06', 14.48, 23, '1J9ISDVF3T622LM'),
(113, '2021-09-15', 12.53, 24, 'U2P391FO33YAVGA'),
(114, '2010-04-02', 4.52, 24, '9CKFHFM5Q4N76OA'),
(112, '2007-01-09', 2.08, 24, '05S3HBZ595NRNZR'),
(35, '1948-12-26', 7.45, 25, 'FDV7P7L2C6QZ8LV'),
(36, '1962-06-08', 10.39, 25, 'YQ2H3VZLZ2YLS55'),
(24, '2016-03-24', 14.59, 26, 'K3L5CAIT3PMS0NS'),
(25, '2012-04-16', 3.36, 26, '2NY33CED6NWPCAR'),
(46, '1992-01-30', 1.12, 27, '73KJZNN6GIATENW'),
(8, '1976-03-20', 3.18, 28, 'EM5S1VTEIDWT45Z'),
(9, '1996-11-20', 12.24, 28, '05VAS0VFRWUIRHX'),
(7, '1962-12-04', 10.60, 29, 'KUQALLHWJ4G032S'),
(111, '2003-11-09', 6.38, 30, 'HXK9QLDRY0NBIAZ'),
(10, '2014-09-01', 8.47, 31, 'JH1JKMJ6TAYDHAW'),
(42, '2022-04-28', 2.11, 32, 'RAYLD2C3FIG0B8G'),
(43, '2021-11-13', 2.77, 33, 'BOSJ42NQ3YLGOOE'),
(38, '2021-09-09', 10.27, 34, 'WKUN2IVL5C3UFQC'),
(37, '2014-12-27', 9.23, 34, 'Z4OKMZ5M75F3GZ0'),
(41, '2021-12-13', 12.35, 34, '95E7MOJARY7DGUL'),
(40, '2014-05-16', 10.82, 34, 'QG3FH60NREUAXYQ'),
(39, '2013-10-01', 12.78, 34, 'WTBQ6AT3DN1EL5T'),
(48, '2017-06-15', 8.25, 35, 'VHIQGAMUVY8CVMD'),
(51, '2019-02-10', 12.98, 36, '59MMS2CPFIB41SK'),
(50, '2010-10-22', 13.96, 36, 'QGK6N0Q8YDXJU0H'),
(49, '2015-11-28', 12.79, 36, 'Z83Q26IRJQO41BV'),
(84, '2016-10-12', 5.57, 37, 'PUTJZSTHXZMFWX2'),
(86, '2017-10-23', 10.81, 37, '0RN1BGCEKNFJYP5'),
(83, '2011-10-22', 1.88, 37, 'WF8BYSXA0XIPH7Z'),
(85, '1951-01-07', 13.37, 37, 'X1HH9J1QEI9MSW9'),
(22, '1998-09-07', 12.01, 38, 'MJ7OA9T1NDGA4XC'),
(110, '2021-07-26', 3.17, 39, 'QHT52SKPS4751F4'),
(94, '1938-04-02', 10.10, 40, 'PGRHDVS984DGY4T'),
(93, '1990-08-16', 2.73, 40, 'FVE44KCLES5K7L6'),
(34, '1959-11-01', 10.55, 41, 'JEDPE20XBRNLHC7'),
(33, '1977-01-31', 13.57, 41, '4VK3XF21IBLF8PB'),
(55, '1997-01-18', 11.83, 42, 'ZKN3JZ5TDBB3YAQ'),
(57, '2004-02-14', 9.27, 42, 'CMSCI917KVUIDKI'),
(56, '1999-12-29', 8.31, 42, '1DZP1J2ZYJWQ3JD'),
(58, '2015-06-23', 6.63, 43, 'GFLCZGPKHWKFQ92'),
(59, '2020-08-26', 13.27, 43, '63DUGNL71FS8H6N'),
(54, '2004-03-09', 5.14, 44, 'X8TB0PH80WR81O7'),
(79, '2008-10-29', 7.21, 45, '1E9MTETK6PU18HL'),
(18, '1975-08-09', 13.85, 46, 'R4NWFG5HBHGLZ5X'),
(6, '2018-03-25', 10.93, 47, '4WITEMM6MI2XXBK'),
(5, '1978-11-18', 10.99, 47, 'IJCHFMSK8EZ6FYX'),
(27, '2018-02-06', 9.60, 48, 'G64K4YNMUQ65061'),
(29, '2015-05-25', 4.02, 48, 'P1ZXGSRGKFL20SK'),
(30, '2015-02-09', 6.41, 48, 'TQ3AKBGKW1V05J3'),
(26, '2020-12-02', 10.83, 48, 'Z8OOJTYUCX0HV8G'),
(28, '2019-10-17', 14.32, 48, 'VR29K92WUBAQ5LC'),
(99, '2015-06-04', 5.74, 49, 'P70D8WDIXX2CW3V'),
(100, '2010-01-26', 13.08, 49, 'Z6QIUTR7EZWSSHQ'),
(101, '2012-02-23', 6.66, 49, '41NC80V3ATLHPT7'),
(98, '2013-08-14', 13.75, 50, '3SEA0CXCGWIM5MM'),
(97, '2009-08-03', 6.97, 50, 'DCR2HBE9JEHV1DC'),
(15, '2006-12-16', 8.14, 51, 'FYQX8TAW047SI5F'),
(16, '1966-01-22', 12.17, 51, 'ZER8KYIQSZQAXHI'),
(17, '1987-06-14', 0.46, 52, 'ZM93O6PKRUP80Z8'),
(69, '1985-12-14', 7.85, 53, '26O15ZEN4KKMJ3K'),
(70, '2009-05-09', 9.22, 53, 'WH6RCDQBQUTRAAG'),
(82, '1971-12-26', 7.72, 54, '33NW0N7DZPF0ZT6'),
(53, '2000-12-20', 5.29, 21, 'NIYRC2OJHN9TQOB'),
(115, '2021-06-24', 14.18, 55, '9AC2SM0PLWY2S05'),
(13, '1955-01-24', 7.29, 56, 'C44CG13V0H2715O'),
(14, '2004-03-08', 0.18, 56, '9PWAVD9VOWR9AWZ'),
(68, '2015-09-29', 12.39, 57, 'V89UK7OOJZIBE9E'),
(80, '2009-09-18', 6.03, 58, 'EKZLY7R69JAC8EO'),
(60, '2007-10-21', 14.36, 59, 'ZB7QWDNS9M3YPQE'),
(92, '2021-06-08', 3.23, 60, '606O3XNP836Q654'),
(1, '1976-05-20', 7.03, 61, 'BT6HI9EPR6UKFEO'),
(4, '1995-05-11', 12.52, 61, '6DJ2FKJL9OCADQW'),
(3, '1975-07-29', 2.49, 61, 'YAFXBI922XJXI9V'),
(2, '2000-05-26', 9.67, 61, 'P60A7SAUZD1XLS9'),
(116, '2020-11-23', 12.87, 62, 'ZIHRDSGA08D7WN7'),
(117, '2012-01-08', 2.09, 62, '3ILK2I1KSTAHHXO'),
(103, '2000-10-14', 1.69, 63, '19IMWYB48AWKL4C'),
(52, '1934-01-24', 1.03, 64, 'ALDGCXWDMQEODN2'),
(71, '2005-08-28', 13.34, 65, 'WWGG35MZX4FULYX'),
(44, '2022-05-02', 0.59, 1, 'IP8RDEEC8DHB7EP'),
(45, '1961-04-15', 6.09, 2, 'E31NPVCNJ5ROKWK'),
(81, '1994-03-11', 3.89, 3, 'F6BZWAY3YE2FWK4'),
(109, '2011-04-11', 10.75, 5, '3FUI2PWLK1B2PM5'),
(107, '1990-09-16', 11.42, 4, 'RRPTGPB6HN990D2'),
(106, '2014-03-21', 13.55, 4, 'F64UEJWZLRNTWQV'),
(108, '2008-01-30', 12.08, 6, 'EEUYYY2IHHM5XP4'),
(105, '2008-10-29', 13.43, 7, 'ZDTFNTBZV2GNRU3'),
(104, '2010-07-09', 4.66, 7, 'IT1M66UWWAZY47A'),
(102, '1995-02-03', 0.10, 8, 'LUGMUXTN8ABMIIG'),
(19, '1984-11-04', 1.75, 10, 'RN11OKJ9TRTS69O'),
(20, '1978-01-19', 3.88, 10, 'HM84VZTI7NHQPG5'),
(47, '2020-08-22', 4.80, 11, 'TXAIH68AEI7U409'),
(78, '2005-10-22', 3.76, 15, '4IBHQTFG2X9QL0B'),
(77, '2005-01-22', 9.60, 15, '3MUMLFCVML4FNBM'),
(74, '2011-08-30', 13.06, 15, 'ITC85BI7RP58W9P'),
(73, '2018-07-08', 3.09, 15, 'QINFVK4A2UK9JAC'),
(76, '2010-04-21', 3.73, 15, 'L9GTDBQRTNVILWP'),
(75, '2006-10-15', 11.77, 15, 'COIM06VLNBANFDV'),
(72, '2011-03-26', 4.28, 16, '2342QI1SAP5UF2N'),
(95, '2021-02-07', 0.16, 20, 'STNVZXWCLHPPGBE'),
(96, '2021-01-28', 5.28, 20, 'PSWX96VTD8984DM'),
(89, '2007-08-02', 12.06, 22, 'UZ5X6MYOJB54R8M'),
(88, '1967-05-07', 8.91, 22, 'ABTK3M1ENP0637V'),
(87, '2001-07-31', 14.76, 22,  'BWHKFE8NBM5NGBO')
;


INSERT INTO "Patrons" (id, "First Name", "Last Name", "Email") VALUES
(1, 'Barry', 'Huff', 'b.huff@haney.com'),
(2, 'Harry', 'Hall', 'harry.h5@beck.net'),
(3, 'Walter', 'Manning', 'waltermanning@freeman.com'),
(4, 'Lori', 'Stevens', 'l.stevens@lopez.com'),
(5, 'Laura', 'Soto', 'lauras@hurley.com'),
(6, 'Calvin', 'Curtis', 'c.curtis12@brown.com'),
(7, 'Yvonne', 'Ho', 'y.ho@johnson.info'),
(8, 'Toni', 'Evans', 'tevans46@thompson.net'),
(9, 'Connor', 'Taylor', 'c.taylor@miller.org'),
(10, 'Kristen', 'Wright', 'kwright@odonnell.com'),
(11, 'Jennifer', 'Walters', 'jenniferw20@morrison-patton.com'),
(12, 'Benjamin', 'Watson', 'b.watson33@bell-beard.biz'),
(13, 'Kathy', 'Butler', 'kathyb@le.org'),
(14, 'Jason', 'Peterson', 'jpeterson11@williams.com'),
(15, 'Traci', 'Hamilton', 'thamilton76@smith.net'),
(16, 'Jason', 'Griffin', 'jasongriffin@wilkinson.com'),
(17, 'Rita', 'Brown', 'ritab@powell.com'),
(18, 'Deanna', 'Shepherd', 'deanna.s54@cook.org'),
(19, 'Nicole', 'Jones', 'nicole.jones66@dixon.org'),
(20, 'Jesse', 'Fischer', 'jessef88@stewart.com'),
(21, 'Tyler', 'Gonzalez', 't.gonzalez@washington.com'),
(22, 'Mary', 'Knox', 'mknox45@fletcher-rodriguez.net'),
(23, 'Eduardo', 'Rojas', 'eduardorojas13@peterson-curry.com'),
(24, 'Joshua', 'Hooper', 'jhooper@bowers.com'),
(25, 'Autumn', 'Harrington', 'autumn.h19@mathews.com'),
(26, 'Heather', 'Wheeler', 'heatherwheeler@peterson-delgado.com'),
(27, 'Andrew', 'Vaughan', 'a.vaughan@roy.com'),
(28, 'Luke', 'Vang', 'luke.vang46@palmer.com'),
(29, 'Patrick', 'Shepherd', 'pshepherd13@white-bradford.info'),
(30, 'Alexander', 'Phillips', 'alexander.phillips38@alvarez.com')
;


INSERT INTO "Publications" (id, "Title", "ISBN", "Year", "Author",  "Publisher") VALUES
(12, 'Economic Real Return Street', '1-76660-210-X', 1965, 14, 1),
(9, 'Claim Student Use Long Blood', '0-10-580468-1', 1906, 13, 1),
(37, 'Music Since Market Family', '0-693-69318-5', 1933, 1, 1),
(42, 'Real Would Anyone', '0-05-930457-X', 1985, 5, 1),
(63, 'Us Son Threat Girl', '0-358-81989-X', 1959, 7, 1),
(15, 'Full Field Despite Music', '0-638-82929-1', 2005, 9, 1),
(34, 'Mention Add Size City Kid', '1-72019-089-5', 2013, 5, 1),
(26, 'In Play Player', '0-586-20042-8', 2000, 5, 1),
(29, 'Land Character Wear Data', '1-938919-35-1', 1962, 6, 1),
(62, 'Truth Head Bank Lay', '0-7622-9704-2', 2009, 10, 3),
(25, 'Industry Yet Director Future', '1-891871-35-8', 1936, 13, 1),
(13, 'Economic Too Level', '0-237-81994-5', 1952, 5, 1),
(59, 'Top Time Agreement Support', '0-341-80937-3', 1900, 14, 1),
(39, 'On Letter Experience', '0-13-716532-3', 1918, 3, 1),
(35, 'Military Myself Sport Wrong', '1-373-47086-0', 1958, 5, 1),
(49, 'South Nice Service Parent', '0-7626-9346-0', 2010, 11, 1),
(8, 'But Read Best', '0-17-619869-5', 1927, 5, 2),
(55, 'Step Staff Significant Hot', '0-9587449-9-8', 1973, 3, 1),
(17, 'Hair Wish With Plant Record', '1-903291-27-5', 1957, 1, 1),
(58, 'Too Marriage Listen', '0-672-25434-4', 1900, 1, 2),
(61, 'Training Up Wall Everything', '1-367-95276-X', 1949, 5, 1),
(36, 'Military Myself Sport Wrong', '1-4395-1864-5', 2003, 5, 2),
(23, 'Hour Sometimes Lot Number', '1-113-76756-1', 1944, 9, 2),
(20, 'Head Mr Majority Claim Phone', '0-613-92702-8', 2018, 10, 2),
(33, 'Mention Add Size City Kid', '0-438-20690-8', 2019, 5, 3),
(2, 'Agree Beyond Artist Size', '0-489-53721-9', 1931, 4, 1),
(28, 'Land Character Wear Data', '1-76302-814-3', 1975, 6, 1),
(27, 'I Worker Suffer Likely', '1-5243-9118-2', 1900, 13, 1),
(40, 'Pass Street Year', '1-01-127740-9', 1932, 11, 1),
(64, 'Way Trade Sea', '1-80236-999-6', 1933, 9, 3),
(1, 'Agree Beyond Artist Size', '0-262-17066-3', 1928, 4, 1),
(52, 'Space Music Rest Crime', '0-86272-328-0', 1964, 9, 3),
(3, 'Around Process Course', '1-01-810638-3', 1988, 13, 1),
(31, 'Member Student Girl Two', '0-7500-7373-X', 2006, 7, 1),
(43, 'Real Would Anyone', '1-57173-762-6', 2015, 5, 1),
(6, 'Bar Order Might Per', '1-61274-202-5', 1991, 9, 3),
(60, 'Toward Apply Drive', '1-68751-170-5', 2016, 5, 2),
(4, 'Bar Order Might Per', '1-07-390158-0', 1989, 9, 3),
(11, 'Day Beyond Property', '0-05-000136-1', 2007, 5, 3),
(10, 'Cut Probably Member During', '0-327-46240-X', 1972, 12, 2),
(46, 'Run Perhaps Company Think', '0-567-08852-9', 1906, 6, 3),
(5, 'Bar Order Might Per', '1-350-61945-0', 1994, 9, 1),
(32, 'Mention Add Size City Kid', '0-412-00241-8', 2019, 5, 3),
(57, 'Thus Listen Scene Positive', '0-376-64561-X', 1992, 10, 1),
(30, 'Land Possible Else Week', '0-945973-59-4', 1946, 9, 1),
(51, 'Space Music Rest Crime', '0-358-39621-2', 1933, 9, 3),
(47, 'Safe Tree Over Face Officer', '1-253-92768-5', 1908, 8, 1),
(21, 'Him Let After Mrs Coach', '0-942287-33-9', 1994, 1, 2),
(14, 'Edge Throw Tonight Ahead', '1-4956-2122-7', 1917, 13, 1),
(48, 'Similar Expert Per Rock', '1-909102-61-X', 2010, 12, 1),
(54, 'Star Move Song', '1-104-30801-0', 1968, 6, 1),
(38, 'Of Fish While Future Believe', '1-957562-64-1', 1965, 2, 1),
(45, 'Rock Unit Up Explain', '0-88903-678-0', 1975, 6, 2),
(16, 'Full Field Despite Music', '1-352-26248-7', 2003, 9, 1),
(7, 'Bar Order Might Per', '1-951979-00-1', 1919, 9, 1),
(44, 'Real Would Anyone', '1-7326369-4-X', 1954, 5, 1),
(22, 'Hour Sometimes Lot Number', '0-546-24462-9', 1918, 9, 1),
(19, 'Hand Raise Son Probably Do', '1-149-58278-2', 1938, 5, 1),
(24, 'Hundred Former Expect', '0-7058-7216-5', 1997, 14, 1),
(65, 'Wish Gun Specific Rate On', '0-379-53048-1', 1994, 11, 1),
(50, 'South Nice Service Parent', '1-992273-43-X', 2006, 11, 1),
(18, 'Hand Raise Son Probably Do', '0-85808-026-5', 1920, 5, 1),
(56, 'Take Black Issue Physical', '0-454-84942-7', 1925, 4, 1),
(41, 'People Forward Week He', '1-57907-875-3', 1952, 8, 1),
(53, 'Stage Argue Court Film', '0-518-77297-7', 1982, 4, 1)
;


INSERT INTO "Publishers" (id, "Name") VALUES
(3, 'Wright LLC'),
(1, 'Rocha PLC'),
(2, 'Stokes, Campos and Rich')
;


-- Reset sequences

SELECT pg_catalog.setval('"Authors_id_seq"', 14, true);

SELECT pg_catalog.setval('"Publications_id_seq"', 65, true);

SELECT pg_catalog.setval('"Publishers_id_seq"', 3, true);

SELECT pg_catalog.setval('"Checkouts_id_seq"', 1, false);

SELECT pg_catalog.setval('"Items_id_seq"', 117, true);

SELECT pg_catalog.setval('"Patrons_id_seq"', 30, true);


-- Add table constraints

ALTER TABLE ONLY "Authors"
    ADD CONSTRAINT "Authors_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Checkouts"
    ADD CONSTRAINT "Checkouts_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Items"
    ADD CONSTRAINT "Items_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Items"
    ADD CONSTRAINT "Items_Barcode_key" UNIQUE ("Barcode ID");

ALTER TABLE ONLY "Patrons"
    ADD CONSTRAINT "Patrons_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Patrons"
    ADD CONSTRAINT "Patrons_Email_key" UNIQUE ("Email");

ALTER TABLE ONLY "Publications"
    ADD CONSTRAINT "Publications_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Publishers"
    ADD CONSTRAINT "Publishers_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "Checkouts"
    ADD CONSTRAINT "Checkouts_Item id_fkey"
        FOREIGN KEY ("Item") REFERENCES "Items"(id);

ALTER TABLE ONLY "Checkouts"
    ADD CONSTRAINT "Checkouts_Patron id_fkey"
        FOREIGN KEY ("Patron") REFERENCES "Patrons"(id);

ALTER TABLE ONLY "Publications"
    ADD CONSTRAINT "Publications_Authors_id_fkey"
        FOREIGN KEY ("Author") REFERENCES "Authors"(id);

ALTER TABLE ONLY "Publications"
    ADD CONSTRAINT "Publications_Publishers_id_fkey"
      FOREIGN KEY ("Publisher") REFERENCES "Publishers"(id);

ALTER TABLE ONLY "Items"
    ADD CONSTRAINT "Items_Publications_id_fkey"
      FOREIGN KEY ("Publication") REFERENCES "Publications"(id);
