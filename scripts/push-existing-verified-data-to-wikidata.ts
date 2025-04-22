import { PrismaClient } from '@prisma/client'
import wikidataConfig from "../src/config/wikidata";
import { bulkCreateOrEditCarbonFootprintClaim, Claim, diffTotalCarbonFootprintClaims, editEntity, getClaims, transformEmissionsToClaims } from '../src/lib/wikidata';
import { exit } from 'process';

//Currently still in testing the filters filter out only data related to ABB as this company is present in the Sandbox
const entityDownloadId: `Q${number}` = "Q731938";
const entityUploadId: `Q${number}` = "Q238689";

/*const entityIds: `Q${number}`[] = ["Q60967616","Q1028092","Q65196379","Q109773651",
    "Q52579","Q187854","Q1537811","Q163810","Q674575","Q10429580","Q10434929","Q106625550","Q109974149","Q10521828","Q1467848","Q1663776","Q10535401",
    "Q1671804","Q188326","Q1421630","Q15702556","Q63993633","Q6460556","Q18541785","Q558699","Q1123823","Q10660042","Q62233","Q1145493","Q52825",
    "Q106627314","Q10400997","Q10403939","Q686030","Q1785637","Q757164","Q5028809","Q10443590","Q3366005","Q10605629","Q1753718","Q52601",
    "Q747265","Q115167531","Q1389894","Q10686298","Q7654795","Q2084093","Q862303","Q157675","Q792486","Q106684510","Q10474816","Q5290243",
    "Q505922","Q52618","Q105965579","Q1390136","Q10494308","Q106647141","Q3121401","Q106625028","Q1640495","Q662174","Q22077794","Q3377840",
    "Q5362569","Q56300993","Q28836696","Q10453247","Q10398203","Q115168501","Q3385738","Q18287037","Q106627925","Q26794821","Q113465911","Q11853322",
    "Q10427771","Q10423854","Q96756335","Q130366912","Q10438182","Q106629013","Q10540600","Q10443838","Q106634027","Q10485218","Q10509721","Q30295686",
    "Q4914620","Q25387724","Q27680773","Q5055199","Q115167139","Q3356220","Q3437039","Q10457644","Q115167261","Q115167084","Q28808759","Q10477559",
    "Q1141671","Q115167495","Q10720882","Q10559602","Q106618377","Q3270281","Q106625326","Q106580668","Q130366927","Q1341066","Q10484125","Q10492869",
    "Q101416961","Q130366931","Q56300749","Q28836372","Q106640661","Q91016795","Q1059840","Q130367235","Q10536452","Q106626770","Q28836462","Q3177392",
    "Q30256485","Q106625885","Q115167405","Q30086040","Q10546722","Q109780665","Q115167469","Q115168499","Q10658096","Q106574109","Q61932343",
    "Q38168829","Q4573584","Q106282881","Q12004589","Q106594863","Q5464603","Q4836728","Q131413576","Q4345789","Q10501780","Q109815145","Q115167534",
    "Q124252447","Q49095689","Q130367254","Q114221082","Q106594396","Q130367296","Q55391931","Q627577","Q78584553","Q7050718","Q49103488","Q10603350",
    "Q267558","Q6060751","Q30292201","Q10638710","Q43895238","Q23044729","Q28449044","Q4356015","Q10657333","Q110086919","Q6696047","Q106508167",
    "Q131412873","Q20164918","Q11888870","Q129391","Q115167277","Q56301122","Q115167486","Q131394677","Q1571428","Q28228137","Q130366452",
    "Q115167515","Q18370893","Q10684798","Q7476318","Q662664","Q11977084","Q253423","Q131424920","Q131426217","Q130367306","Q7315107","Q10674550",
    "Q10397786","Q671398","Q10461247","Q106626934","Q10719187","Q10720019","Q30289762","Q17102820","Q109790098","Q130367275","Q98602838","Q3429427",
    "Q738421","Q106564093","Q10429829","Q10590357","Q975655","Q18287127","Q130366922","Q5318875","Q1657823","Q115167526","Q109780258","Q10397672",
    "Q115112945","Q111843935","Q891345","Q65083539","Q47498532","Q1275733","Q10494668","Q1337240","Q10600264","Q52912","Q16427839","Q65196792",
    "Q1324884","Q130366928","Q10599821","Q215293","Q24882789","Q51581693","Q10651354"];

for(const entityId of entityIds) {
    console.log(entityId);
    const {newClaims, rmClaims} = await diffTotalCarbonFootprintClaims([], await getClaims(entityId), []);   
    await editEntity(entityId, newClaims, rmClaims);
}
exit(0);*/

const prisma = new PrismaClient()

const reportingPeriods = await prisma.reportingPeriod.findMany({
    include: {
        emissions: {
          include: {
            scope1: {
              include: {
                metadata: true,
              },
            },
            scope2: {
              include: {
                metadata: true,
              },
            },
            scope3: {
              include: {
                categories: {
                    include: {
                        metadata: true
                    }
                }
              },
            }
          },
        },
        company: true
    },
    where: {
        emissions: {reportingPeriod: {year: "2023"}}
    }
});

const result = reportingPeriods.map((reportingPeriod) => ({
    ...reportingPeriod,
    emissions: reportingPeriod.emissions && {
        ...reportingPeriod.emissions,
        scope1: reportingPeriod.emissions.scope1?.metadata.some(
            (meta) => meta.verifiedByUserId
        ) ? {
            ...reportingPeriod.emissions.scope1,
        } : undefined,
        scope2: reportingPeriod.emissions.scope2?.metadata.some(
            (meta) => meta.verifiedByUserId
        ) ? {
            ...reportingPeriod.emissions.scope2,
        } : undefined,
        scope3: reportingPeriod.emissions.scope3
        ? {
            ...reportingPeriod.emissions.scope3,
            categories: [
                reportingPeriod.emissions.scope3.categories.reduce((categoryArray, category) => {
                    if(category.metadata.some(
                        (meta) => meta.verifiedByUserId
                    )) {
                        categoryArray.push(category);
                    }
                    return categoryArray;
                }, [] as any[])
            ]
          }
        : undefined,
    },
}));

for(const reportingPeriod of reportingPeriods) {
    if(reportingPeriod.emissions && reportingPeriod.reportURL && reportingPeriod.company.wikidataId === "Q47508289") {
        const claims = transformEmissionsToClaims(reportingPeriod.emissions, reportingPeriod.startDate.toISOString().replace('.000', ''), reportingPeriod.endDate.toISOString().replace('.000', ''), reportingPeriod.reportURL ?? "");
        if(claims.length > 0) {
            bulkCreateOrEditCarbonFootprintClaim(reportingPeriod.company.wikidataId as `Q${number}`, claims);
        }
    }
}
