const industry = `
Extract industry, sector, industry group, according to NACE:

A AGRICULTURE, FORESTRY AND FISHING
  01 Crop and animal production, hunting and related service activities
  02 Forestry and logging
  03 Fishing and aquaculture
B MINING AND QUARRYING
  05 Mining of coal and lignite
  06 Extraction of crude petroleum and natural gas
  07 Mining of metal ores
  08 Other mining and quarrying
  09 Mining support service activities
C MANUFACTURING
  10 Manufacture of food products
  11 Manufacture of beverages
  12 Manufacture of tobacco products
  13 Manufacture of textiles
  14 Manufacture of wearing apparel
  15 Manufacture of leather and related products of other materials
  16 Manufacture of wood and of products of wood and cork, except furniture; manufacture of articles of straw and plaiting materials
  17 Manufacture of paper and paper products
  18 Printing and reproduction of recorded media
  19 Manufacture of coke and refined petroleum products
  20 Manufacture of chemicals and chemical products
  21 Manufacture of basic pharmaceutical products and pharmaceutical preparations
  22 Manufacture of rubber and plastic products
  23 Manufacture of other non-metallic mineral products
  24 Manufacture of basic metals
  25 Manufacture of fabricated metal products, except machinery and equipment
  26 Manufacture of computer, electronic and optical products
  27 Manufacture of electrical equipment
  28 Manufacture of machinery and equipment n.e.c.
  29 Manufacture of motor vehicles, trailers and semi-trailers
  30 Manufacture of other transport equipment
  31 Manufacture of furniture
  32 Other manufacturing
  33 Repair, maintenance and installation of machinery and equipment
D ELECTRICITY, GAS, STEAM AND AIR CONDITIONING SUPPLY
  35 Electricity, gas, steam and air conditioning supply
E WATER SUPPLY; SEWERAGE, WASTE MANAGEMENT AND REMEDIATION ACTIVITIES
  36 Water collection, treatment and supply
  37 Sewerage
  38 Waste collection, recovery and disposal activities
  39 Remediation activities and other waste management service activities
F CONSTRUCTION
  41 Construction of residential and non-residential buildings
  42 Civil engineering
  43 Specialised construction activities
G WHOLESALE AND RETAIL TRADE
  46 Wholesale trade
  47 Retail trade
H TRANSPORTATION AND STORAGE
  49 Land transport and transport via pipelines
  50 Water transport
  51 Air transport
  52 Warehousing, storage and support activities for transportation
  53 Postal and courier activities
I ACCOMMODATION AND FOOD SERVICE ACTIVITIES
  55 Accommodation
  56 Food and beverage service activities
J PUBLISHING, BROADCASTING, AND CONTENT PRODUCTION AND DISTRIBUTION ACTIVITIES
  58 Publishing activities
  59 Motion picture, video and television programme production, sound recording and music publishing activities
  60 Programming, broadcasting, news agency and other content distribution activities
K TELECOMMUNICATION, COMPUTER PROGRAMMING, CONSULTING, COMPUTING INFRASTRUCTURE AND OTHER INFORMATION SERVICE ACTIVITIES
  61 Telecommunication
  62 Computer programming, consultancy and related activities
  63 Computing infrastructure, data processing, hosting and other information service activities
L FINANCIAL AND INSURANCE ACTIVITIES
  64 Financial service activities, except insurance and pension funding
  65 Insurance, reinsurance and pension funding, except compulsory social security
  66 Activities auxiliary to financial services and insurance activities
M REAL ESTATE ACTIVITIES
  68 Real estate activities
N PROFESSIONAL, SCIENTIFIC AND TECHNICAL ACTIVITIES
  69 Legal and accounting activities
  70 Activities of head offices and management consultancy
  71 Architectural and engineering activities; technical testing and analysis
  72 Scientific research and development
  73 Activities of advertising, market research and public relations
  74 Other professional, scientific and technical activities
  75 Veterinary activities
O ADMINISTRATIVE AND SUPPORT SERVICE ACTIVITIES
  77 Rental and leasing activities
  78 Employment activities
  79 Travel agency, tour operator and other reservation service and related activities
  80 Investigation and security activities
  81 Services to buildings and landscape activities
  82 Office administrative, office support and other business support activities
P PUBLIC ADMINISTRATION AND DEFENCE; COMPULSORY SOCIAL SECURITY
  84 Public administration and defence; compulsory social security
Q EDUCATION
  85 Education
  85.1 Pre-primary education
  85.2 Primary education
  85.3 Secondary and post-secondary non-tertiary education
  85.4 Tertiary education
  85.5 Other education
  85.6 Educational support activities
R HUMAN HEALTH AND SOCIAL WORK ACTIVITIES
  86 Human health activities
  87 Residential care activities
  88 Social work activities without accommodation
S ARTS, SPORTS AND RECREATION
  90 Arts creation and performing arts activities
  91 Libraries, archives, museums and other cultural activities
  92 Gambling and betting activities
  93 Sports activities and amusement and recreation activities
T OTHER SERVICE ACTIVITIES
  94 Activities of membership organisations
  95 Repair and maintenance of computers, personal and household goods, and motor vehicles and motorcycles
  96 Personal service activities
U ACTIVITIES OF HOUSEHOLDS AS EMPLOYERS AND UNDIFFERENTIATED GOODS - AND SERVICE-PRODUCING ACTIVITIES OF HOUSEHOLDS FOR OWN USE
  97 Activities of households as employers of domestic personnel
  98 Undifferentiated goods- and service-producing activities of private households for own use
V ACTIVITIES OF EXTRATERRITORIAL ORGANISATIONS AND BODIES
  99 Activities of extraterritorial organisations and bodies

Just reply with the information in json format:

\`\`\`json
{
   "industry_nace": {
      "section": {
        "code": "C",
        "name": "Manufacturing"
      },
      "division": {
        "code": "10",
        "name": "Manufacture of food products"
      },
   }
 }
\`\`\`
`

export default industry
