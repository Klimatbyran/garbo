import { PrismaClient } from '@prisma/client'
import wikidataConfig from "../src/config/wikidata";
import { bulkCreateOrEditCarbonFootprintClaim, Claim, transformEmissionsToClaims } from '../src/lib/wikidata';
import { exit } from 'process';

//Currently still in testing the filters filter out only data related to ABB as this company is present in the Sandbox
const entityDownloadId: `Q${number}` = "Q731938";
const entityUploadId: `Q${number}` = "Q238689";

/*const entityIds: `Q${number}`[] = ["Q130367306", "Q7315107", "Q10674550", 
    "Q10397786", "Q671398", "Q10461247", "Q106626934", "Q10719187", 
    "Q10720019", "Q30289762", "Q17102820", "Q109790098", "Q130367275", 
    "Q98602838", "Q3429427", "Q738421", "Q106564093", "Q10429829", 
    "Q10590357", "Q975655", "Q18287127", "Q130366922", "Q5318875", 
    "Q1657823", "Q115167526", "Q109780258", "Q10397672", "Q115112945", 
    "Q111843935", "Q891345", "Q65083539", "Q47498532", "Q1275733", 
    "Q10494668", "Q1337240", "Q10600264", "Q52912", "Q16427839", 
    "Q65196792", "Q1324884", "Q130366928", "Q10599821", "Q215293", 
    "Q24882789", "Q51581693", "Q10651354"
];

for(const entityId of entityIds) {
    const {newClaims, rmClaims} = await diffTotalCarbonFootprintClaims([], await getClaims(entityId), []);
    console.log(newClaims);
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
