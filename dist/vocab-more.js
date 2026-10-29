// 추가 영단어. [영어, 뜻(여러 개는 |로 구분), 단계]
// 단계: e=초등, m=중등, h=고등, i=중급, a=고급
// 뜻은 띄어쓰기를 무시하고 비교해요. "~" 같은 기호는 넣지 않아요.
const MORE_WORDS=[
// ---------- 초등 ----------
['egg','달걀|계란','e'],['milk','우유','e'],['bread','빵','e'],['rice','쌀|밥','e'],['cake','케이크','e'],
['ball','공','e'],['bag','가방','e'],['box','상자|박스','e'],['cup','컵|잔','e'],['pen','펜','e'],
['hat','모자','e'],['shoe','신발|구두','e'],['bed','침대','e'],['car','자동차|차','e'],['bus','버스','e'],
['ship','배|선박','e'],['train','기차|열차','e'],['hand','손','e'],['foot','발','e'],['head','머리','e'],
['eye','눈','e'],['ear','귀','e'],['nose','코','e'],['mouth','입','e'],['face','얼굴','e'],
['leg','다리','e'],['red','빨간|빨간색|빨강','e'],['blue','파란|파란색|파랑','e'],['green','초록|초록색|녹색','e'],['white','흰|하얀|흰색|하얀색','e'],
['black','검은|검은색|검정','e'],['cold','차가운|추운','e'],['hot','뜨거운|더운','e'],['long','긴','e'],['tall','키가큰|키큰|높은','e'],
['sing','노래하다|노래부르다','e'],['swim','수영하다|헤엄치다','e'],['jump','뛰다|점프하다|뛰어오르다','e'],['play','놀다|경기하다|연주하다','e'],['laugh','웃다','e'],
['sit','앉다','e'],['stand','서다|서있다','e'],['come','오다','e'],['go','가다','e'],['like','좋아하다','e'],
['buy','사다|구입하다','e'],['baby','아기','e'],['boy','소년|남자아이','e'],['girl','소녀|여자아이','e'],['king','왕','e'],

// ---------- 중등 ----------
['breakfast','아침식사|아침밥|아침','m'],['lunch','점심|점심식사','m'],['dinner','저녁|저녁식사','m'],['kitchen','부엌|주방','m'],['garden','정원','m'],
['library','도서관','m'],['hospital','병원','m'],['market','시장','m'],['office','사무실','m'],['island','섬','m'],
['forest','숲|산림','m'],['lake','호수','m'],['weather','날씨','m'],['season','계절','m'],['holiday','휴일|휴가|공휴일','m'],
['travel','여행하다|여행','m'],['letter','편지|글자|문자','m'],['ticket','표|티켓|입장권','m'],['price','가격|값','m'],['habit','습관','m'],
['voice','목소리|음성','m'],['smile','미소|미소짓다|웃다','m'],['borrow','빌리다','m'],['lend','빌려주다','m'],['carry','나르다|운반하다|들고가다','m'],
['catch','잡다','m'],['throw','던지다','m'],['cook','요리하다|요리사','m'],['clean','청소하다|깨끗한','m'],['wash','씻다|빨다','m'],
['push','밀다','m'],['pull','당기다|끌다','m'],['sell','팔다|판매하다','m'],['send','보내다','m'],['teach','가르치다','m'],
['win','이기다|승리하다','m'],['lose','지다|잃다|잃어버리다','m'],['forget','잊다|잊어버리다','m'],['hurry','서두르다','m'],['brave','용감한','m'],
['honest','정직한|솔직한','m'],['lazy','게으른','m'],['hungry','배고픈','m'],['thirsty','목마른','m'],['tired','피곤한|지친','m'],
['lucky','운이좋은|행운의','m'],['rich','부유한|부자인|풍부한','m'],['poor','가난한|불쌍한','m'],['cheap','싼|저렴한','m'],['heavy','무거운','m'],
['empty','빈|비어있는|텅빈','m'],['dirty','더러운','m'],['sweet','달콤한|단|달다','m'],['clever','영리한|똑똑한','m'],['strange','이상한|낯선','m'],

// ---------- 고등 ----------
['opinion','의견','h'],['purpose','목적','h'],['effort','노력','h'],['goal','목표|골','h'],['memory','기억|추억|기억력','h'],
['nature','자연|본성','h'],['society','사회','h'],['tradition','전통','h'],['festival','축제','h'],['journey','여행|여정','h'],
['courage','용기','h'],['patience','인내|인내심','h'],['secret','비밀','h'],['danger','위험','h'],['victory','승리','h'],
['distance','거리','h'],['direction','방향|지시','h'],['method','방법','h'],['object','물체|물건|사물|목적','h'],['signal','신호','h'],
['damage','피해|손상|손해','h'],['period','기간|시기|시대','h'],['region','지역','h'],['surface','표면','h'],['weight','무게|체중','h'],
['material','재료|물질|자료','h'],['quality','질|품질','h'],['describe','묘사하다|설명하다','h'],['discuss','토론하다|논의하다','h'],['suggest','제안하다','h'],
['improve','개선하다|향상시키다|나아지다','h'],['reduce','줄이다|감소시키다','h'],['avoid','피하다','h'],['collect','모으다|수집하다','h'],['connect','연결하다','h'],
['receive','받다','h'],['deliver','배달하다|전달하다','h'],['respect','존경하다|존중하다|존경','h'],['support','지지하다|지원하다|지지|지원','h'],['prefer','선호하다|더좋아하다','h'],
['celebrate','축하하다|기념하다','h'],['complain','불평하다','h'],['apologize','사과하다','h'],['curious','호기심많은|궁금한|호기심있는','h'],['nervous','긴장한|불안한','h'],
['polite','예의바른|공손한','h'],['proud','자랑스러운|자랑스러워하는','h'],['gentle','온화한|부드러운|친절한','h'],['ancient','고대의|아주오래된','h'],['foreign','외국의','h'],
['huge','거대한|엄청난','h'],['narrow','좁은','h'],['wide','넓은','h'],['deep','깊은','h'],['suddenly','갑자기','h'],
['nearly','거의','h'],['exactly','정확히|정확하게','h'],

// ---------- 중급 ----------
['environment','환경','i'],['pollution','오염|공해','i'],['resource','자원','i'],['economy','경제','i'],['government','정부','i'],
['election','선거','i'],['citizen','시민','i'],['population','인구','i'],['technology','기술|과학기술','i'],['invention','발명|발명품','i'],
['research','연구|연구하다|조사','i'],['evidence','증거','i'],['theory','이론','i'],['solution','해결책|해법|해결','i'],['influence','영향|영향을미치다','i'],
['advantage','장점|이점','i'],['disadvantage','단점|불리한점','i'],['relationship','관계','i'],['opportunity','기회','i'],['competition','경쟁|대회|시합','i'],
['agriculture','농업','i'],['emotion','감정','i'],['attitude','태도','i'],['behavior','행동|태도','i'],['achievement','성취|업적|성과','i'],
['generation','세대','i'],['analyze','분석하다','i'],['predict','예측하다|예상하다','i'],['persuade','설득하다','i'],['encourage','격려하다|장려하다|용기를주다','i'],
['recognize','인식하다|알아보다|인정하다','i'],['require','요구하다|필요로하다','i'],['maintain','유지하다','i'],['establish','설립하다|확립하다','i'],['contribute','기여하다|공헌하다','i'],
['participate','참여하다|참가하다','i'],['consider','고려하다|생각하다','i'],['determine','결정하다|알아내다','i'],['emphasize','강조하다','i'],['observe','관찰하다|준수하다','i'],
['efficient','효율적인|능률적인','i'],['essential','필수적인|본질적인','i'],['obvious','명백한|분명한','i'],['available','이용가능한|구할수있는|이용할수있는','i'],['appropriate','적절한|알맞은','i'],
['various','다양한|여러가지의','i'],['typical','전형적인|일반적인','i'],['negative','부정적인','i'],['positive','긍정적인','i'],['significant','중요한|상당한|의미있는','i'],
['independent','독립적인|독립한','i'],['actually','실제로|사실은|사실','i'],['eventually','결국|마침내','i'],['frequently','자주|빈번히','i'],['gradually','점차|점점|서서히','i'],
['recently','최근에|요즘','i'],['deal with','다루다|처리하다','i'],['depend on','의존하다|달려있다|에달려있다','i'],['take part in','참여하다|참가하다','i'],['run out of','다쓰다|바닥나다|떨어지다','i'],
['get along with','잘지내다|사이좋게지내다','i'],['put off','미루다|연기하다','i'],['come up with','생각해내다|떠올리다','i'],

// ---------- 고급 ----------
['phenomenon','현상','a'],['hypothesis','가설','a'],['consequence','결과|영향','a'],['perspective','관점|시각|견해','a'],['controversy','논란|논쟁','a'],
['democracy','민주주의','a'],['philosophy','철학','a'],['psychology','심리학|심리','a'],['architecture','건축|건축학','a'],['civilization','문명','a'],
['circumstance','상황|환경|사정','a'],['inevitable','불가피한|피할수없는','a'],['ambiguous','모호한|애매한','a'],['comprehensive','포괄적인|종합적인','a'],['sophisticated','정교한|세련된','a'],
['substantial','상당한|실질적인','a'],['fundamental','근본적인|기본적인','a'],['spontaneous','자발적인|즉흥적인','a'],['reluctant','꺼리는|마지못한|주저하는','a'],['vulnerable','취약한|연약한|상처받기쉬운','a'],
['abundant','풍부한|많은','a'],['arbitrary','임의의|독단적인|제멋대로인','a'],['acknowledge','인정하다','a'],['anticipate','예상하다|기대하다','a'],['compensate','보상하다|보충하다','a'],
['deteriorate','악화되다|나빠지다','a'],['eliminate','제거하다|없애다','a'],['facilitate','촉진하다|용이하게하다|쉽게하다','a'],['implement','시행하다|실행하다|도구','a'],['interpret','해석하다|통역하다','a'],
['manipulate','조작하다|다루다','a'],['negotiate','협상하다|교섭하다','a'],['prohibit','금지하다','a'],['undermine','약화시키다|훼손하다','a'],['accommodate','수용하다|숙박시키다|맞추다','a'],
['consequently','결과적으로|따라서|그결과','a'],['nevertheless','그럼에도불구하고|그렇지만','a'],['furthermore','게다가|더욱이|또한','a'],['approximately','대략|약|거의','a'],['simultaneously','동시에','a'],
['in spite of','에도불구하고|불구하고','a'],['as a result','결과적으로|그결과','a'],['on the other hand','반면에|다른한편으로|한편','a'],['be responsible for','책임이있다|책임지다','a'],['take advantage of','이용하다|활용하다','a'],
['drive–drove–driven','운전하다|몰다','a'],['fly–flew–flown','날다|비행하다','a'],['forget–forgot–forgotten','잊다|잊어버리다','a'],['rise–rose–risen','오르다|일어나다|떠오르다','a'],['wear–wore–worn','입다|착용하다','a'],
['throw–threw–thrown','던지다','a'],['steal–stole–stolen','훔치다','a'],['hide–hid–hidden','숨다|숨기다','a'],
].map(([en,ko,t])=>({en,ko,type:'more',tier:{e:'elementary',m:'middle',h:'high',i:'intermediate',a:'advanced'}[t]}));
