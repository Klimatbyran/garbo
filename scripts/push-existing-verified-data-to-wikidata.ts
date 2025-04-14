import { PrismaClient } from '@prisma/client'
import wikidataConfig from "../src/config/wikidata";
import { bulkCreateOrEditCarbonFootprintClaim, Claim, diffTotalCarbonFootprintClaims, editEntity, getClaims } from '../src/lib/wikidata';
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

const emissionsScope1 = await prisma.scope1.findMany({
    select: {
        total: true,
        unit: true,
        metadata: {
            select: {
                verifiedByUserId: true
            }
        },
        emissions: {
            select: {
                reportingPeriod: {
                    select: {
                        startDate: true,
                        endDate: true,
                        reportURL: true,
                        company: {
                            select: {
                                wikidataId: true,
                            }
                        }
                    }
                }
            }
        },
    },
    where: {
        metadata: {some: {verifiedByUserId: {not: null}}},
        emissions: {reportingPeriod: {year: "2023"}}
    }
})
let claims: Claim[] = [];
let filtered1 = emissionsScope1.filter((emission) => emission.emissions?.reportingPeriod?.company.wikidataId === entityDownloadId);

for(const emission of filtered1) {
    if(emission.total !== null && emission.unit !== null && emission.emissions !== null
        && emission.emissions!.reportingPeriod !== null && emission.emissions!.reportingPeriod!.startDate !== null
        && emission.emissions!.reportingPeriod!.endDate !== null && emission.emissions!.reportingPeriod!.reportURL !== null
        && emission.emissions!.reportingPeriod!.company !== null && emission.emissions!.reportingPeriod!.company!.wikidataId !== null) {
        
        claims.push({
            startDate: emission.emissions!.reportingPeriod!.startDate.toISOString(),
            endDate: emission.emissions!.reportingPeriod!.endDate.toISOString(),
            value: emission.total!.toString(),
            referenceUrl: emission.emissions!.reportingPeriod!.reportURL!,
            scope: wikidataConfig.entities.SCOPE_1
        })   
    }
}


const emissionsScope2 = await prisma.scope2.findMany({
    select: {
        mb: true,
        lb: true,
        unknown: true,
        unit: true,
        metadata: {
            select: {
                verifiedByUserId: true
            }
        },
        emissions: {
            select: {
                reportingPeriod: {
                    select: {
                        startDate: true,
                        endDate: true,
                        reportURL: true,
                        company: {
                            select: {
                                wikidataId: true,
                            }
                        }
                    }
                }
            }
        },
    },
    where: {
        metadata: {some: {verifiedByUserId: {not: null}}},
        emissions: {reportingPeriod: {year: "2023"}}
        
    }
})

let filtered2 = emissionsScope2.filter((emission) => emission.emissions?.reportingPeriod?.company.wikidataId === entityDownloadId);

for(const emission of filtered2) {
    if(emission.unit !== null && emission.emissions !== null
        && emission.emissions!.reportingPeriod !== null && emission.emissions!.reportingPeriod!.startDate !== null
        && emission.emissions!.reportingPeriod!.endDate !== null && emission.emissions!.reportingPeriod!.reportURL !== null
        && emission.emissions!.reportingPeriod!.company !== null && emission.emissions!.reportingPeriod!.company!.wikidataId !== null) {
        
        if(emission.mb !== null) {
            claims.push({
                startDate: emission.emissions!.reportingPeriod!.startDate.toISOString(),
                endDate: emission.emissions!.reportingPeriod!.endDate.toISOString(),
                value: emission.mb!.toString(),
                referenceUrl: emission.emissions!.reportingPeriod!.reportURL!,
                scope: wikidataConfig.entities.SCOPE_2_MARKET_BASED
            }) 
        }

        if(emission.lb !== null) {
            claims.push({
                startDate: emission.emissions!.reportingPeriod!.startDate.toISOString(),
                endDate: emission.emissions!.reportingPeriod!.endDate.toISOString(),
                value: emission.lb!.toString(),
                referenceUrl: emission.emissions!.reportingPeriod!.reportURL!,
                scope: wikidataConfig.entities.SCOPE_2_LOCATION_BASED
            })
        }

        if(emission.unknown !== null) {
            claims.push({
                startDate: emission.emissions!.reportingPeriod!.startDate.toISOString(),
                endDate: emission.emissions!.reportingPeriod!.endDate.toISOString(),
                value: emission.unknown!.toString(),
                referenceUrl: emission.emissions!.reportingPeriod!.reportURL!,
                scope: wikidataConfig.entities.SCOPE_2
            })
        }                   
    }
}

const emissionsScope3 = await prisma.scope3Category.findMany({
    select: {
        total: true,
        unit: true,
        category: true,
        metadata: {
            select: {
                verifiedByUserId: true
            }
        },
        scope3: {
            select: {
                emissions: {
                    select: {
                        reportingPeriod: {
                            select: {
                                startDate: true,
                                endDate: true,
                                reportURL: true,
                                company: {
                                    select: {
                                        wikidataId: true,
                                    }
                                }
                            }
                        }
                    }
                },
            }
        }
    },
    where: {
        metadata: {some: {verifiedByUserId: {not: null}}},
        scope3: {emissions: {reportingPeriod: {year: "2023"}}}
    }
})

let filtered3 = emissionsScope3.filter((emission) => emission.scope3.emissions?.reportingPeriod?.company.wikidataId === entityDownloadId);

for(const emission of filtered3) {
    if(emission.unit !== null && emission.scope3 !== null && emission.scope3.emissions !== null 
        && emission.scope3.emissions!.reportingPeriod !== null && emission.scope3.emissions!.reportingPeriod!.startDate !== null
        && emission.scope3.emissions!.reportingPeriod!.endDate !== null && emission.scope3.emissions!.reportingPeriod!.reportURL !== null
        && emission.scope3.emissions!.reportingPeriod!.company !== null && emission.scope3.emissions!.reportingPeriod!.company!.wikidataId !== null) {
        
        if(emission.category !== 16) {
            claims.push({
                startDate: emission.scope3!.emissions!.reportingPeriod!.startDate.toISOString(),
                endDate: emission.scope3!.emissions!.reportingPeriod!.endDate.toISOString(),
                value: emission.total!.toString(),
                referenceUrl: emission.scope3!.emissions!.reportingPeriod!.reportURL!,
                scope: wikidataConfig.entities.SCOPE_3,
                category: wikidataConfig.translateIdToCategory(emission.category)
            })
        }           
    }
}
await bulkCreateOrEditCarbonFootprintClaim(entityUploadId, claims);