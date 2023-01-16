--
-- Name: Days; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Days" (
    id integer NOT NULL,
    "Name" text,
    "Date" date
);


ALTER TABLE "Days" OWNER TO mathesar;

--
-- Name: Organizations; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Organizations" (
    id integer NOT NULL,
    "Organization" text
);


ALTER TABLE "Organizations" OWNER TO mathesar;

--
-- Name: Positions; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Positions" (
    id integer NOT NULL,
    "Position" text
);


ALTER TABLE "Positions" OWNER TO mathesar;

--
-- Name: Positions_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Positions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Positions_id_seq" OWNER TO mathesar;

--
-- Name: Positions_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Positions_id_seq" OWNED BY "Positions".id;


--
-- Name: Presenters; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Presenters" (
    id integer NOT NULL,
    "First Name" text,
    "Last Name" text,
    "Email" mathesar_types.email NOT NULL,
    "Bio" text,
    "Position" integer,
    "Organization" integer
);


ALTER TABLE "Presenters" OWNER TO mathesar;

--
-- Name: Rooms; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Rooms" (
    id integer NOT NULL,
    "Name" text NOT NULL,
    "Capacity" numeric
);


ALTER TABLE "Rooms" OWNER TO mathesar;

--
-- Name: Table 115_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Table 115_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Table 115_id_seq" OWNER TO mathesar;

--
-- Name: Table 115_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Table 115_id_seq" OWNED BY "Presenters".id;


--
-- Name: Table 117_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Table 117_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Table 117_id_seq" OWNER TO mathesar;

--
-- Name: Table 117_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Table 117_id_seq" OWNED BY "Rooms".id;


--
-- Name: Topics; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Topics" (
    id integer NOT NULL,
    "Name" text
);


ALTER TABLE "Topics" OWNER TO mathesar;

--
-- Name: Table 118_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Table 118_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Table 118_id_seq" OWNER TO mathesar;

--
-- Name: Table 118_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Table 118_id_seq" OWNED BY "Topics".id;


--
-- Name: Table 119_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Table 119_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Table 119_id_seq" OWNER TO mathesar;

--
-- Name: Table 119_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Table 119_id_seq" OWNED BY "Days".id;


--
-- Name: Talks; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Talks" (
    id integer NOT NULL,
    "Title" text,
    "Day" integer,
    "Room" integer,
    "Presenter" integer,
    "Abstract" text,
    "Time Slot" integer,
    "Track" integer
);


ALTER TABLE "Talks" OWNER TO mathesar;

--
-- Name: Table 120_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Table 120_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Table 120_id_seq" OWNER TO mathesar;

--
-- Name: Table 120_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Table 120_id_seq" OWNED BY "Talks".id;


--
-- Name: Table 67_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Table 67_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Table 67_id_seq" OWNER TO mathesar;

--
-- Name: Table 67_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Table 67_id_seq" OWNED BY "Organizations".id;


--
-- Name: Talk Topic Map; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Talk Topic Map" (
    id integer NOT NULL,
    "Talk" integer,
    "Topic" integer
);


ALTER TABLE "Talk Topic Map" OWNER TO mathesar;

--
-- Name: Talk Topic Map_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Talk Topic Map_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Talk Topic Map_id_seq" OWNER TO mathesar;

--
-- Name: Talk Topic Map_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Talk Topic Map_id_seq" OWNED BY "Talk Topic Map".id;


--
-- Name: Time Slots; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Time Slots" (
    id integer NOT NULL,
    "Slot" text NOT NULL
);


ALTER TABLE "Time Slots" OWNER TO mathesar;

--
-- Name: Time Slots_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Time Slots_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Time Slots_id_seq" OWNER TO mathesar;

--
-- Name: Time Slots_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Time Slots_id_seq" OWNED BY "Time Slots".id;


--
-- Name: Tracks; Type: TABLE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE TABLE "Tracks" (
    id integer NOT NULL,
    "Name" text
);


ALTER TABLE "Tracks" OWNER TO mathesar;

--
-- Name: Tracks_id_seq; Type: SEQUENCE; Schema: Mathesar DevCon; Owner: mathesar
--

CREATE SEQUENCE "Tracks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Tracks_id_seq" OWNER TO mathesar;

--
-- Name: Tracks_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER SEQUENCE "Tracks_id_seq" OWNED BY "Tracks".id;


--
-- Name: Days id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Days" ALTER COLUMN id SET DEFAULT nextval('"Table 119_id_seq"'::regclass);


--
-- Name: Organizations id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Organizations" ALTER COLUMN id SET DEFAULT nextval('"Table 67_id_seq"'::regclass);


--
-- Name: Positions id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Positions" ALTER COLUMN id SET DEFAULT nextval('"Positions_id_seq"'::regclass);


--
-- Name: Presenters id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Presenters" ALTER COLUMN id SET DEFAULT nextval('"Table 115_id_seq"'::regclass);


--
-- Name: Rooms id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Rooms" ALTER COLUMN id SET DEFAULT nextval('"Table 117_id_seq"'::regclass);


--
-- Name: Talk Topic Map id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talk Topic Map" ALTER COLUMN id SET DEFAULT nextval('"Talk Topic Map_id_seq"'::regclass);


--
-- Name: Talks id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talks" ALTER COLUMN id SET DEFAULT nextval('"Table 120_id_seq"'::regclass);


--
-- Name: Time Slots id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Time Slots" ALTER COLUMN id SET DEFAULT nextval('"Time Slots_id_seq"'::regclass);


--
-- Name: Topics id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Topics" ALTER COLUMN id SET DEFAULT nextval('"Table 118_id_seq"'::regclass);


--
-- Name: Tracks id; Type: DEFAULT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Tracks" ALTER COLUMN id SET DEFAULT nextval('"Tracks_id_seq"'::regclass);


--
-- Data for Name: Days; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Days" (id, "Name", "Date") FROM stdin;
1	Friday	2023-01-20
2	Saturday	2023-01-21
3	Sunday	2023-01-22
\.


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Organizations" (id, "Organization") FROM stdin;
1	Center of Complex Interventions(CCI)
\.


--
-- Data for Name: Positions; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Positions" (id, "Position") FROM stdin;
1	Director of Technology
2	Engineer
3	Product Designer
\.


--
-- Data for Name: Presenters; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Presenters" (id, "First Name", "Last Name", "Email", "Bio", "Position", "Organization") FROM stdin;
5	Emily	Johnson	emily@centerofci.org	Emily manages technology at CCI. She spends the bulk of her time leading the Mathesar project, an open source product to help users of all skill levels work with data. Most recently, she was Director of Engineering at Creative Commons (CC), where she built open source tools to make CC licenses easier to work with. Prior to that, she focused on leading happy and productive distributed engineering teams at startups, and has enjoyed architecting and building both consumer-facing and enterprise software.	1	1
1	John	Davis	john@centerofci.org	John is a self-described technologist working on Mathesar. He’s passionate about facilitating change through better tools. He’s previously worked on a decentralized cryptocurrency exchange, technical trading software, and scientific programming. Outside working hours he likes running, swimming, and his pet guinea pigs.	2	1
2	Sarah	Smith	sarah@centerofci.org	Sarah is a designer with a focus on experimenting and iterating with different design processes. During her twelve-year career in tech, she has worked on various products at healthcare and enterprise software startups. She enjoys sharing her ideas and experience with people and helping them think creatively. Ghislaine is currently the product designer for the Mathesar project, which aims to help people collaborate, develop, and explore the potential of database technologies to meet the challenges of an increasingly complex world.	3	1
6	Robert	Martinez	robert@centerofci.org	Robert is an engineer passionate about building systems that reduce complex problems into simple and elegant solutions. Previously he has worked on a platform for loyalty programmes, prior to which he was working on a workflow automation platform. He spends his free time at his farm or at the beach.	2	1
3	Michael	Brown	michael@centerofci.org	Michael is a software engineer with a focus on building products that simplify complex usecases. At CCI, he works on Mathesar to help databases and data manipulation become more accessible for users of all skill levels. His past experiences include building SIEM solutions, log management products and E-commerce platforms. Apart from writing code, he likes to sketch, and go on treks.	2	1
4	David	Garcia	david@centerofci.org	David is an automation enthusiast working on Mathesar to help automate some of the tedium out of database administration, and making databases approachable for laypeople. Previously, he was engineering data at Creative Commons, helping to gather data for an image search engine. In a past life, he was a musician working in Kansas City, and later Denver. When he’s not at the computer, he enjoys exploring the outdoors with his dog Erdős.	2	1
7	Joshua	Hernandez	joshua@centerofci.org	Joshua is an engineer passionate about open source software, user experience, data, and interesting problems. He brings a background in tech, non-profits, CRMs, and community organizing to his work on our Mathesar project. In his free time he enjoys mountain biking, and carpentry.	2	1
8	Jacob	Lopez	jacob@centerofci.org	Jacob is a computer engineering student soon graduating in the summer of 2023. His interest lies in writing backend and low-level software code. He’s passionate about open-source software and was hooked on Mathesar’s idea of creating an elegant database tool for non-technical users. He learned about Mathesar during the Google Summer of Code 2022 and has been with CCI since. He likes to read, play video games, and swim in his free time.	2	1
9	James	Rodriguez	james@centerofci.org	James is a software engineer with a major inclination towards the frontend & JavaScript ecosystem. He enjoys simplifying user experiences by building accessible user interfaces. He has previously worked on Voice AI platforms & large scale workflow automation tools. In his free time he enjoys traveling and exploring products that track his body vitals.	2	1
\.


--
-- Data for Name: Rooms; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Rooms" (id, "Name", "Capacity") FROM stdin;
1	Main Hall	120
2	202A	35
3	202B	35
4	202C	35
5	202D	35
\.


--
-- Data for Name: Talk Topic Map; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Talk Topic Map" (id, "Talk", "Topic") FROM stdin;
1	2	2
26	13	7
2	2	1
3	2	9
27	13	6
4	2	3
5	3	5
6	4	6
7	4	7
28	14	8
8	4	5
29	15	7
9	5	1
10	5	9
11	6	7
30	16	7
12	6	6
31	16	9
13	6	9
14	7	7
32	16	1
15	7	3
33	17	1
16	8	5
17	8	4
34	17	7
18	9	3
35	18	1
19	9	1
36	18	3
20	10	2
37	19	4
21	10	9
22	11	4
38	19	5
23	11	5
24	12	4
25	12	5
\.


--
-- Data for Name: Talks; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Talks" (id, "Title", "Day", "Room", "Presenter", "Abstract", "Time Slot", "Track") FROM stdin;
15	The Mathesar Vision, part 2	3	1	5	In this final talk of the last day, we look at how we think Mathesar will evolve over the coming months and years, and hope to inspire you with our direction!	8	1
14	Managing Engineers: a metaphorical approach	2	3	5	When your cats are on a hot tin roof, should you herd them, skin them, or let them out of the bag? The roof is a deadline. The cats are engineers.	8	1
1	The Mathesar Vision	1	1	5	In this introduction and welcome, we discuss the vision of Mathesar, and why you should be excited to attend our exclusive conference.	1	1
3	Optimizing Web Performance: Techniques and Tools	1	1	3	n this talk, you will learn about different techniques and tools that you can use to optimize the performance of your web applications. You will learn about techniques such as code optimization, caching, and load balancing, as well as tools like performance monitoring and profiling.	8	4
2	SQLAlchemy and Dynamic Defaults	1	2	8	SQLAlchemy doesn't support dynamic default values very well. In this talk, we explore options for how to both create and parse dynamic default values for database columns using SQLAlchemy.	7	3
5	Python for databases	1	2	1	In this talk we explore a number of challenges and constraints encountered when using python to interact with a PostgreSQL DB.	8	3
10	PostgreSQL: The best SQL	2	1	4	In this talk we will take a look at the current state of PostgreSQL, and explore its features which made it a natural fit for the Database System backing Mathesar.	8	3
16	Data Engineering and Mathesar	3	1	6	In this talk, we take a look at data tools such as Apache Spark, and how you can integrate their use with the Mathesar UI.	7	3
17	Data Science and Mathesar	3	1	4	In this talk, we will review some basics of data science, including key concepts. You will learn how these concepts can be implemented and used when working with Mathesar.	1	3
4	Exploring Data Visualization: Techniques and Tools	1	1	9	In this talk, you will learn about different techniques and tools that you can use to create effective data visualizations. You will learn about different types of charts and graphs, and how to choose the right visualization for your data. You will also learn about tools like D3.js and Tableau, and how to use them to create interactive and engaging visualizations.	7	4
8	Building Modern Web Applications with Svelte.js	2	1	7	In this talk, you will learn about Svelte.js, a modern JavaScript framework for building web applications. You will learn about the principles and philosophy behind Svelte, and how it differs from other frameworks. You will also learn about the core concepts and features of Svelte, and how to use them to build efficient and reactive applications.	1	4
11	Advanced Svelte.js Techniques: Animations, Server-Side Rendering, and More	2	2	3	In this talk, you will learn about advanced techniques for using Svelte.js, such as animations, server-side rendering, and performance optimization. You will learn about different tools and libraries that you can use to extend the capabilities of Svelte, and how to apply these techniques in real-world projects. You will also learn about some of the trade-offs and considerations when using advanced Svelte techniques.	7	4
12	Integrating Svelte.js with Other Technologies	2	2	9	In this talk, you will learn about how to integrate Svelte.js with other technologies such as APIs, databases, and front-end libraries. You will learn about different techniques and tools for connecting Svelte to external data sources and services, and how to build full-stack applications with Svelte. You will also learn about some of the considerations and challenges when integrating Svelte with other technologies.	8	4
19	Svelte.js Best Practices: Tips and Tricks	3	3	7	In this talk, you will learn about best practices and tips and tricks for using Svelte.js. You will learn about techniques such as code organization, testing, and performance optimization, and how to apply them in your Svelte projects. You will also learn about some of the common pitfalls and mistakes to avoid when using Svelte.	7	4
9	Django and its use in Mathesar	2	1	6	In this talk we will explore Django, how it's used in Mathesar, and the pros/cons of the tool when solving our problems.	7	5
18	Building APIs with Django Rest Framework	3	2	1	n this talk, you will learn about how to use Django Rest Framework (DRF), a powerful Django extension for building APIs. You will learn about the features and architecture of DRF, and how to use it to build RESTful APIs for your Django projects. You will also learn about some of the best practices and tools for testing and documenting your APIs.	7	5
6	No-Code Data Analysis: Tools and Techniques	1	3	2	In this talk, you will learn about different tools and techniques that you can use to perform data analysis without writing any code. You will learn about platforms like Excel, Google Sheets, and Mathesar, and how to use them to manipulate, analyze, and visualize data. You will also learn about some of the benefits and limitations of using no-code data analysis tools, and how to choose the right one for your needs.	7	\N
7	Integrating with No-Code tools	1	3	8	In this talk, you will learn about different no-code tools, and how to integrate with them in the context of a Mathesar project.	8	\N
13	Designing for Data	2	3	2	In this talk we discuss principles, approaches, and some challenges associated with designing a product for data input and analysis.	7	\N
\.


--
-- Data for Name: Time Slots; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Time Slots" (id, "Slot") FROM stdin;
1	08:00-10:00
7	13:00-15:00
8	15:30-17:30
\.


--
-- Data for Name: Topics; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Topics" (id, "Name") FROM stdin;
1	Python
2	SQL
3	Back End
4	Front End
5	Javascript
6	Design
7	Product
8	Management
9	Database
\.


--
-- Data for Name: Tracks; Type: TABLE DATA; Schema: Mathesar DevCon; Owner: mathesar
--

COPY "Tracks" (id, "Name") FROM stdin;
1	Management
3	Databases
4	Front End
5	Web Service
\.


--
-- Name: Positions_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Positions_id_seq"', 4, false);


--
-- Name: Table 115_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Table 115_id_seq"', 9, true);


--
-- Name: Table 117_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Table 117_id_seq"', 5, true);


--
-- Name: Table 118_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Table 118_id_seq"', 9, true);


--
-- Name: Table 119_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Table 119_id_seq"', 3, true);


--
-- Name: Table 120_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Table 120_id_seq"', 19, true);


--
-- Name: Table 67_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Table 67_id_seq"', 1, true);


--
-- Name: Talk Topic Map_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Talk Topic Map_id_seq"', 38, true);


--
-- Name: Time Slots_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Time Slots_id_seq"', 8, true);


--
-- Name: Tracks_id_seq; Type: SEQUENCE SET; Schema: Mathesar DevCon; Owner: mathesar
--

SELECT pg_catalog.setval('"Tracks_id_seq"', 5, true);


--
-- Name: Positions Positions_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Positions"
    ADD CONSTRAINT "Positions_pkey" PRIMARY KEY (id);


--
-- Name: Presenters Presenters_Email_key; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Presenters"
    ADD CONSTRAINT "Presenters_Email_key" UNIQUE ("Email");


--
-- Name: Rooms Rooms_Name_key; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Rooms"
    ADD CONSTRAINT "Rooms_Name_key" UNIQUE ("Name");


--
-- Name: Presenters Table 115_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Presenters"
    ADD CONSTRAINT "Table 115_pkey" PRIMARY KEY (id);


--
-- Name: Rooms Table 117_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Rooms"
    ADD CONSTRAINT "Table 117_pkey" PRIMARY KEY (id);


--
-- Name: Topics Table 118_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Topics"
    ADD CONSTRAINT "Table 118_pkey" PRIMARY KEY (id);


--
-- Name: Days Table 119_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Days"
    ADD CONSTRAINT "Table 119_pkey" PRIMARY KEY (id);


--
-- Name: Talks Table 120_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Table 120_pkey" PRIMARY KEY (id);


--
-- Name: Organizations Table 67_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Table 67_pkey" PRIMARY KEY (id);


--
-- Name: Talk Topic Map Talk Topic Map_Talk_key; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talk Topic Map"
    ADD CONSTRAINT "Talk Topic Map_Talk_key" UNIQUE ("Talk", "Topic");


--
-- Name: Talk Topic Map Talk Topic Map_id_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talk Topic Map"
    ADD CONSTRAINT "Talk Topic Map_id_pkey" PRIMARY KEY (id);


--
-- Name: Time Slots Time Slots_Time_key; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Time Slots"
    ADD CONSTRAINT "Time Slots_Time_key" UNIQUE ("Slot");


--
-- Name: Time Slots Time Slots_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Time Slots"
    ADD CONSTRAINT "Time Slots_pkey" PRIMARY KEY (id);


--
-- Name: Tracks Tracks_pkey; Type: CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Tracks"
    ADD CONSTRAINT "Tracks_pkey" PRIMARY KEY (id);


--
-- Name: Presenters Presenters_Organization_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Presenters"
    ADD CONSTRAINT "Presenters_Organization_fkey" FOREIGN KEY ("Organization") REFERENCES "Organizations"(id);


--
-- Name: Presenters Presenters_mathesar_temp_Position_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Presenters"
    ADD CONSTRAINT "Presenters_mathesar_temp_Position_fkey" FOREIGN KEY ("Position") REFERENCES "Positions"(id);


--
-- Name: Talk Topic Map Talk Topic Map_Talk_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talk Topic Map"
    ADD CONSTRAINT "Talk Topic Map_Talk_fkey" FOREIGN KEY ("Talk") REFERENCES "Talks"(id);


--
-- Name: Talk Topic Map Talk Topic Map_Topic_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talk Topic Map"
    ADD CONSTRAINT "Talk Topic Map_Topic_fkey" FOREIGN KEY ("Topic") REFERENCES "Topics"(id);


--
-- Name: Talks Talks_Day_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_Day_fkey" FOREIGN KEY ("Day") REFERENCES "Days"(id);


--
-- Name: Talks Talks_Presenter_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_Presenter_fkey" FOREIGN KEY ("Presenter") REFERENCES "Presenters"(id);


--
-- Name: Talks Talks_Room_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_Room_fkey" FOREIGN KEY ("Room") REFERENCES "Rooms"(id);


--
-- Name: Talks Talks_Time Slot_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_Time Slot_fkey" FOREIGN KEY ("Time Slot") REFERENCES "Time Slots"(id);


--
-- Name: Talks Talks_mathesar_temp_Track_fkey; Type: FK CONSTRAINT; Schema: Mathesar DevCon; Owner: mathesar
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_mathesar_temp_Track_fkey" FOREIGN KEY ("Track") REFERENCES "Tracks"(id);


--
-- PostgreSQL database dump complete
--

