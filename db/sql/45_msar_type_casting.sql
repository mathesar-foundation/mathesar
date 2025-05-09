/*
This file has msar-namespaced functions related to type casting.

Depends on 05_msar.sql
*/
CREATE TABLE msar.top_level_domains (tld text PRIMARY KEY);
INSERT INTO msar.top_level_domains VALUES
('aaa'), ('aarp'), ('abarth'), ('abb'), ('abbott'), ('abbvie'), ('abc'), ('able'), ('abogado'),
('abudhabi'), ('ac'), ('academy'), ('accenture'), ('accountant'), ('accountants'), ('aco'),
('actor'), ('ad'), ('adac'), ('ads'), ('adult'), ('ae'), ('aeg'), ('aero'), ('aetna'), ('af'),
('afamilycompany'), ('afl'), ('africa'), ('ag'), ('agakhan'), ('agency'), ('ai'), ('aig'),
('airbus'), ('airforce'), ('airtel'), ('akdn'), ('al'), ('alfaromeo'), ('alibaba'), ('alipay'),
('allfinanz'), ('allstate'), ('ally'), ('alsace'), ('alstom'), ('am'), ('amazon'),
('americanexpress'), ('americanfamily'), ('amex'), ('amfam'), ('amica'), ('amsterdam'),
('analytics'), ('android'), ('anquan'), ('anz'), ('ao'), ('aol'), ('apartments'), ('app'),
('apple'), ('aq'), ('aquarelle'), ('ar'), ('arab'), ('aramco'), ('archi'), ('army'), ('arpa'),
('art'), ('arte'), ('as'), ('asda'), ('asia'), ('associates'), ('at'), ('athleta'), ('attorney'),
('au'), ('auction'), ('audi'), ('audible'), ('audio'), ('auspost'), ('author'), ('auto'), ('autos'),
('avianca'), ('aw'), ('aws'), ('ax'), ('axa'), ('az'), ('azure'), ('ba'), ('baby'), ('baidu'),
('banamex'), ('bananarepublic'), ('band'), ('bank'), ('bar'), ('barcelona'), ('barclaycard'),
('barclays'), ('barefoot'), ('bargains'), ('baseball'), ('basketball'), ('bauhaus'), ('bayern'),
('bb'), ('bbc'), ('bbt'), ('bbva'), ('bcg'), ('bcn'), ('bd'), ('be'), ('beats'), ('beauty'),
('beer'), ('bentley'), ('berlin'), ('best'), ('bestbuy'), ('bet'), ('bf'), ('bg'), ('bh'),
('bharti'), ('bi'), ('bible'), ('bid'), ('bike'), ('bing'), ('bingo'), ('bio'), ('biz'), ('bj'),
('black'), ('blackfriday'), ('blockbuster'), ('blog'), ('bloomberg'), ('blue'), ('bm'), ('bms'),
('bmw'), ('bn'), ('bnpparibas'), ('bo'), ('boats'), ('boehringer'), ('bofa'), ('bom'), ('bond'),
('boo'), ('book'), ('booking'), ('bosch'), ('bostik'), ('boston'), ('bot'), ('boutique'), ('box'),
('br'), ('bradesco'), ('bridgestone'), ('broadway'), ('broker'), ('brother'), ('brussels'), ('bs'),
('bt'), ('budapest'), ('bugatti'), ('build'), ('builders'), ('business'), ('buy'), ('buzz'), ('bv'),
('bw'), ('by'), ('bz'), ('bzh'), ('ca'), ('cab'), ('cafe'), ('cal'), ('call'), ('calvinklein'),
('cam'), ('camera'), ('camp'), ('cancerresearch'), ('canon'), ('capetown'), ('capital'),
('capitalone'), ('car'), ('caravan'), ('cards'), ('care'), ('career'), ('careers'), ('cars'),
('casa'), ('case'), ('cash'), ('casino'), ('cat'), ('catering'), ('catholic'), ('cba'), ('cbn'),
('cbre'), ('cbs'), ('cc'), ('cd'), ('center'), ('ceo'), ('cern'), ('cf'), ('cfa'), ('cfd'), ('cg'),
('ch'), ('chanel'), ('channel'), ('charity'), ('chase'), ('chat'), ('cheap'), ('chintai'),
('christmas'), ('chrome'), ('church'), ('ci'), ('cipriani'), ('circle'), ('cisco'), ('citadel'),
('citi'), ('citic'), ('city'), ('cityeats'), ('ck'), ('cl'), ('claims'), ('cleaning'), ('click'),
('clinic'), ('clinique'), ('clothing'), ('cloud'), ('club'), ('clubmed'), ('cm'), ('cn'), ('co'),
('coach'), ('codes'), ('coffee'), ('college'), ('cologne'), ('com'), ('comcast'), ('commbank'),
('community'), ('company'), ('compare'), ('computer'), ('comsec'), ('condos'), ('construction'),
('consulting'), ('contact'), ('contractors'), ('cooking'), ('cookingchannel'), ('cool'), ('coop'),
('corsica'), ('country'), ('coupon'), ('coupons'), ('courses'), ('cpa'), ('cr'), ('credit'),
('creditcard'), ('creditunion'), ('cricket'), ('crown'), ('crs'), ('cruise'), ('cruises'), ('csc'),
('cu'), ('cuisinella'), ('cv'), ('cw'), ('cx'), ('cy'), ('cymru'), ('cyou'), ('cz'), ('dabur'),
('dad'), ('dance'), ('data'), ('date'), ('dating'), ('datsun'), ('day'), ('dclk'), ('dds'), ('de'),
('deal'), ('dealer'), ('deals'), ('degree'), ('delivery'), ('dell'), ('deloitte'), ('delta'),
('democrat'), ('dental'), ('dentist'), ('desi'), ('design'), ('dev'), ('dhl'), ('diamonds'),
('diet'), ('digital'), ('direct'), ('directory'), ('discount'), ('discover'), ('dish'), ('diy'),
('dj'), ('dk'), ('dm'), ('dnp'), ('do'), ('docs'), ('doctor'), ('dog'), ('domains'), ('dot'),
('download'), ('drive'), ('dtv'), ('dubai'), ('duck'), ('dunlop'), ('dupont'), ('durban'), ('dvag'),
('dvr'), ('dz'), ('earth'), ('eat'), ('ec'), ('eco'), ('edeka'), ('edu'), ('education'), ('ee'),
('eg'), ('email'), ('emerck'), ('energy'), ('engineer'), ('engineering'), ('enterprises'),
('epson'), ('equipment'), ('er'), ('ericsson'), ('erni'), ('es'), ('esq'), ('estate'), ('et'),
('etisalat'), ('eu'), ('eurovision'), ('eus'), ('events'), ('exchange'), ('expert'), ('exposed'),
('express'), ('extraspace'), ('fage'), ('fail'), ('fairwinds'), ('faith'), ('family'), ('fan'),
('fans'), ('farm'), ('farmers'), ('fashion'), ('fast'), ('fedex'), ('feedback'), ('ferrari'),
('ferrero'), ('fi'), ('fiat'), ('fidelity'), ('fido'), ('film'), ('final'), ('finance'),
('financial'), ('fire'), ('firestone'), ('firmdale'), ('fish'), ('fishing'), ('fit'), ('fitness'),
('fj'), ('fk'), ('flickr'), ('flights'), ('flir'), ('florist'), ('flowers'), ('fly'), ('fm'),
('fo'), ('foo'), ('food'), ('foodnetwork'), ('football'), ('ford'), ('forex'), ('forsale'),
('forum'), ('foundation'), ('fox'), ('fr'), ('free'), ('fresenius'), ('frl'), ('frogans'),
('frontdoor'), ('frontier'), ('ftr'), ('fujitsu'), ('fun'), ('fund'), ('furniture'), ('futbol'),
('fyi'), ('ga'), ('gal'), ('gallery'), ('gallo'), ('gallup'), ('game'), ('games'), ('gap'),
('garden'), ('gay'), ('gb'), ('gbiz'), ('gd'), ('gdn'), ('ge'), ('gea'), ('gent'), ('genting'),
('george'), ('gf'), ('gg'), ('ggee'), ('gh'), ('gi'), ('gift'), ('gifts'), ('gives'), ('giving'),
('gl'), ('glade'), ('glass'), ('gle'), ('global'), ('globo'), ('gm'), ('gmail'), ('gmbh'), ('gmo'),
('gmx'), ('gn'), ('godaddy'), ('gold'), ('goldpoint'), ('golf'), ('goo'), ('goodyear'), ('goog'),
('google'), ('gop'), ('got'), ('gov'), ('gp'), ('gq'), ('gr'), ('grainger'), ('graphics'),
('gratis'), ('green'), ('gripe'), ('grocery'), ('group'), ('gs'), ('gt'), ('gu'), ('guardian'),
('gucci'), ('guge'), ('guide'), ('guitars'), ('guru'), ('gw'), ('gy'), ('hair'), ('hamburg'),
('hangout'), ('haus'), ('hbo'), ('hdfc'), ('hdfcbank'), ('health'), ('healthcare'), ('help'),
('helsinki'), ('here'), ('hermes'), ('hgtv'), ('hiphop'), ('hisamitsu'), ('hitachi'), ('hiv'),
('hk'), ('hkt'), ('hm'), ('hn'), ('hockey'), ('holdings'), ('holiday'), ('homedepot'),
('homegoods'), ('homes'), ('homesense'), ('honda'), ('horse'), ('hospital'), ('host'), ('hosting'),
('hot'), ('hoteles'), ('hotels'), ('hotmail'), ('house'), ('how'), ('hr'), ('hsbc'), ('ht'), ('hu'),
('hughes'), ('hyatt'), ('hyundai'), ('ibm'), ('icbc'), ('ice'), ('icu'), ('id'), ('ie'), ('ieee'),
('ifm'), ('ikano'), ('il'), ('im'), ('imamat'), ('imdb'), ('immo'), ('immobilien'), ('in'), ('inc'),
('industries'), ('infiniti'), ('info'), ('ing'), ('ink'), ('institute'), ('insurance'), ('insure'),
('int'), ('international'), ('intuit'), ('investments'), ('io'), ('ipiranga'), ('iq'), ('ir'),
('irish'), ('is'), ('ismaili'), ('ist'), ('istanbul'), ('it'), ('itau'), ('itv'), ('jaguar'),
('java'), ('jcb'), ('je'), ('jeep'), ('jetzt'), ('jewelry'), ('jio'), ('jll'), ('jm'), ('jmp'),
('jnj'), ('jo'), ('jobs'), ('joburg'), ('jot'), ('joy'), ('jp'), ('jpmorgan'), ('jprs'), ('juegos'),
('juniper'), ('kaufen'), ('kddi'), ('ke'), ('kerryhotels'), ('kerrylogistics'), ('kerryproperties'),
('kfh'), ('kg'), ('kh'), ('ki'), ('kia'), ('kim'), ('kinder'), ('kindle'), ('kitchen'), ('kiwi'),
('km'), ('kn'), ('koeln'), ('komatsu'), ('kosher'), ('kp'), ('kpmg'), ('kpn'), ('kr'), ('krd'),
('kred'), ('kuokgroup'), ('kw'), ('ky'), ('kyoto'), ('kz'), ('la'), ('lacaixa'), ('lamborghini'),
('lamer'), ('lancaster'), ('lancia'), ('land'), ('landrover'), ('lanxess'), ('lasalle'), ('lat'),
('latino'), ('latrobe'), ('law'), ('lawyer'), ('lb'), ('lc'), ('lds'), ('lease'), ('leclerc'),
('lefrak'), ('legal'), ('lego'), ('lexus'), ('lgbt'), ('li'), ('lidl'), ('life'), ('lifeinsurance'),
('lifestyle'), ('lighting'), ('like'), ('lilly'), ('limited'), ('limo'), ('lincoln'), ('linde'),
('link'), ('lipsy'), ('live'), ('living'), ('lixil'), ('lk'), ('llc'), ('llp'), ('loan'), ('loans'),
('locker'), ('locus'), ('loft'), ('lol'), ('london'), ('lotte'), ('lotto'), ('love'), ('lpl'),
('lplfinancial'), ('lr'), ('ls'), ('lt'), ('ltd'), ('ltda'), ('lu'), ('lundbeck'), ('luxe'),
('luxury'), ('lv'), ('ly'), ('ma'), ('macys'), ('madrid'), ('maif'), ('maison'), ('makeup'),
('man'), ('management'), ('mango'), ('map'), ('market'), ('marketing'), ('markets'), ('marriott'),
('marshalls'), ('maserati'), ('mattel'), ('mba'), ('mc'), ('mckinsey'), ('md'), ('me'), ('med'),
('media'), ('meet'), ('melbourne'), ('meme'), ('memorial'), ('men'), ('menu'), ('merckmsd'), ('mg'),
('mh'), ('miami'), ('microsoft'), ('mil'), ('mini'), ('mint'), ('mit'), ('mitsubishi'), ('mk'),
('ml'), ('mlb'), ('mls'), ('mm'), ('mma'), ('mn'), ('mo'), ('mobi'), ('mobile'), ('moda'), ('moe'),
('moi'), ('mom'), ('monash'), ('money'), ('monster'), ('mormon'), ('mortgage'), ('moscow'),
('moto'), ('motorcycles'), ('mov'), ('movie'), ('mp'), ('mq'), ('mr'), ('ms'), ('msd'), ('mt'),
('mtn'), ('mtr'), ('mu'), ('museum'), ('mutual'), ('mv'), ('mw'), ('mx'), ('my'), ('mz'), ('na'),
('nab'), ('nagoya'), ('name'), ('natura'), ('navy'), ('nba'), ('nc'), ('ne'), ('nec'), ('net'),
('netbank'), ('netflix'), ('network'), ('neustar'), ('new'), ('news'), ('next'), ('nextdirect'),
('nexus'), ('nf'), ('nfl'), ('ng'), ('ngo'), ('nhk'), ('ni'), ('nico'), ('nike'), ('nikon'),
('ninja'), ('nissan'), ('nissay'), ('nl'), ('no'), ('nokia'), ('northwesternmutual'), ('norton'),
('now'), ('nowruz'), ('nowtv'), ('np'), ('nr'), ('nra'), ('nrw'), ('ntt'), ('nu'), ('nyc'), ('nz'),
('obi'), ('observer'), ('off'), ('office'), ('okinawa'), ('olayan'), ('olayangroup'), ('oldnavy'),
('ollo'), ('om'), ('omega'), ('one'), ('ong'), ('onl'), ('online'), ('ooo'), ('open'), ('oracle'),
('orange'), ('org'), ('organic'), ('origins'), ('osaka'), ('otsuka'), ('ott'), ('ovh'), ('pa'),
('page'), ('panasonic'), ('paris'), ('pars'), ('partners'), ('parts'), ('party'), ('passagens'),
('pay'), ('pccw'), ('pe'), ('pet'), ('pf'), ('pfizer'), ('pg'), ('ph'), ('pharmacy'), ('phd'),
('philips'), ('phone'), ('photo'), ('photography'), ('photos'), ('physio'), ('pics'), ('pictet'),
('pictures'), ('pid'), ('pin'), ('ping'), ('pink'), ('pioneer'), ('pizza'), ('pk'), ('pl'),
('place'), ('play'), ('playstation'), ('plumbing'), ('plus'), ('pm'), ('pn'), ('pnc'), ('pohl'),
('poker'), ('politie'), ('porn'), ('post'), ('pr'), ('pramerica'), ('praxi'), ('press'), ('prime'),
('pro'), ('prod'), ('productions'), ('prof'), ('progressive'), ('promo'), ('properties'),
('property'), ('protection'), ('pru'), ('prudential'), ('ps'), ('pt'), ('pub'), ('pw'), ('pwc'),
('py'), ('qa'), ('qpon'), ('quebec'), ('quest'), ('qvc'), ('racing'), ('radio'), ('raid'), ('re'),
('read'), ('realestate'), ('realtor'), ('realty'), ('recipes'), ('red'), ('redstone'),
('redumbrella'), ('rehab'), ('reise'), ('reisen'), ('reit'), ('reliance'), ('ren'), ('rent'),
('rentals'), ('repair'), ('report'), ('republican'), ('rest'), ('restaurant'), ('review'),
('reviews'), ('rexroth'), ('rich'), ('richardli'), ('ricoh'), ('ril'), ('rio'), ('rip'), ('ro'),
('rocher'), ('rocks'), ('rodeo'), ('rogers'), ('room'), ('rs'), ('rsvp'), ('ru'), ('rugby'),
('ruhr'), ('run'), ('rw'), ('rwe'), ('ryukyu'), ('sa'), ('saarland'), ('safe'), ('safety'),
('sakura'), ('sale'), ('salon'), ('samsclub'), ('samsung'), ('sandvik'), ('sandvikcoromant'),
('sanofi'), ('sap'), ('sarl'), ('sas'), ('save'), ('saxo'), ('sb'), ('sbi'), ('sbs'), ('sc'),
('sca'), ('scb'), ('schaeffler'), ('schmidt'), ('scholarships'), ('school'), ('schule'),
('schwarz'), ('science'), ('scjohnson'), ('scot'), ('sd'), ('se'), ('search'), ('seat'), ('secure'),
('security'), ('seek'), ('select'), ('sener'), ('services'), ('ses'), ('seven'), ('sew'), ('sex'),
('sexy'), ('sfr'), ('sg'), ('sh'), ('shangrila'), ('sharp'), ('shaw'), ('shell'), ('shia'),
('shiksha'), ('shoes'), ('shop'), ('shopping'), ('shouji'), ('show'), ('showtime'), ('si'),
('silk'), ('sina'), ('singles'), ('site'), ('sj'), ('sk'), ('ski'), ('skin'), ('sky'), ('skype'),
('sl'), ('sling'), ('sm'), ('smart'), ('smile'), ('sn'), ('sncf'), ('so'), ('soccer'), ('social'),
('softbank'), ('software'), ('sohu'), ('solar'), ('solutions'), ('song'), ('sony'), ('soy'),
('spa'), ('space'), ('sport'), ('spot'), ('sr'), ('srl'), ('ss'), ('st'), ('stada'), ('staples'),
('star'), ('statebank'), ('statefarm'), ('stc'), ('stcgroup'), ('stockholm'), ('storage'),
('store'), ('stream'), ('studio'), ('study'), ('style'), ('su'), ('sucks'), ('supplies'),
('supply'), ('support'), ('surf'), ('surgery'), ('suzuki'), ('sv'), ('swatch'), ('swiss'), ('sx'),
('sy'), ('sydney'), ('systems'), ('sz'), ('tab'), ('taipei'), ('talk'), ('taobao'), ('target'),
('tatamotors'), ('tatar'), ('tattoo'), ('tax'), ('taxi'), ('tc'), ('tci'), ('td'), ('tdk'),
('team'), ('tech'), ('technology'), ('tel'), ('temasek'), ('tennis'), ('teva'), ('tf'), ('tg'),
('th'), ('thd'), ('theater'), ('theatre'), ('tiaa'), ('tickets'), ('tienda'), ('tiffany'), ('tips'),
('tires'), ('tirol'), ('tj'), ('tjmaxx'), ('tjx'), ('tk'), ('tkmaxx'), ('tl'), ('tm'), ('tmall'),
('tn'), ('to'), ('today'), ('tokyo'), ('tools'), ('top'), ('toray'), ('toshiba'), ('total'),
('tours'), ('town'), ('toyota'), ('toys'), ('tr'), ('trade'), ('trading'), ('training'), ('travel'),
('travelchannel'), ('travelers'), ('travelersinsurance'), ('trust'), ('trv'), ('tt'), ('tube'),
('tui'), ('tunes'), ('tushu'), ('tv'), ('tvs'), ('tw'), ('tz'), ('ua'), ('ubank'), ('ubs'), ('ug'),
('uk'), ('unicom'), ('university'), ('uno'), ('uol'), ('ups'), ('us'), ('uy'), ('uz'), ('va'),
('vacations'), ('vana'), ('vanguard'), ('vc'), ('ve'), ('vegas'), ('ventures'), ('verisign'),
('versicherung'), ('vet'), ('vg'), ('vi'), ('viajes'), ('video'), ('vig'), ('viking'), ('villas'),
('vin'), ('vip'), ('virgin'), ('visa'), ('vision'), ('viva'), ('vivo'), ('vlaanderen'), ('vn'),
('vodka'), ('volkswagen'), ('volvo'), ('vote'), ('voting'), ('voto'), ('voyage'), ('vu'),
('vuelos'), ('wales'), ('walmart'), ('walter'), ('wang'), ('wanggou'), ('watch'), ('watches'),
('weather'), ('weatherchannel'), ('webcam'), ('weber'), ('website'), ('wed'), ('wedding'),
('weibo'), ('weir'), ('wf'), ('whoswho'), ('wien'), ('wiki'), ('williamhill'), ('win'), ('windows'),
('wine'), ('winners'), ('wme'), ('wolterskluwer'), ('woodside'), ('work'), ('works'), ('world'),
('wow'), ('ws'), ('wtc'), ('wtf'), ('xbox'), ('xerox'), ('xfinity'), ('xihuan'), ('xin'),
('xn--11b4c3d'), ('xn--1ck2e1b'), ('xn--1qqw23a'), ('xn--2scrj9c'), ('xn--30rr7y'), ('xn--3bst00m'),
('xn--3ds443g'), ('xn--3e0b707e'), ('xn--3hcrj9c'), ('xn--3oq18vl8pn36a'), ('xn--3pxu8k'),
('xn--42c2d9a'), ('xn--45br5cyl'), ('xn--45brj9c'), ('xn--45q11c'), ('xn--4dbrk0ce'),
('xn--4gbrim'), ('xn--54b7fta0cc'), ('xn--55qw42g'), ('xn--55qx5d'), ('xn--5su34j936bgsg'),
('xn--5tzm5g'), ('xn--6frz82g'), ('xn--6qq986b3xl'), ('xn--80adxhks'), ('xn--80ao21a'),
('xn--80aqecdr1a'), ('xn--80asehdb'), ('xn--80aswg'), ('xn--8y0a063a'), ('xn--90a3ac'),
('xn--90ae'), ('xn--90ais'), ('xn--9dbq2a'), ('xn--9et52u'), ('xn--9krt00a'), ('xn--b4w605ferd'),
('xn--bck1b9a5dre4c'), ('xn--c1avg'), ('xn--c2br7g'), ('xn--cck2b3b'), ('xn--cckwcxetd'),
('xn--cg4bki'), ('xn--clchc0ea0b2g2a9gcd'), ('xn--czr694b'), ('xn--czrs0t'), ('xn--czru2d'),
('xn--d1acj3b'), ('xn--d1alf'), ('xn--e1a4c'), ('xn--eckvdtc9d'), ('xn--efvy88h'), ('xn--fct429k'),
('xn--fhbei'), ('xn--fiq228c5hs'), ('xn--fiq64b'), ('xn--fiqs8s'), ('xn--fiqz9s'), ('xn--fjq720a'),
('xn--flw351e'), ('xn--fpcrj9c3d'), ('xn--fzc2c9e2c'), ('xn--fzys8d69uvgm'), ('xn--g2xx48c'),
('xn--gckr3f0f'), ('xn--gecrj9c'), ('xn--gk3at1e'), ('xn--h2breg3eve'), ('xn--h2brj9c'),
('xn--h2brj9c8c'), ('xn--hxt814e'), ('xn--i1b6b1a6a2e'), ('xn--imr513n'), ('xn--io0a7i'),
('xn--j1aef'), ('xn--j1amh'), ('xn--j6w193g'), ('xn--jlq480n2rg'), ('xn--jlq61u9w7b'),
('xn--jvr189m'), ('xn--kcrx77d1x4a'), ('xn--kprw13d'), ('xn--kpry57d'), ('xn--kput3i'),
('xn--l1acc'), ('xn--lgbbat1ad8j'), ('xn--mgb9awbf'), ('xn--mgba3a3ejt'), ('xn--mgba3a4f16a'),
('xn--mgba7c0bbn0a'), ('xn--mgbaakc7dvf'), ('xn--mgbaam7a8h'), ('xn--mgbab2bd'),
('xn--mgbah1a3hjkrd'), ('xn--mgbai9azgqp6j'), ('xn--mgbayh7gpa'), ('xn--mgbbh1a'),
('xn--mgbbh1a71e'), ('xn--mgbc0a9azcg'), ('xn--mgbca7dzdo'), ('xn--mgbcpq6gpa1a'),
('xn--mgberp4a5d4ar'), ('xn--mgbgu82a'), ('xn--mgbi4ecexp'), ('xn--mgbpl2fh'), ('xn--mgbt3dhd'),
('xn--mgbtx2b'), ('xn--mgbx4cd0ab'), ('xn--mix891f'), ('xn--mk1bu44c'), ('xn--mxtq1m'),
('xn--ngbc5azd'), ('xn--ngbe9e0a'), ('xn--ngbrx'), ('xn--node'), ('xn--nqv7f'), ('xn--nqv7fs00ema'),
('xn--nyqy26a'), ('xn--o3cw4h'), ('xn--ogbpf8fl'), ('xn--otu796d'), ('xn--p1acf'), ('xn--p1ai'),
('xn--pgbs0dh'), ('xn--pssy2u'), ('xn--q7ce6a'), ('xn--q9jyb4c'), ('xn--qcka1pmc'), ('xn--qxa6a'),
('xn--qxam'), ('xn--rhqv96g'), ('xn--rovu88b'), ('xn--rvc1e0am3e'), ('xn--s9brj9c'),
('xn--ses554g'), ('xn--t60b56a'), ('xn--tckwe'), ('xn--tiq49xqyj'), ('xn--unup4y'),
('xn--vermgensberater-ctb'), ('xn--vermgensberatung-pwb'), ('xn--vhquv'), ('xn--vuq861b'),
('xn--w4r85el8fhu5dnra'), ('xn--w4rs40l'), ('xn--wgbh1c'), ('xn--wgbl6a'), ('xn--xhq521b'),
('xn--xkc2al3hye2a'), ('xn--xkc2dl3a5ee0h'), ('xn--y9a3aq'), ('xn--yfro4i67o'), ('xn--ygbi2ammx'),
('xn--zfr164b'), ('xxx'), ('xyz'), ('yachts'), ('yahoo'), ('yamaxun'), ('yandex'), ('ye'),
('yodobashi'), ('yoga'), ('yokohama'), ('you'), ('youtube'), ('yt'), ('yun'), ('za'), ('zappos'),
('zara'), ('zero'), ('zip'), ('zm'), ('zone'), ('zuerich'), ('zw');


CREATE OR REPLACE FUNCTION msar.email_domain_name(mathesar_types.email)
RETURNS text AS $$
    SELECT split_part($1, '@', 2);
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.email_local_part(mathesar_types.email)
RETURNS text AS $$
    SELECT split_part($1, '@', 1);
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

-- mathesar_types.uri
CREATE OR REPLACE FUNCTION msar.uri_parts(text)
RETURNS text[] AS $$
    SELECT regexp_match($1, '^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?');
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.uri_scheme(text)
RETURNS text AS $$
    SELECT (msar.uri_parts($1))[2];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.uri_authority(text)
RETURNS text AS $$
    SELECT (msar.uri_parts($1))[4];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.uri_path(text)
RETURNS text AS $$
    SELECT (msar.uri_parts($1))[5];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.uri_query(text)
RETURNS text AS $$
    SELECT (msar.uri_parts($1))[7];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.uri_fragment(text)
RETURNS text AS $$
    SELECT (msar.uri_parts($1))[9];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


/*
------------------------------------------------------------------------
CASTING FUNCTIONS
------------------------------------------------------------------------
*/

-- msar.cast_to_boolean
CREATE OR REPLACE FUNCTION msar.cast_to_boolean(boolean) RETURNS boolean AS $$
  SELECT $1::boolean;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_boolean(real) RETURNS boolean AS $$
BEGIN
  IF $1<>0 AND $1<>1 THEN
    RAISE EXCEPTION '% is not a boolean', $1; END IF;
  RETURN $1<>0;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_boolean(bigint) RETURNS boolean AS $$
BEGIN
  IF $1<>0 AND $1<>1 THEN
    RAISE EXCEPTION '% is not a boolean', $1; END IF;
  RETURN $1<>0;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_boolean(double precision) RETURNS boolean AS $$
BEGIN
  IF $1<>0 AND $1<>1 THEN
    RAISE EXCEPTION '% is not a boolean', $1; END IF;
  RETURN $1<>0;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_boolean(numeric) RETURNS boolean AS $$
BEGIN
  IF $1<>0 AND $1<>1 THEN
    RAISE EXCEPTION '% is not a boolean', $1; END IF;
  RETURN $1<>0;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_boolean(text) RETURNS boolean AS $$
DECLARE
  istrue boolean;
BEGIN
  SELECT
    $1='1' OR lower($1) = 'on'
    OR lower($1)='t' OR lower($1)='true'
    OR lower($1)='y' OR lower($1)='yes'
  INTO istrue;
  IF istrue
    OR $1='0' OR lower($1) = 'off'
    OR lower($1)='f' OR lower($1)='false'
    OR lower($1)='n' OR lower($1)='no'
  THEN
    RETURN istrue;
  END IF;
  RAISE EXCEPTION '% is not a boolean', $1;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- msar.cast_to_real

CREATE OR REPLACE FUNCTION msar.cast_to_real(bigint) RETURNS real AS $$
  SELECT $1::real;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_real(double precision) RETURNS real AS $$
  SELECT $1::real;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_real(real) RETURNS real AS $$
  SELECT $1::real;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_real(numeric) RETURNS real AS $$
  SELECT $1::real;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_real(text) RETURNS real AS $$
  SELECT $1::real;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_real(boolean) RETURNS real AS $$
  SELECT CASE WHEN $1 THEN 1::real ELSE 0::real END;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_double_precision

CREATE OR REPLACE FUNCTION msar.cast_to_double_precision(bigint)
RETURNS double precision AS $$
  SELECT $1::double precision;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_double_precision(double precision)
RETURNS double precision AS $$
  SELECT $1::double precision;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_double_precision(real)
RETURNS double precision AS $$
  SELECT $1::double precision;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_double_precision(numeric)
RETURNS double precision AS $$
  SELECT $1::double precision;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_double_precision(text)
RETURNS double precision AS $$
  SELECT $1::double precision;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_double_precision(boolean)
RETURNS double precision AS $$
  SELECT CASE WHEN $1 THEN 1::double precision ELSE 0::double precision END;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_email

CREATE OR REPLACE FUNCTION msar.cast_to_email(text) RETURNS mathesar_types.email AS $$
  SELECT $1::mathesar_types.email;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_smallint

CREATE OR REPLACE FUNCTION msar.cast_to_smallint(bigint)
RETURNS smallint AS $$
  SELECT $1::smallint;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_smallint(text)
RETURNS smallint AS $$
  SELECT $1::smallint;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_smallint(real)
RETURNS smallint AS $$
  DECLARE integer_res smallint;
  BEGIN
    SELECT $1::smallint INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_smallint(double precision)
RETURNS smallint AS $$
  DECLARE integer_res smallint;
  BEGIN
    SELECT $1::smallint INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_smallint(numeric)
RETURNS smallint AS $$
  DECLARE integer_res smallint;
  BEGIN
    SELECT $1::smallint INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_smallint(money)
RETURNS smallint AS $$
  DECLARE integer_res smallint;
  BEGIN
    SELECT $1::smallint INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_smallint(boolean)
RETURNS smallint AS $$
  SELECT CASE WHEN $1 THEN 1::smallint ELSE 0::smallint END;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_bigint

CREATE OR REPLACE FUNCTION msar.cast_to_bigint(bigint)
RETURNS bigint AS $$
  SELECT $1::bigint;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_bigint(text)
RETURNS bigint AS $$
  SELECT $1::bigint;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_bigint(real)
RETURNS bigint AS $$
  DECLARE integer_res bigint;
  BEGIN
    SELECT $1::bigint INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_bigint(double precision)
RETURNS bigint AS $$
  DECLARE integer_res bigint;
  BEGIN
    SELECT $1::bigint INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_bigint(numeric)
RETURNS bigint AS $$
  DECLARE integer_res bigint;
  BEGIN
    SELECT $1::bigint INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_bigint(money)
RETURNS bigint AS $$
  DECLARE integer_res bigint;
  BEGIN
    SELECT $1::bigint INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_bigint(boolean)
RETURNS bigint AS $$
  SELECT CASE WHEN $1 THEN 1::bigint ELSE 0::bigint END;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_integer

CREATE OR REPLACE FUNCTION msar.cast_to_integer(bigint)
RETURNS integer AS $$
  SELECT $1::integer;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_integer(text)
RETURNS integer AS $$
  SELECT $1::integer;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_integer(real)
RETURNS integer AS $$
  DECLARE integer_res integer;
  BEGIN
    SELECT $1::integer INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_integer(double precision)
RETURNS integer AS $$
  DECLARE integer_res integer;
  BEGIN
    SELECT $1::integer INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_integer(numeric)
RETURNS integer AS $$
  DECLARE integer_res integer;
  BEGIN
    SELECT $1::integer INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_integer(money)
RETURNS integer AS $$
  DECLARE integer_res integer;
  BEGIN
    SELECT $1::integer INTO integer_res;
    IF integer_res = $1 THEN
      RETURN integer_res;
    END IF;
    RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_integer(boolean)
RETURNS integer AS $$
  SELECT CASE WHEN $1 THEN 1::integer ELSE 0::integer END;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_interval

CREATE OR REPLACE FUNCTION msar.cast_to_interval(interval)
RETURNS interval AS $$
  SELECT $1;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_interval(text)
RETURNS interval AS $$
BEGIN
  PERFORM $1::numeric;
  RAISE EXCEPTION '% is a numeric', $1;
  EXCEPTION
    WHEN sqlstate '22P02' THEN
      RETURN $1::interval;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- msar.cast_to_time_without_time_zone

CREATE OR REPLACE FUNCTION msar.cast_to_time_without_time_zone(text)
RETURNS time without time zone AS $$
  SELECT $1::time without time zone;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_time_without_time_zone(time with time zone)
RETURNS time without time zone AS $$
  SELECT $1::time without time zone;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_time_with_time_zone

CREATE OR REPLACE FUNCTION msar.cast_to_time_with_time_zone(text)
RETURNS time with time zone AS $$
  SELECT $1::time with time zone;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_time_with_time_zone(time with time zone)
RETURNS time with time zone AS $$
  SELECT $1::time with time zone;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_timestamp_with_time_zone

CREATE OR REPLACE FUNCTION msar.cast_to_timestamp_with_time_zone(timestamp with time zone)
RETURNS timestamp with time zone AS $$
  SELECT $1::timestamp with time zone;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_timestamp_with_time_zone(text)
RETURNS timestamp with time zone AS $$
  SELECT $1::timestamp with time zone;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_timestamp_without_time_zone

CREATE OR REPLACE FUNCTION msar.cast_to_timestamp_without_time_zone(timestamp without time zone)
RETURNS timestamp without time zone AS $$
  SELECT $1::timestamp without time zone;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_timestamp_without_time_zone(text)
RETURNS timestamp without time zone AS $$
DECLARE
  timestamp_value_with_tz NUMERIC;
  timestamp_value NUMERIC;
  date_value NUMERIC;
BEGIN
  SET LOCAL TIME ZONE 'UTC';
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
  SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
  IF (timestamp_value_with_tz = timestamp_value) THEN
    RETURN $1::timestamp without time zone;
  END IF;
  RAISE EXCEPTION '% is not a timestamp without time zone', $1;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_timestamp_without_time_zone(date)
RETURNS timestamp without time zone AS $$
DECLARE
  timestamp_value_with_tz NUMERIC;
  timestamp_value NUMERIC;
  date_value NUMERIC;
BEGIN
  SET LOCAL TIME ZONE 'UTC';
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
  SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
  IF (timestamp_value_with_tz = timestamp_value) THEN
    RETURN $1::timestamp without time zone;
  END IF;
  RAISE EXCEPTION '% is not a timestamp without time zone', $1;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_timestamp_without_time_zone(timestamp with time zone)
RETURNS timestamp without time zone AS $$
DECLARE
  timestamp_value_with_tz NUMERIC;
  timestamp_value NUMERIC;
  date_value NUMERIC;
BEGIN
  SET LOCAL TIME ZONE 'UTC';
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
  SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
  IF (timestamp_value_with_tz = timestamp_value) THEN
    RETURN $1::timestamp without time zone;
  END IF;
  RAISE EXCEPTION '% is not a timestamp without time zone', $1;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- msar.cast_to_date

CREATE OR REPLACE FUNCTION msar.cast_to_date(date)
RETURNS date AS $$
  SELECT $1::timestamp with time zone;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_date(text)
RETURNS date AS $$
DECLARE
  timestamp_value_with_tz NUMERIC;
  timestamp_value NUMERIC;
  date_value NUMERIC;
BEGIN
  SET LOCAL TIME ZONE 'UTC';
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
  SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
  IF (timestamp_value_with_tz = date_value) THEN
    RETURN $1::date;
  END IF;
  RAISE EXCEPTION '% is not a date', $1;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_date(timestamp with time zone)
RETURNS date AS $$
DECLARE
  timestamp_value_with_tz NUMERIC;
  timestamp_value NUMERIC;
  date_value NUMERIC;
BEGIN
  SET LOCAL TIME ZONE 'UTC';
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
  SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
  SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
  IF (timestamp_value_with_tz = date_value) THEN
    RETURN $1::date;
  END IF;
  RAISE EXCEPTION '% is not a date', $1;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- msar.cast_to_mathesar_money

CREATE OR REPLACE FUNCTION msar.get_mathesar_money_array(text) RETURNS text[] AS $$
DECLARE
  raw_arr text[];
  actual_number_arr text[];
  group_divider_arr text[];
  decimal_point_arr text[];
  actual_number text;
  group_divider text;
  decimal_point text;
  currency_prefix text;
  currency_suffix text;

  -- pieces required for regex
  non_numeric text := '(?:[^.,0-9]+)';
  no_separator_big text := '[0-9]{4,}(?:([,.])[0-9]+)?';
  no_separator_small text := '[0-9]{1,3}(?:([,.])[0-9]{1,2}|[0-9]{4,})?';
  comma_separator_req_decimal text := '[0-9]{1,3}(,)[0-9]{3}(\.)[0-9]+';
  period_separator_req_decimal text := '[0-9]{1,3}(\.)[0-9]{3}(,)[0-9]+';
  comma_separator_opt_decimal text := '[0-9]{1,3}(?:(,)[0-9]{3}){2,}(?:(\.)[0-9]+)?';
  period_separator_opt_decimal text := '[0-9]{1,3}(?:(\.)[0-9]{3}){2,}(?:(,)[0-9]+)?';
  space_separator_opt_decimal text := '[0-9]{1,3}(?:( )[0-9]{3})+(?:([,.])[0-9]+)?';
  comma_separator_lakh_system text := '[0-9]{1,2}(?:(,)[0-9]{2})+,[0-9]{3}(?:(\.)[0-9]+)?';
  inner_number_tree text := concat_ws('|',
                            no_separator_big,
                            no_separator_small,
                            comma_separator_req_decimal,
                            period_separator_req_decimal,
                            comma_separator_opt_decimal,
                            period_separator_opt_decimal,
                            space_separator_opt_decimal,
                            comma_separator_lakh_system
                          );
  inner_number_group text := '(' || inner_number_tree || ')';/* Numbers without currency,
  including inner_number_group as its own capturing group in the money_finding_regex allows us to
  match columns without any currency symbols allowing users the flexibility
  to add currency prefixes and suffixes afterwards in the cases of type inference/data imports. */
  required_currency_beginning text := non_numeric || inner_number_group || non_numeric || '?';
  required_currency_ending text := non_numeric || '?' || inner_number_group || non_numeric;
  money_finding_regex text := '^(?:' || required_currency_beginning || '|' || required_currency_ending || '|' || inner_number_group || ')$';
BEGIN
  SELECT regexp_matches($1, money_finding_regex) INTO raw_arr;
  IF raw_arr IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT array_remove(ARRAY[
    raw_arr[1], -- required_currency_beginning[x]
    raw_arr[16], -- required_currency_ending[x+15]
    raw_arr[31] -- inner_number_group[x+30]
  ], null) INTO actual_number_arr;
  SELECT array_remove(ARRAY[
    raw_arr[4],raw_arr[6],raw_arr[8],raw_arr[10],raw_arr[12],raw_arr[14], -- required_currency_beginning[x]
    raw_arr[19],raw_arr[21],raw_arr[23],raw_arr[25],raw_arr[27],raw_arr[29], -- required_currency_ending[x+15]
    raw_arr[34],raw_arr[36],raw_arr[38],raw_arr[40],raw_arr[42],raw_arr[44] -- inner_number_group[x+30]
  ], null) INTO group_divider_arr;
  SELECT array_remove(ARRAY[
    raw_arr[2],raw_arr[3],raw_arr[5],raw_arr[7],raw_arr[9],raw_arr[11],raw_arr[13],raw_arr[15], -- required_currency_beginning[x]
    raw_arr[17],raw_arr[18],raw_arr[20],raw_arr[22],raw_arr[24],raw_arr[26],raw_arr[28],raw_arr[30], -- required_currency_ending[x+15]
    raw_arr[32],raw_arr[33],raw_arr[35],raw_arr[37],raw_arr[39],raw_arr[41],raw_arr[43],raw_arr[45] -- inner_number_group[x+30]
  ], null) INTO decimal_point_arr;
  SELECT actual_number_arr[1] INTO actual_number;
  SELECT group_divider_arr[1] INTO group_divider;
  SELECT decimal_point_arr[1] INTO decimal_point;
  SELECT replace(replace(split_part($1, actual_number, 1), '-', ''), '(', '') INTO currency_prefix;
  SELECT replace(replace(split_part($1, actual_number, 2), '-', ''), ')', '') INTO currency_suffix;
  IF $1::text ~ '^.*(-|\(.+\)).*$' THEN -- Handle negative values
    actual_number := '-' || actual_number;
  END IF;
  RETURN ARRAY[actual_number, group_divider, decimal_point, currency_prefix, currency_suffix];
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_money(real)
RETURNS mathesar_types.mathesar_money AS $$
  SELECT $1::numeric::mathesar_types.mathesar_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_money(bigint)
RETURNS mathesar_types.mathesar_money AS $$
  SELECT $1::numeric::mathesar_types.mathesar_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_money(double precision)
RETURNS mathesar_types.mathesar_money AS $$
  SELECT $1::numeric::mathesar_types.mathesar_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_money(numeric)
RETURNS mathesar_types.mathesar_money AS $$
  SELECT $1::numeric::mathesar_types.mathesar_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_money(text)
RETURNS mathesar_types.mathesar_money AS $$
DECLARE
  decimal_point text;
  is_negative boolean;
  money_arr text[];
  money_num text;
BEGIN
  SELECT msar.get_mathesar_money_array($1::text) INTO money_arr;
  IF money_arr IS NULL THEN
    RAISE EXCEPTION '% cannot be cast to mathesar_types.mathesar_money', $1;
  END IF;
  SELECT money_arr[1] INTO money_num;
  SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
  IF money_arr[2] IS NOT NULL THEN
    SELECT regexp_replace(money_num, money_arr[2], '', 'gq') INTO money_num;
  END IF;
  IF money_arr[3] IS NOT NULL THEN
    SELECT regexp_replace(money_num, money_arr[3], decimal_point, 'q') INTO money_num;
  END IF;
  RETURN money_num::mathesar_types.mathesar_money;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_money(money)
RETURNS mathesar_types.mathesar_money AS $$
DECLARE
  decimal_point text;
  is_negative boolean;
  money_arr text[];
  money_num text;
BEGIN
  SELECT msar.get_mathesar_money_array($1::text) INTO money_arr;
  IF money_arr IS NULL THEN
    RAISE EXCEPTION '% cannot be cast to mathesar_types.mathesar_money', $1;
  END IF;
  SELECT money_arr[1] INTO money_num;
  SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
  IF money_arr[2] IS NOT NULL THEN
    SELECT regexp_replace(money_num, money_arr[2], '', 'gq') INTO money_num;
  END IF;
  IF money_arr[3] IS NOT NULL THEN
    SELECT regexp_replace(money_num, money_arr[3], decimal_point, 'q') INTO money_num;
  END IF;
  RETURN money_num::mathesar_types.mathesar_money;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION
msar.cast_to_mathesar_money(num text, group_sep "char", decimal_p "char", curr_pref text, curr_suff text)
RETURNS mathesar_types.mathesar_money AS $$
  SELECT CASE WHEN num ~ '^.*(-|\(.+\)).*$' THEN -- Handle negative values
    ('-' || replace(replace(replace(replace(replace(replace(replace(num, '-', ''), '(', ''), ')', ''), curr_pref, ''), curr_suff, ''), group_sep, ''), decimal_p, ltrim(to_char(1, 'D'), ' ')))::mathesar_types.mathesar_money
  ELSE
    replace(replace(replace(replace(num, curr_pref, ''), curr_suff, ''), group_sep, ''), decimal_p, ltrim(to_char(1, 'D'), ' '))::mathesar_types.mathesar_money
  END;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


-- msar.cast_to_money

CREATE OR REPLACE FUNCTION msar.cast_to_money(money) RETURNS money AS $$
  SELECT $1::money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_money(real) RETURNS money AS $$
  SELECT $1::numeric::money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_money(bigint) RETURNS money AS $$
  SELECT $1::numeric::money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_money(double precision) RETURNS money AS $$
  SELECT $1::numeric::money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_money(numeric) RETURNS money AS $$
  SELECT $1::numeric::money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_money(text) RETURNS money AS $$
DECLARE
  currency text;
BEGIN
  SELECT to_char(1, 'L') INTO currency;
  IF ($1 LIKE '%' || currency) OR ($1 LIKE currency || '%') THEN
    RETURN $1::money;
  END IF;
  RAISE EXCEPTION '% cannot be cast to money as currency symbol is missing', $1;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- msar.cast_to_multicurrency_money

CREATE OR REPLACE FUNCTION msar.cast_to_multicurrency_money(mathesar_types.multicurrency_money)
RETURNS mathesar_types.multicurrency_money AS $$
  SELECT $1::mathesar_types.multicurrency_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_multicurrency_money(real)
RETURNS mathesar_types.multicurrency_money AS $$
  SELECT ROW($1, 'USD')::mathesar_types.multicurrency_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_multicurrency_money(bigint)
RETURNS mathesar_types.multicurrency_money AS $$
  SELECT ROW($1, 'USD')::mathesar_types.multicurrency_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_multicurrency_money(double precision)
RETURNS mathesar_types.multicurrency_money AS $$
  SELECT ROW($1, 'USD')::mathesar_types.multicurrency_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_multicurrency_money(numeric)
RETURNS mathesar_types.multicurrency_money AS $$
  SELECT ROW($1, 'USD')::mathesar_types.multicurrency_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_multicurrency_money(text)
RETURNS mathesar_types.multicurrency_money AS $$
  SELECT ROW($1, 'USD')::mathesar_types.multicurrency_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_multicurrency_money(money)
RETURNS mathesar_types.multicurrency_money AS $$
  SELECT ROW($1, 'USD')::mathesar_types.multicurrency_money;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_character_varying

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(time without time zone)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(bigint)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(double precision)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(mathesar_types.multicurrency_money)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(time with time zone)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(real)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(tsvector)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(jsonb)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(interval)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(macaddr)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(timestamp with time zone)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(inet)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(boolean)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(int4range)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(tstzrange)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(regclass)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(tsrange)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(numrange)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(cidr)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(numeric)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(bit)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(money)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(int8range)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(oid)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(json)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(daterange)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(timestamp without time zone)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(bytea)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(date)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(text)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character_varying(uuid)
RETURNS character varying AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_character

CREATE OR REPLACE FUNCTION msar.cast_to_character(time without time zone)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(bigint)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(double precision)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(mathesar_types.multicurrency_money)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(time with time zone)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(real)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(tsvector)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(jsonb)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(interval)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(macaddr)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(timestamp with time zone)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(inet)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(boolean)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(int4range)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(tstzrange)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(regclass)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(tsrange)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(numrange)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(cidr)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(numeric)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(bit)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(money)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(int8range)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(oid)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(json)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(daterange)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(timestamp without time zone)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(bytea)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(date)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(text)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_character(uuid)
RETURNS character AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to__double_quote_char_double_quote_

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(time without time zone)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(bigint)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(double precision)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(mathesar_types.multicurrency_money)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(time with time zone)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(real)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(tsvector)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(jsonb)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(interval)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(macaddr)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(timestamp with time zone)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(inet)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(boolean)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(int4range)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(tstzrange)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(regclass)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(tsrange)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(numrange)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(cidr)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(numeric)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(bit)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(money)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(int8range)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(oid)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(json)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(daterange)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(timestamp without time zone)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(bytea)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(date)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(text)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to__double_quote_char_double_quote_(uuid)
RETURNS "char" AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_text

CREATE OR REPLACE FUNCTION msar.cast_to_text(time without time zone)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(bigint)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(double precision)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(mathesar_types.multicurrency_money)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(time with time zone)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(real)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(tsvector)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(jsonb)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(interval)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(macaddr)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(timestamp with time zone)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(inet)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(boolean)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(int4range)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(tstzrange)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(regclass)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(tsrange)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(numrange)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(cidr)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(numeric)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(bit)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(money)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(int8range)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(oid)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(json)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(daterange)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(timestamp without time zone)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(bytea)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(date)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(text)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_text(uuid)
RETURNS text AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_name

CREATE OR REPLACE FUNCTION msar.cast_to_name(time without time zone)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(bigint)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(double precision)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(mathesar_types.multicurrency_money)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(time with time zone)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(real)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(tsvector)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(jsonb)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(interval)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(macaddr)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(timestamp with time zone)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(inet)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(boolean)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(int4range)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(tstzrange)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(regclass)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(tsrange)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(numrange)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(cidr)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(numeric)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(bit)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(money)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(int8range)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(oid)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(json)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(daterange)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(timestamp without time zone)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(bytea)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(date)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(text)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_name(uuid)
RETURNS name AS $$
  SELECT $1::text;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_uri

CREATE OR REPLACE FUNCTION msar.cast_to_uri(text)
RETURNS mathesar_types.uri AS $$
DECLARE
  uri_res mathesar_types.uri := 'https://mathesar.org';
  uri_tld text;
BEGIN
  RETURN $1::mathesar_types.uri;
  EXCEPTION WHEN SQLSTATE '23514' THEN
    SELECT lower(('http://' || $1)::mathesar_types.uri) INTO uri_res;
    SELECT (regexp_match(msar.uri_authority(uri_res), '(?<=\.)(?:.(?!\.))+$'))[1]
      INTO uri_tld;
    IF EXISTS(SELECT 1 FROM msar.top_level_domains WHERE tld = uri_tld) THEN
      RETURN uri_res;
    END IF;
  RAISE EXCEPTION '% is not a mathesar_types.uri', $1;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- msar.cast_to_numeric

CREATE OR REPLACE FUNCTION msar.get_numeric_array(text) RETURNS text[] AS $$
  DECLARE
    raw_arr text[];
    actual_number_arr text[];
    group_divider_arr text[];
    decimal_point_arr text[];
    actual_number text;
    group_divider text;
    decimal_point text;
  BEGIN
    SELECT regexp_matches($1, '^(?:[+-]?([0-9]{4,}(?:([,.])[0-9]+)?|[0-9]{1,3}(?:([,.])[0-9]{1,2}|[0-9]{4,})?|[0-9]{1,3}(,)[0-9]{3}(\.)[0-9]+|[0-9]{1,3}(\.)[0-9]{3}(,)[0-9]+|[0-9]{1,3}(?:(,)[0-9]{3}){2,}(?:(\.)[0-9]+)?|[0-9]{1,3}(?:(\.)[0-9]{3}){2,}(?:(,)[0-9]+)?|[0-9]{1,3}(?:( )[0-9]{3})+(?:([,.])[0-9]+)?|[0-9]{1,2}(?:(,)[0-9]{2})+,[0-9]{3}(?:(\.)[0-9]+)?|[0-9]{1,3}(?:(\'')[0-9]{3})+(?:([.])[0-9]+)?))$') INTO raw_arr;
    IF raw_arr IS NULL THEN
      RETURN NULL;
    END IF;
    SELECT array_remove(ARRAY[raw_arr[1]], null) INTO actual_number_arr;
    SELECT array_remove(ARRAY[raw_arr[4],raw_arr[6],raw_arr[8],raw_arr[10],raw_arr[12],raw_arr[14],raw_arr[16]], null) INTO group_divider_arr;
    SELECT array_remove(ARRAY[raw_arr[2],raw_arr[3],raw_arr[5],raw_arr[7],raw_arr[9],raw_arr[11],raw_arr[13],raw_arr[15],raw_arr[17]], null) INTO decimal_point_arr;
    SELECT actual_number_arr[1] INTO actual_number;
    SELECT group_divider_arr[1] INTO group_divider;
    SELECT decimal_point_arr[1] INTO decimal_point;
    RETURN ARRAY[actual_number, group_divider, decimal_point];
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION msar.cast_to_numeric(real) RETURNS numeric AS $$
  SELECT $1::numeric;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_numeric(bigint) RETURNS numeric AS $$
  SELECT $1::numeric;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_numeric(double precision) RETURNS numeric AS $$
  SELECT $1::numeric;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_numeric(numeric) RETURNS numeric AS $$
  SELECT $1::numeric;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_numeric(money) RETURNS numeric AS $$
  SELECT $1::numeric;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_numeric(text) RETURNS numeric AS $$
DECLARE
  decimal_point text;
  is_negative boolean;
  numeric_arr text[];
  numeric text;
BEGIN
  SELECT msar.get_numeric_array($1::text) INTO numeric_arr;
  IF numeric_arr IS NULL THEN
    RAISE EXCEPTION '% cannot be cast to numeric', $1;
  END IF;
  SELECT numeric_arr[1] INTO numeric;
  SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
  SELECT $1::text ~ '^-.*$' INTO is_negative;
  IF numeric_arr[2] IS NOT NULL THEN
    SELECT regexp_replace(numeric, numeric_arr[2], '', 'gq') INTO numeric;
  END IF;
  IF numeric_arr[3] IS NOT NULL THEN
    SELECT regexp_replace(numeric, numeric_arr[3], decimal_point, 'q') INTO numeric;
  END IF;
  IF is_negative THEN
    RETURN ('-' || numeric)::numeric;
  END IF;
  RETURN numeric::numeric;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.cast_to_numeric(num text, group_sep "char", decimal_p "char") RETURNS numeric AS $$/*
Cast to numeric with prechosen group and decimal separators.

For performance, this function does not check for correctness of the given number format. It simply
replaces and removes characters as directed, then attempts to cast to numeric.

Args:
  num: The string we'll cast to numeric.
  group_sep: Any instance of this character will be removed from `num` before casting.
  decimal_p: Any instance of this character will be replaced with the locale decimal before casting.
*/
SELECT replace(replace(num, group_sep, ''), decimal_p, ltrim(to_char(1, 'D'), ' '))::numeric;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.cast_to_numeric(boolean) RETURNS numeric AS $$
  SELECT CASE WHEN $1 THEN 1::numeric ELSE 0::numeric END;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_jsonb

CREATE OR REPLACE FUNCTION msar.cast_to_jsonb(json)
RETURNS jsonb AS $$
  SELECT $1::jsonb;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_jsonb(jsonb)
RETURNS jsonb AS $$
  SELECT $1::jsonb;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_jsonb(text)
RETURNS jsonb AS $$
  SELECT $1::jsonb;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_mathesar_json_array

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_json_array(json)
RETURNS mathesar_types.mathesar_json_array AS $$
  SELECT $1::mathesar_types.mathesar_json_array;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_json_array(jsonb)
RETURNS mathesar_types.mathesar_json_array AS $$
  SELECT $1::mathesar_types.mathesar_json_array;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_json_array(text)
RETURNS mathesar_types.mathesar_json_array AS $$
  SELECT $1::mathesar_types.mathesar_json_array;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_mathesar_json_object

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_json_object(json)
RETURNS mathesar_types.mathesar_json_object AS $$
  SELECT $1::mathesar_types.mathesar_json_object;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_json_object(jsonb)
RETURNS mathesar_types.mathesar_json_object AS $$
  SELECT $1::mathesar_types.mathesar_json_object;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_mathesar_json_object(text)
RETURNS mathesar_types.mathesar_json_object AS $$
  SELECT $1::mathesar_types.mathesar_json_object;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;


-- msar.cast_to_json

CREATE OR REPLACE FUNCTION msar.cast_to_json(json)
RETURNS json AS $$
  SELECT $1::json;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_json(jsonb)
RETURNS json AS $$
  SELECT $1::json;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_json(text)
RETURNS json AS $$
  SELECT $1::json;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

-- msar.cast_to_uuid

CREATE OR REPLACE FUNCTION msar.cast_to_uuid(text)
RETURNS uuid AS $$
  SELECT $1::uuid;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION msar.cast_to_uuid(uuid)
RETURNS uuid AS $$
  SELECT $1::uuid;
$$ LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
