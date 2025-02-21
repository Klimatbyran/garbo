import { PrismaClient } from '@prisma/client'
import { inspect } from 'util';
import {wikidataService} from "../src/api/services/wikidataService";
import wikidataConfig from "../src/config/wikidata";
import { exit } from 'process';

//Currently still in testing the filters filter out only data related to ABB as this company is present in the Sandbox
console.log(wikidataConfig)
//exit(0);

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
    }
})

let filtered1 = emissionsScope1.filter((emission) => emission.emissions?.reportingPeriod?.company.wikidataId === "Q731938");

for(const emission of filtered1) {
    if(emission.total !== null && emission.unit !== null && emission.emissions !== null
        && emission.emissions!.reportingPeriod !== null && emission.emissions!.reportingPeriod!.startDate !== null
        && emission.emissions!.reportingPeriod!.endDate !== null && emission.emissions!.reportingPeriod!.reportURL !== null
        && emission.emissions!.reportingPeriod!.company !== null && emission.emissions!.reportingPeriod!.company!.wikidataId !== null) {
        
        await wikidataService.createOrEditCarbonFootprintClaim(emission.emissions!.reportingPeriod!.company!.wikidataId as `Q${number}` as `Q${number}`, emission.emissions!.reportingPeriod!.startDate, emission.emissions!.reportingPeriod!.endDate,
            emission.total!.toString(), emission.emissions!.reportingPeriod!.reportURL!, wikidataConfig.entities.SCOPE_1);        
        
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
    }
})

let filtered2 = emissionsScope2.filter((emission) => emission.emissions?.reportingPeriod?.company.wikidataId === "Q731938");

for(const emission of filtered2) {
    if(emission.unit !== null && emission.emissions !== null
        && emission.emissions!.reportingPeriod !== null && emission.emissions!.reportingPeriod!.startDate !== null
        && emission.emissions!.reportingPeriod!.endDate !== null && emission.emissions!.reportingPeriod!.reportURL !== null
        && emission.emissions!.reportingPeriod!.company !== null && emission.emissions!.reportingPeriod!.company!.wikidataId !== null) {
        
        if(emission.mb !== null) {
            await wikidataService.createOrEditCarbonFootprintClaim(emission.emissions!.reportingPeriod!.company!.wikidataId as `Q${number}`, emission.emissions!.reportingPeriod!.startDate, emission.emissions!.reportingPeriod!.endDate,
            emission.mb!.toString(), emission.emissions!.reportingPeriod!.reportURL!, wikidataConfig.entities.SCOPE_2_MARKET_BASED);
        }

        if(emission.lb !== null) {
            await wikidataService.createOrEditCarbonFootprintClaim(emission.emissions!.reportingPeriod!.company!.wikidataId as `Q${number}`, emission.emissions!.reportingPeriod!.startDate, emission.emissions!.reportingPeriod!.endDate,
            emission.lb!.toString(), emission.emissions!.reportingPeriod!.reportURL!, wikidataConfig.entities.SCOPE_2_LOCATION_BASED);
        }

        if(emission.unknown !== null) {
            await wikidataService.createOrEditCarbonFootprintClaim(emission.emissions!.reportingPeriod!.company!.wikidataId as `Q${number}`, emission.emissions!.reportingPeriod!.startDate, emission.emissions!.reportingPeriod!.endDate,
            emission.unknown!.toString(), emission.emissions!.reportingPeriod!.reportURL!, wikidataConfig.entities.SCOPE_2);
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
    }
})

let filtered3 = emissionsScope3.filter((emission) => emission.scope3.emissions?.reportingPeriod?.company.wikidataId === "Q731938");

for(const emission of filtered3) {
    if(emission.unit !== null && emission.scope3 !== null && emission.scope3.emissions !== null 
        && emission.scope3.emissions!.reportingPeriod !== null && emission.scope3.emissions!.reportingPeriod!.startDate !== null
        && emission.scope3.emissions!.reportingPeriod!.endDate !== null && emission.scope3.emissions!.reportingPeriod!.reportURL !== null
        && emission.scope3.emissions!.reportingPeriod!.company !== null && emission.scope3.emissions!.reportingPeriod!.company!.wikidataId !== null) {


        await wikidataService.createOrEditCarbonFootprintClaim(emission.scope3.emissions!.reportingPeriod!.company!.wikidataId as `Q${number}`, emission.scope3!.emissions!.reportingPeriod!.startDate, emission.scope3!.emissions!.reportingPeriod!.endDate,
        emission.total!.toString(), emission.scope3!.emissions!.reportingPeriod!.reportURL!, wikidataConfig.entities.SCOPE_3, wikidataConfig.translateIdToCategory(emission.category) );               
    }
}