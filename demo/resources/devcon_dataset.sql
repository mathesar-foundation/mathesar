--
-- Name: Days; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Days" (
    id integer NOT NULL,
    "Name" text,
    "Date" date
);


--
-- Name: Job Titles; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Job Titles" (
    id integer NOT NULL,
    "Titles" text
);


--
-- Name: Organizations; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Organizations" (
    id integer NOT NULL,
    "Organization" text
);


--
-- Name: Positions_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Positions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Positions_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Positions_id_seq" OWNED BY "Job Titles".id;


--
-- Name: Rooms; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Rooms" (
    id integer NOT NULL,
    "Name" text NOT NULL,
    "Capacity" numeric
);


--
-- Name: Speakers; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Speakers" (
    id integer NOT NULL,
    "First Name" text,
    "Last Name" text,
    "Email" mathesar_types.email NOT NULL,
    "Bio" text,
    "Job Title" integer,
    "Organization" integer
);


--
-- Name: Table 115_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Table 115_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Table 115_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Table 115_id_seq" OWNED BY "Speakers".id;


--
-- Name: Table 117_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Table 117_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Table 117_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Table 117_id_seq" OWNED BY "Rooms".id;


--
-- Name: Topics; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Topics" (
    id integer NOT NULL,
    "Name" text
);


--
-- Name: Table 118_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Table 118_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Table 118_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Table 118_id_seq" OWNED BY "Topics".id;


--
-- Name: Table 119_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Table 119_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Table 119_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Table 119_id_seq" OWNED BY "Days".id;


--
-- Name: Talks; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Talks" (
    id integer NOT NULL,
    "Title" text,
    "Day" integer,
    "Room" integer,
    "Speaker" integer,
    "Abstract" text,
    "Time Slot" integer,
    "Track" integer
);


--
-- Name: Table 120_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Table 120_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Table 120_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Table 120_id_seq" OWNED BY "Talks".id;


--
-- Name: Table 67_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Table 67_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Table 67_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Table 67_id_seq" OWNED BY "Organizations".id;


--
-- Name: Talk Topic Map; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Talk Topic Map" (
    id integer NOT NULL,
    "Talk" integer,
    "Topic" integer
);


--
-- Name: Talk Topic Map_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Talk Topic Map_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Talk Topic Map_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Talk Topic Map_id_seq" OWNED BY "Talk Topic Map".id;


--
-- Name: Time Slots; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Time Slots" (
    id integer NOT NULL,
    "Slot" text NOT NULL
);


--
-- Name: Time Slots_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Time Slots_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Time Slots_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Time Slots_id_seq" OWNED BY "Time Slots".id;


--
-- Name: Tracks; Type: TABLE; Schema: Mathesar Con; Owner: -
--

CREATE TABLE "Tracks" (
    id integer NOT NULL,
    "Name" text
);


--
-- Name: Tracks_id_seq; Type: SEQUENCE; Schema: Mathesar Con; Owner: -
--

CREATE SEQUENCE "Tracks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Tracks_id_seq; Type: SEQUENCE OWNED BY; Schema: Mathesar Con; Owner: -
--

ALTER SEQUENCE "Tracks_id_seq" OWNED BY "Tracks".id;


--
-- Name: Days id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Days" ALTER COLUMN id SET DEFAULT nextval('"Table 119_id_seq"'::regclass);


--
-- Name: Job Titles id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Job Titles" ALTER COLUMN id SET DEFAULT nextval('"Positions_id_seq"'::regclass);


--
-- Name: Organizations id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Organizations" ALTER COLUMN id SET DEFAULT nextval('"Table 67_id_seq"'::regclass);


--
-- Name: Rooms id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Rooms" ALTER COLUMN id SET DEFAULT nextval('"Table 117_id_seq"'::regclass);


--
-- Name: Speakers id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Speakers" ALTER COLUMN id SET DEFAULT nextval('"Table 115_id_seq"'::regclass);


--
-- Name: Talk Topic Map id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talk Topic Map" ALTER COLUMN id SET DEFAULT nextval('"Talk Topic Map_id_seq"'::regclass);


--
-- Name: Talks id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talks" ALTER COLUMN id SET DEFAULT nextval('"Table 120_id_seq"'::regclass);


--
-- Name: Time Slots id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Time Slots" ALTER COLUMN id SET DEFAULT nextval('"Time Slots_id_seq"'::regclass);


--
-- Name: Topics id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Topics" ALTER COLUMN id SET DEFAULT nextval('"Table 118_id_seq"'::regclass);


--
-- Name: Tracks id; Type: DEFAULT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Tracks" ALTER COLUMN id SET DEFAULT nextval('"Tracks_id_seq"'::regclass);


--
-- Data for Name: Days; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Days" (id, "Name", "Date") VALUES (1, 'Friday', '2023-01-20');
INSERT INTO "Days" (id, "Name", "Date") VALUES (2, 'Saturday', '2023-01-21');
INSERT INTO "Days" (id, "Name", "Date") VALUES (3, 'Sunday', '2023-01-22');


--
-- Data for Name: Job Titles; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Job Titles" (id, "Titles") VALUES (1, 'Director of Technology');
INSERT INTO "Job Titles" (id, "Titles") VALUES (3, 'Product Designer');
INSERT INTO "Job Titles" (id, "Titles") VALUES (4, 'Product Manager');
INSERT INTO "Job Titles" (id, "Titles") VALUES (5, 'User Advocate');
INSERT INTO "Job Titles" (id, "Titles") VALUES (6, 'Store Manager');
INSERT INTO "Job Titles" (id, "Titles") VALUES (7, 'Business Analyst');
INSERT INTO "Job Titles" (id, "Titles") VALUES (8, 'Sysadmin');
INSERT INTO "Job Titles" (id, "Titles") VALUES (9, 'Data Journalist');
INSERT INTO "Job Titles" (id, "Titles") VALUES (10, 'Hospital Administrator');
INSERT INTO "Job Titles" (id, "Titles") VALUES (11, 'Educator');
INSERT INTO "Job Titles" (id, "Titles") VALUES (2, 'Software Engineer');
INSERT INTO "Job Titles" (id, "Titles") VALUES (12, 'Data Coordinator');
INSERT INTO "Job Titles" (id, "Titles") VALUES (13, 'Founder');


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Organizations" (id, "Organization") VALUES (1, 'Center of Complex Interventions(CCI)');
INSERT INTO "Organizations" (id, "Organization") VALUES (3, 'PostgreSQL Global Development Group');
INSERT INTO "Organizations" (id, "Organization") VALUES (2, 'Django Software Foundation');
INSERT INTO "Organizations" (id, "Organization") VALUES (4, 'Svelte Foundation');
INSERT INTO "Organizations" (id, "Organization") VALUES (5, 'Becker Group');
INSERT INTO "Organizations" (id, "Organization") VALUES (6, 'Learning Equality');
INSERT INTO "Organizations" (id, "Organization") VALUES (7, 'Harper Automotive');
INSERT INTO "Organizations" (id, "Organization") VALUES (9, 'The Data Digest
');
INSERT INTO "Organizations" (id, "Organization") VALUES (10, 'Hope Medical Center');
INSERT INTO "Organizations" (id, "Organization") VALUES (8, 'State of Palmchester');
INSERT INTO "Organizations" (id, "Organization") VALUES (11, 'Fresh Basket');
INSERT INTO "Organizations" (id, "Organization") VALUES (12, 'Data Dynamics');


--
-- Data for Name: Rooms; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Rooms" (id, "Name", "Capacity") VALUES (1, 'Main Hall', 120);
INSERT INTO "Rooms" (id, "Name", "Capacity") VALUES (2, '202A', 35);
INSERT INTO "Rooms" (id, "Name", "Capacity") VALUES (3, '202B', 35);
INSERT INTO "Rooms" (id, "Name", "Capacity") VALUES (4, '202C', 35);
INSERT INTO "Rooms" (id, "Name", "Capacity") VALUES (5, '202D', 35);


--
-- Data for Name: Speakers; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (18, 'Edward', 'Bautista', 'edwardb@freshbket.org', 'Edward is an experienced retail professional who has been the store manager for The Fresh Basket for the past 5 years. He has a passion for providing customers with high-quality, fresh, and healthy food options. Under his leadership, The Fresh Basket has become a well-known destination for those who are looking for a wide variety of fresh fruits, vegetables, and other products. He is always looking for ways to improve the store''s operations and customer experience, and has implemented various technology solutions to streamline the store''s processes and improve efficiency. Edward is excited to share his experiences and insights at the upcoming tech conference and hopes to learn from other industry professionals.', 6, 11);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (25, 'Ryan', 'Fisher', 'ryan.fisher@palm.gov', 'Ryan Fisher is a data coordinator for the State of Palmchester, where he manages and analyzes data for various government departments. He has a strong background in data management, analysis and visualization, and he is a skilled professional in using various data management tools and software. Ryan is an expert in providing insights and recommendations based on data analysis to support decision-making processes. He has been working in the field for over 5 years and has a deep understanding of data privacy and security standards.', 12, 8);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (2, 'Sarah', 'Smith', 'sarah@centerofci.org', 'Sarah is a designer with a focus on experimenting and iterating with different design processes. During her twelve-year career in tech, she has worked on various products at healthcare and enterprise software startups. She enjoys sharing her ideas and experience with people and helping them think creatively. Sarah is currently the product designer for the Mathesar project, which aims to help people collaborate, develop, and explore the potential of database technologies to meet the challenges of an increasingly complex world.', 3, 1);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (16, 'Daniel', 'Novak', 'novak.daniel@harper.auto', 'Daniel is a project manager at Harper Automotive. He has a deep understanding of automotive industry and has been iinstrumental in implementing various technology solutions to improve the company''s operations, efficiency and productivity. He is an expert in project management methodologies and has a talent for leading cross-functional teams and coordinating with stakeholders to achieve project goals.', 4, 7);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (1, 'John', 'Davis', 'john@centerofci.org', 'John is a highly experienced backend engineer with over 10 years of experience in building complex database systems. He is a key contributor to the Mathesar project and is responsible for designing and implementing the core architecture of the platform. John is passionate about making technology accessible to non-technical users and is dedicated to making Mathesar as user-friendly as possible.', 2, 1);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (6, 'Robert', 'Martinez', 'robert@centerofci.org', 'Robert is a seasoned backend engineer with a strong background in software development. He is an expert in web development and has a deep understanding of the technologies that are used to build Mathesar. Robert is responsible for building the RESTful API of Mathesar, which allows for easy integration with other systems.', 2, 1);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (7, 'Joshua', 'Hernandez', 'joshua@centerofci.org', 'Joshua is a frontend engineer with a background in computer science and a passion for user experience. Joshua has been working on Mathesar for over 2 years and is excited to see the project come to fruition. Joshua is dedicated to building an intuitive and user-friendly interface that makes it easy for anyone to work with databases, regardless of their technical knowledge. He is committed to using his skills and experience to create a user-friendly interface that is both functional and visually appealing.', 2, 1);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (8, 'Jacob', 'Lopez', 'jacob@centerofci.org', 'Jacob is a backend developer with a passion for data science. He has a deep understanding of data structures and algorithms, and is an expert in Python programming. Jacob is responsible for building the data analytics and visualization features of Mathesar, which allows non-technical users to easily explore and understand their data. He is dedicated to making Mathesar a powerful tool for data-driven decision making.', 2, 1);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (4, 'David', 'Garcia', 'david@centerofci.org', 'David is a skilled backend developer with a background in data engineering. He has a deep understanding of database systems and is an expert in SQL and noSQL databases. John is responsible for developing the data access layer of Mathesar, ensuring that it is optimized for performance and scalability.', 2, 1);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (3, 'Michael', 'Brown', 'michael@centerofci.org', 'Michael is an experienced frontend engineer with a background in software development. Michael has a strong understanding of web technologies and is committed to building interfaces that are both functional and visually appealing. Michael is dedicated to building an intuitive and user-friendly interface that makes it easy for anyone to work with databases.', 2, 1);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (9, 'James', 'Rodriguez', 'james@centerofci.org', 'James is a frontend engineer with a passion for creating intuitive and user-friendly interfaces. With over 5 years of experience in frontend development, James has a strong understanding of web technologies and a keen eye for design. James is dedicated to building a user-friendly interface that makes it easy for anyone to work with databases.', 2, 1);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (14, 'Bob', 'Johnson', 'bob@pgres.org', 'Bob is an engineer at the Postgresql Global Development Group. He specializes in implementing new features related to database management and has a strong background in SQL programming. Bob is dedicated to improving the overall performance and functionality of Postgresql databases, and is always looking for new ways to push the limits of what can be achieved with this powerful tool.', 2, 3);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (11, 'Amy', 'Miller', 'amymiller@django.org', 'Amy is a software engineer who has been working at the Django Software Foundation for over 5 years. She specializes in implementing new features and improving the overall performance of the Django web framework. Amy is passionate about open-source software and enjoys collaborating with other engineers to build better tools for developers.', 2, 2);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (15, 'Michael', 'Williams', 'michaelwill@svlt.org', 'Michael is an experienced software engineer at Svelte Foundation. He has been instrumental in implementing new features and improvements to the framework, making it more user-friendly and efficient.', 2, 4);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (21, 'Sean', 'Hernandez', 'sean@datadigest.org', 'Sean is a passionate data journalist who has been working with the Data Digest for the past 3 years. As a data-driven weekly newsletter, the Data Digest is a platform that provides insights and analysis on the latest tech trends and developments. Sean''s extensive experience in data journalism, combined with his deep understanding of the tech industry, makes him the perfect fit for the Data Digest. Sean''s work has been recognized for its in-depth analysis and ability to make complex data easy to understand for the general audience. He is always looking for new ways to tell compelling stories through data, and he is constantly seeking new ways to make data more accessible to the public.', 9, 9);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (20, 'Patricia', 'Daniels', 'patricia@becker.org', 'Patricia is a highly skilled and experienced system administrator who has been working at The Becker Group for the past 5 years. She specializes in the implementation and maintenance of complex IT systems and has a deep understanding of various operating systems, including Windows and Linux. Patricia has been responsible for the day-to-day operations of the IT infrastructure of the Becker Group and has played an instrumental role in ensuring the smooth and efficient functioning of the organization''s IT systems. ', 8, 5);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (24, 'Brandon', 'Peters', 'brandon@le.org', 'Brandon is an experienced educator and technology advocate who has been working with Learning Equality, a non-profit organization, for the past 5 years. He specializes in designing and implementing technology-based education programs for underprivileged communities. Brandon has a deep understanding of the challenges and opportunities of digital education and has been instrumental in creating digital resources and tools that enable children to learn in a fun and interactive way.  He is passionate about using technology to create a more inclusive and equitable world, and is always eager to share his knowledge and experience with others.', 11, 6);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (22, 'Caroline', 'Martin', 'caroline@hopemed.org', 'Caroline is an experienced hospital administrator who currently works at the Hope Medical Center. She has over 10 years of experience in the healthcare industry, with a focus on managing and improving hospital operations. Caroline has a deep understanding of healthcare technology and has been instrumental in implementing new systems and processes at the Hope Medical Center to improve patient care and streamline operations. Caroline shares her knowledge and insights on how technology can be used to improve patient outcomes and hospital efficiency.', 10, 10);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (19, 'Collin', 'Gutierrez', 'collin@becker.org', 'Collin is a highly skilled business analyst with a proven track record of delivering results. He has been working with the Becker Group for the past 5 years, where he has been responsible for analyzing and interpreting data to help the company make strategic business decisions.  He is a problem solver and a critical thinker who is always looking for ways to improve the company''s bottom line. Collin''s ability to think outside the box and his keen analytical skills make him a valuable asset to the Becker Group and the tech industry as a whole.', 7, 5);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (17, 'Kevin', 'Rivera', 'kev.riv@becker.org', 'Kevin is a passionate user advocate with over 5 years of experience in the tech industry. He currently works for the Becker Group as a user advocate, where he helps to improve the user experience and ensure that the products and services offered by the company meet the needs of its customers. Kevin has a strong background in user research, user testing, and usability evaluation. He has a deep understanding of the user-centered design process and is skilled in conducting user research, analyzing data, and making recommendations for product improvements.', 5, 5);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (26, 'Christopher', 'Smith', 'chris.smith@datadyn.org', 'Cristopher is a tech entrepreneur and the founder of a rapidly growing startup. He has a deep understanding of the software development process, under his leadership, his startup has grown to become one of the leading companies in the field of data analytics and development.', 13, 12);
INSERT INTO "Speakers" (id, "First Name", "Last Name", "Email", "Bio", "Job Title", "Organization") VALUES (5, 'Emily', 'Johnson', 'emily@centerofci.org', 'Emily is the Director of Technology at Mathesar, with a background in computer science and a passion for user experience, Emily is dedicated to making Mathesar''s user interface as intuitive and user-friendly as possible. She leads the development team and is constantly working to improve the software, making it easier for non-technical users to work with both existing and new databases without any prior knowledge of database concepts. Emily''s goal is to make Mathesar the go-to solution for anyone who needs to access and manage data without the need for technical expertise.', 1, 1);


--
-- Data for Name: Talk Topic Map; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (1, 2, 2);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (26, 13, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (2, 2, 1);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (3, 2, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (27, 13, 6);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (4, 2, 3);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (5, 3, 5);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (6, 4, 6);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (7, 4, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (28, 14, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (8, 4, 5);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (29, 15, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (9, 5, 1);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (10, 5, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (11, 6, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (30, 16, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (12, 6, 6);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (31, 16, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (13, 6, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (14, 7, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (32, 16, 1);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (15, 7, 3);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (33, 17, 1);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (16, 8, 5);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (17, 8, 4);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (34, 17, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (18, 9, 3);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (35, 18, 1);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (19, 9, 1);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (36, 18, 3);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (20, 10, 2);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (37, 19, 4);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (21, 10, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (22, 11, 4);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (38, 19, 5);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (23, 11, 5);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (24, 12, 4);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (25, 12, 5);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (69, 38, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (39, 20, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (40, 21, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (70, 39, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (41, 21, 2);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (71, 39, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (43, 22, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (72, 40, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (42, 22, 2);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (73, 40, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (44, 22, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (45, 23, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (74, 41, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (46, 23, 3);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (47, 24, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (75, 41, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (48, 25, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (49, 26, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (50, 27, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (51, 28, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (52, 29, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (53, 29, 2);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (54, 30, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (55, 30, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (56, 30, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (57, 31, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (58, 31, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (59, 32, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (60, 32, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (61, 33, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (62, 33, 3);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (63, 34, 7);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (64, 34, 3);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (65, 35, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (66, 36, 8);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (67, 36, 9);
INSERT INTO "Talk Topic Map" (id, "Talk", "Topic") VALUES (68, 37, 9);


--
-- Data for Name: Talks; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (2, 'SQLAlchemy and Dynamic Defaults', 1, 2, 8, 'SQLAlchemy doesn''t support dynamic default values very well. In this talk, we explore options for how to both create and parse dynamic default values for database columns using SQLAlchemy.', 7, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (5, 'Python for databases', 1, 2, 1, 'In this talk we explore a number of challenges and constraints encountered when using python to interact with a PostgreSQL DB.', 8, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (17, 'PostgreSQL: The best SQL', 2, 1, 4, 'In this talk we will take a look at the current state of PostgreSQL, and explore its features which made it a natural fit for the Database System backing Mathesar.', 8, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (30, 'Data Engineering and Mathesar', 3, 1, 6, 'In this talk, we take a look at data tools such as Apache Spark, and how you can integrate their use with the Mathesar UI.', 7, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (31, 'Data Science and Mathesar', 3, 1, 4, 'In this talk, we will review some basics of data science, including key concepts. You will learn how these concepts can be implemented and used when working with Mathesar.', 1, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (4, 'Exploring Data Visualization: Techniques and Tools', 1, 1, 9, 'In this talk, you will learn about different techniques and tools that you can use to create effective data visualizations. You will learn about different types of charts and graphs, and how to choose the right visualization for your data. You will also learn about tools like D3.js and Tableau, and how to use them to create interactive and engaging visualizations.', 7, 4);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (29, 'Building Modern Web Applications with Svelte.js', 2, 1, 7, 'In this talk, you will learn about Svelte.js, a modern JavaScript framework for building web applications. You will learn about the principles and philosophy behind Svelte, and how it differs from other frameworks. You will also learn about the core concepts and features of Svelte, and how to use them to build efficient and reactive applications.', 1, 4);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (18, 'Advanced Svelte.js Techniques: Animations, Server-Side Rendering, and More', 2, 2, 3, 'In this talk, you will learn about advanced techniques for using Svelte.js, such as animations, server-side rendering, and performance optimization. You will learn about different tools and libraries that you can use to extend the capabilities of Svelte, and how to apply these techniques in real-world projects. You will also learn about some of the trade-offs and considerations when using advanced Svelte techniques.', 7, 4);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (19, 'Integrating Svelte.js with Other Technologies', 2, 2, 9, 'In this talk, you will learn about how to integrate Svelte.js with other technologies such as APIs, databases, and front-end libraries. You will learn about different techniques and tools for connecting Svelte to external data sources and services, and how to build full-stack applications with Svelte. You will also learn about some of the considerations and challenges when integrating Svelte with other technologies.', 8, 4);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (33, 'Svelte.js Best Practices: Tips and Tricks', 3, 3, 7, 'In this talk, you will learn about best practices and tips and tricks for using Svelte.js. You will learn about techniques such as code organization, testing, and performance optimization, and how to apply them in your Svelte projects. You will also learn about some of the common pitfalls and mistakes to avoid when using Svelte.', 7, 4);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (16, 'Django and its use in Mathesar', 2, 1, 6, 'In this talk we will explore Django, how it''s used in Mathesar, and the pros/cons of the tool when solving our problems.', 7, 5);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (6, 'No-Code Data Analysis: Tools and Techniques', 1, 3, 2, 'In this talk, you will learn about different tools and techniques that you can use to perform data analysis without writing any code. You will learn about platforms like Excel, Google Sheets, and Mathesar, and how to use them to manipulate, analyze, and visualize data. You will also learn about some of the benefits and limitations of using no-code data analysis tools, and how to choose the right one for your needs.', 7, NULL);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (7, 'Integrating with No-Code tools', 1, 3, 8, 'In this talk, you will learn about different no-code tools, and how to integrate with them in the context of a Mathesar project.', 8, NULL);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (20, 'Designing for Data', 2, 3, 2, 'In this talk we discuss principles, approaches, and some challenges associated with designing a product for data input and analysis.', 7, NULL);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (1, 'The Mathesar Vision', 1, 1, 5, 'In this introduction and welcome, we discuss the vision of Mathesar, and why you should be excited to attend our exclusive conference.', 1, 6);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (21, 'Managing Engineers: a metaphorical approach', 2, 3, 5, 'When your cats are on a hot tin roof, should you herd them, skin them, or let them out of the bag? The roof is a deadline. The cats are engineers.', 8, 6);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (23, 'Retail Success with Mathesar: Boosting Sales and Enhancing the Customer Experience
', 2, 4, 18, 'This talk will cover how businesses in the retail industry have used Mathesar to boost sales and improve customer experience, including how it has helped with data-driven decision-making, inventory management, and customer segmentation', 8, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (32, 'Building APIs with Django Rest Framework', 3, 2, 1, 'In this talk, you will learn about how to use Django Rest Framework (DRF), a powerful Django extension for building APIs. You will learn about the features and architecture of DRF, and how to use it to build RESTful APIs for your Django projects. You will also learn about some of the best practices and tools for testing and documenting your APIs.', 7, 5);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (3, 'Optimizing Web Performance: Techniques and Tools', 1, 1, 3, 'In this talk, you will learn about different techniques and tools that you can use to optimize the performance of your web applications. You will learn about techniques such as code optimization, caching, and load balancing, as well as tools like performance monitoring and profiling.', 8, 4);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (15, 'The Mathesar Vision, part 2', 3, 1, 5, 'In this final talk of the last day, we look at how we think Mathesar will evolve over the coming months and years, and hope to inspire you with our direction!', 8, 6);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (9, 'Integrating Mathesar with other tools and platforms', 1, 4, 14, 'Discover how to use Mathesar in conjunction with other tools and platforms, including how to import and export data and use APIs to connect to other systems.
', 8, 5);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (14, 'Taking Control of Your Finances with Mathesar', 1, 4, 19, 'I''ll be sharing my personal experience of how I used Mathesar to take control of my finances. I''ll show you how I use Mathesar to track my income and expenses, create custom reports and visualizations, and set financial goals. I''ll also show you how I use data models and custom queries to identify areas for improvement and make informed decisions about spending. I''ll share tips and tricks on how I use Mathesar to manage multiple income streams and expenses and how to budget and plan for financial goals like saving for retirement or buying a house. ', 9, 6);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (10, 'Mathesar for project management: Best practices', 1, 5, 16, 'This talk will explore how Mathesar can be used to manage projects, including how to set up custom explorations, track progress, and collaborate with team members.
', 8, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (39, 'Getting Started with Mathesar Server Administration', 3, 5, 20, 'In this talk, a Mathesar administrator will provide an overview of the process of installing and configuring a Mathesar server. Topics covered will include system requirements, installation options, initial setup, and best practices for maintaining and troubleshooting a Mathesar server. Attendees will learn how to set up a Mathesar server from scratch and will be prepared to address common issues and troubleshoot problems.', 8, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (35, 'Building data models with Mathesar: A step-by-step guide', 3, 3, 5, 'Learn how to build complex data models using Mathesar, including how to define relationships between data, set up calculated fields, and build reports.', 1, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (26, 'Opening Data to the Public: How City Government used Mathesar to increase transparency and citizen engagement', 2, 3, 25, 'In this talk, a representative from a city government will share how their organization has used Mathesar to increase transparency and citizen engagement by sharing data publicly. They will discuss how they used Mathesar to create an open data portal, making public data sets such as crime statistics, real estate transactions and public transportation schedules available to citizens. They will also share specific examples of how this data has been used by residents, researchers, and developers to improve the city and generate positive outcomes, such as reducing crime and improving public transportation.
', 9, 6);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (22, 'Maximizing the Potential of Mathesar in Healthcare: Real-world Examples', 2, 4, 22, 'In this talk, we will present case studies on how businesses in the healthcare industry have used Mathesar to improve patient outcomes and streamline operations, including how it has helped with data management, analysis, and reporting.', 7, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (36, 'Achieving Data-Driven Decision Making with Mathesar: My Experience', 3, 4, 19, 'Collin a business analyst at Becker Group, will share his experience using Mathesar to achieve data-driven decision making in their organization. He will discuss how he set up data models, organized data, performed analysis and how he was able to use insights to drive action and achieve the company''s goals.', 7, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (25, 'Unlocking the Power of Data for Education: Our Experience at Education for All', 2, 5, 24, 'In this talk, an employee from Learning Equality, a nonprofit organization focused on improving access to education, will share how their organization has used Mathesar to unlock the power of data and drive progress towards their mission. They will discuss how Mathesar helped them to manage and analyze data on student performance, resources, and demographics, and how it enabled them to track progress, identify areas for improvement, and make data-driven decisions to support student success. They will provide specific examples of how Mathesar has been used to support their mission and the positive outcomes that have been achieved.', 1, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (40, 'Investigating with Mathesar: How data journalists used Mathesar to analyze public data sets to uncover stories', 3, 4, 21, 'In this talk, data journalists will share how they used Mathesar to analyze public data sets to uncover stories and investigate important issues. They will discuss specific examples of how they used Mathesar to analyze data sets such as government spending, campaign contributions and crime statistics to uncover patterns and trends. They will also share specific examples of how the data was used to inform their reporting, and lead to stories that would have been otherwise hard to find or would have remained hidden. Attendees will learn how to use Mathesar to analyze and make sense of large, complex data sets to uncover important stories and investigate important issues.
', 8, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (8, 'Advanced data analysis with Mathesar: grouping, filters, and more', 1, 4, 16, 'Learn how to use Mathesar''s advanced data analysis features, including grouping, filters, and summarization, to uncover insights and trends in your data.', 7, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (11, 'Migrating to Mathesar: Tips and considerations', 1, 5, 15, 'If you''re planning to switch to Mathesar from another database tool, this talk will cover best practices for migration, including how to transfer data, set up new models, and onboard users.', 9, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (12, 'Advanced Mathesar Server Configuration and Management', 1, 2, 20, 'This talk will cover advanced topics for configuring and managing a Mathesar server, including performance tuning, security, and backup and recovery. It will also show how to access and use Mathesar''s API and command-line tools to automate and manage your Mathesar server. Attendees will learn how to optimize the performance of their Mathesar server, secure their data, and ensure that they can recover their data in the event of an emergency.', 9, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (13, 'Organizing your Home Media with Mathesar: Creating Custom Data Models and Relationships
', 1, 5, 14, 'In this talk, an experienced Mathesar user will share how they have used Mathesar to manage their home media collection, including movies, TV shows, and music. They will discuss how they used Mathesar to create custom data models and set up relationships between different media types, and demonstrate how to use Mathesar''s querying and reporting capabilities to easily find and organize media. They will also show how they used the data modeling and relationship features of Mathesar to create a collection of movie and TV series metadata, connected to their local media files. The talk will provide tips and tricks on how to organize and create data models that fit your media collection. Attendees will learn how to use Mathesar to organize their home media collections and unlock new ways to explore and enjoy their media.', 1, 3);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (27, 'Optimizing MMORPG Play with Mathesar: Tips and Tricks for Gamers', 2, 4, 17, 'In this talk, a dedicated MMORPG player will share how they use Mathesar to optimize their gameplay and gain a competitive edge. They will demonstrate how they use Mathesar to track and analyze their character''s statistics, inventory, and quest progress. They will also show how they use Mathesar to create custom reports and visualizations to monitor their performance, identify areas for improvement and plan strategies for their next steps in the game. Additionally, they will share how they use Mathesar to track and manage their guild''s resources and member''s information. They will provide tips and tricks on how to use Mathesar to make the most of your MMORPG experience, from character development to group management and from resource tracking to performance monitoring.', 9, NULL);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (28, 'Rapid App Prototyping with Mathesar: From Idea to MVP in No-Time', 2, 5, 26, 'I''ll be sharing my experience of how I used Mathesar to quickly prototype a new app idea without writing any code. I''ll show you how I used Mathesar''s data modeling and querying capabilities to create a functional prototype of the app, complete with a dynamic and interactive user interface. I''ll also discuss how I approached validating my prototype with potential users. ', 7, 5);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (41, 'Streamlining Grocery Planning and Recipe Tracking with Mathesar: A Mom''s Perspective', 3, 3, 22, 'A busy mom will share how she uses Mathesar to streamline her grocery planning and recipe tracking. She will demonstrate how she uses Mathesar to keep track of her family''s dietary restrictions, create shopping lists, and plan meals for the week. She will also show how she uses Mathesar to organize her recipes by categories, ingredients and dietary restrictions and how she uses it to plan and schedule her cooking routine, using the data provided by the data models and custom queries. She will also share how she uses Mathesar to track ingredients inventory and monitor expiration dates. ', 9, 6);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (37, 'Transforming Manufacturing with Mathesar: Using Predictive Analytics to Improve Productivity', 3, 4, 16, 'Daniel, the production manager at Harper Automotive, will share how his factory has been using Mathesar to increase productivity in an unusual way. He will discuss how they have been using predictive analytics to predict equipment failures and prevent downtime. By using Mathesar to analyze data from their machinery and monitoring systems, they were able to detect patterns indicating that equipment was likely to fail, and then schedule maintenance before it happened. As a result, they were able to reduce unplanned downtime and increase overall equipment availability, which led to a significant increase in productivity. Daniel will also share tips on how other factories, particularly in the automotive industry, can use Mathesar to implement similar predictive maintenance strategies and gain similar benefits.', 9, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (24, 'Streamlining Emergency Response with Mathesar: Our Experience at Disaster Relief Fund', 2, 5, 22, 'In this talk, a representative from Disaster Relief Fund, a nonprofit organization focused on providing emergency response, will share their experience using Mathesar to increase efficiency and effectiveness in emergency response. They will discuss how Mathesar helped their organization to manage and analyze data on resources, logistics, and needs, and how it enabled them to make data-driven decisions to drive progress towards their mission of providing aid to affected communities. They will provide specific examples of how Mathesar has been utilized in emergency response operations and the positive outcomes it has helped achieve.', 9, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (34, 'Collaborating with Mathesar: Tips and best practices', 3, 2, 11, 'This talk will cover best practices for collaborating with colleagues using Mathesar, including tips for organizing data, sharing explorations, and working together in real-time.', 8, 1);
INSERT INTO "Talks" (id, "Title", "Day", "Room", "Speaker", "Abstract", "Time Slot", "Track") VALUES (38, 'Mastering Mathesar: Tips and Tricks for Setting Up and Configuring Your Database', 3, 5, 17, 'In this talk, an experienced Mathesar user will share tips and tricks for setting up and configuring a Mathesar database. They will cover topics such as data modeling, data entry, and query optimization, as well as best practices for creating effective reports and visualizations. Attendees will learn how to quickly and efficiently set up a Mathesar installation and start using it to gain insights from their data.', 7, 3);


--
-- Data for Name: Time Slots; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Time Slots" (id, "Slot") VALUES (1, '08:00-10:00');
INSERT INTO "Time Slots" (id, "Slot") VALUES (7, '13:00-15:00');
INSERT INTO "Time Slots" (id, "Slot") VALUES (8, '15:30-17:30');
INSERT INTO "Time Slots" (id, "Slot") VALUES (9, '10:30-12:30');


--
-- Data for Name: Topics; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Topics" (id, "Name") VALUES (1, 'Python');
INSERT INTO "Topics" (id, "Name") VALUES (2, 'SQL');
INSERT INTO "Topics" (id, "Name") VALUES (3, 'Back End');
INSERT INTO "Topics" (id, "Name") VALUES (4, 'Front End');
INSERT INTO "Topics" (id, "Name") VALUES (5, 'Javascript');
INSERT INTO "Topics" (id, "Name") VALUES (6, 'Design');
INSERT INTO "Topics" (id, "Name") VALUES (7, 'Product');
INSERT INTO "Topics" (id, "Name") VALUES (8, 'Management');
INSERT INTO "Topics" (id, "Name") VALUES (9, 'Database');


--
-- Data for Name: Tracks; Type: TABLE DATA; Schema: Mathesar Con; Owner: -
--

INSERT INTO "Tracks" (id, "Name") VALUES (3, 'Databases');
INSERT INTO "Tracks" (id, "Name") VALUES (4, 'Front End');
INSERT INTO "Tracks" (id, "Name") VALUES (5, 'Web Service');
INSERT INTO "Tracks" (id, "Name") VALUES (1, 'Project Management');
INSERT INTO "Tracks" (id, "Name") VALUES (6, 'Management');


--
-- Name: Positions_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Positions_id_seq"', 13, true);


--
-- Name: Table 115_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Table 115_id_seq"', 26, true);


--
-- Name: Table 117_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Table 117_id_seq"', 5, true);


--
-- Name: Table 118_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Table 118_id_seq"', 9, true);


--
-- Name: Table 119_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Table 119_id_seq"', 3, true);


--
-- Name: Table 120_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Table 120_id_seq"', 43, true);


--
-- Name: Table 67_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Table 67_id_seq"', 12, true);


--
-- Name: Talk Topic Map_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Talk Topic Map_id_seq"', 75, true);


--
-- Name: Time Slots_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Time Slots_id_seq"', 9, true);


--
-- Name: Tracks_id_seq; Type: SEQUENCE SET; Schema: Mathesar Con; Owner: -
--

SELECT pg_catalog.setval('"Tracks_id_seq"', 6, true);


--
-- Name: Job Titles Positions_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Job Titles"
    ADD CONSTRAINT "Positions_pkey" PRIMARY KEY (id);


--
-- Name: Speakers Presenters_Email_key; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Speakers"
    ADD CONSTRAINT "Presenters_Email_key" UNIQUE ("Email");


--
-- Name: Rooms Rooms_Name_key; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Rooms"
    ADD CONSTRAINT "Rooms_Name_key" UNIQUE ("Name");


--
-- Name: Speakers Table 115_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Speakers"
    ADD CONSTRAINT "Table 115_pkey" PRIMARY KEY (id);


--
-- Name: Rooms Table 117_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Rooms"
    ADD CONSTRAINT "Table 117_pkey" PRIMARY KEY (id);


--
-- Name: Topics Table 118_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Topics"
    ADD CONSTRAINT "Table 118_pkey" PRIMARY KEY (id);


--
-- Name: Days Table 119_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Days"
    ADD CONSTRAINT "Table 119_pkey" PRIMARY KEY (id);


--
-- Name: Talks Table 120_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Table 120_pkey" PRIMARY KEY (id);


--
-- Name: Organizations Table 67_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Table 67_pkey" PRIMARY KEY (id);


--
-- Name: Talk Topic Map Talk Topic Map_Talk_key; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talk Topic Map"
    ADD CONSTRAINT "Talk Topic Map_Talk_key" UNIQUE ("Talk", "Topic");


--
-- Name: Talk Topic Map Talk Topic Map_id_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talk Topic Map"
    ADD CONSTRAINT "Talk Topic Map_id_pkey" PRIMARY KEY (id);


--
-- Name: Time Slots Time Slots_Time_key; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Time Slots"
    ADD CONSTRAINT "Time Slots_Time_key" UNIQUE ("Slot");


--
-- Name: Time Slots Time Slots_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Time Slots"
    ADD CONSTRAINT "Time Slots_pkey" PRIMARY KEY (id);


--
-- Name: Tracks Tracks_pkey; Type: CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Tracks"
    ADD CONSTRAINT "Tracks_pkey" PRIMARY KEY (id);


--
-- Name: Speakers Presenters_Organization_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Speakers"
    ADD CONSTRAINT "Presenters_Organization_fkey" FOREIGN KEY ("Organization") REFERENCES "Organizations"(id);


--
-- Name: Speakers Presenters_mathesar_temp_Position_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Speakers"
    ADD CONSTRAINT "Presenters_mathesar_temp_Position_fkey" FOREIGN KEY ("Job Title") REFERENCES "Job Titles"(id);


--
-- Name: Talk Topic Map Talk Topic Map_Talk_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talk Topic Map"
    ADD CONSTRAINT "Talk Topic Map_Talk_fkey" FOREIGN KEY ("Talk") REFERENCES "Talks"(id);


--
-- Name: Talk Topic Map Talk Topic Map_Topic_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talk Topic Map"
    ADD CONSTRAINT "Talk Topic Map_Topic_fkey" FOREIGN KEY ("Topic") REFERENCES "Topics"(id);


--
-- Name: Talks Talks_Day_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_Day_fkey" FOREIGN KEY ("Day") REFERENCES "Days"(id);


--
-- Name: Talks Talks_Presenter_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_Presenter_fkey" FOREIGN KEY ("Speaker") REFERENCES "Speakers"(id);


--
-- Name: Talks Talks_Room_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_Room_fkey" FOREIGN KEY ("Room") REFERENCES "Rooms"(id);


--
-- Name: Talks Talks_Time Slot_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_Time Slot_fkey" FOREIGN KEY ("Time Slot") REFERENCES "Time Slots"(id);


--
-- Name: Talks Talks_mathesar_temp_Track_fkey; Type: FK CONSTRAINT; Schema: Mathesar Con; Owner: -
--

ALTER TABLE ONLY "Talks"
    ADD CONSTRAINT "Talks_mathesar_temp_Track_fkey" FOREIGN KEY ("Track") REFERENCES "Tracks"(id);


--
-- PostgreSQL database dump complete
--

