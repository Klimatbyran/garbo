import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function removeDuplicatesFromScope3Category() {
    try {
      // Step 1: Find duplicate Scope3Category entries (same category and scope3Id)
      const duplicates = await prisma.$queryRaw<
        { scope3Id: string; category: number; ids: string[] }[]
      >(Prisma.sql`
        SELECT "scope3Id", "category", array_agg("id") AS ids
        FROM "Scope3Category"
        GROUP BY "scope3Id", "category"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { scope3Id, category, ids } = duplicate;
  
        console.log(`Processing duplicates for scope3Id=${scope3Id}, category=${category}`);
  
        // Step 2: Fetch all Metadata information for these IDs to find the newest entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { categoryId: { in: ids } },
          select: {
            id: true, // Metadata ID
            categoryId: true, // Scope3Category ID
            updatedAt: true, // Sort by this to find the newest entry
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for scope3Id=${scope3Id}, category=${category}. Skipping...`);
          continue;
        }
  
        // Step 3: The newest Metadata entry is the first item (due to descending order sorting)
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping Scope3Category with ID ${newestMetadata.categoryId} (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.categoryId)
        );
  
        // Step 4: Delete the duplicate Scope3Category entries
        await prisma.scope3Category.deleteMany({
          where: {
            id: {
              in: metadataToDelete
                .map((m) => m.categoryId)
                .filter((id): id is string => id !== null)
            },
          },
        });
      }
  
      console.log("Duplicate removal process completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates:", error);
    }
  }

  async function removeDuplicatesFromScope1() {
    try {
      // Step 1: Find duplicate Scope1 entries (same emissionsId)
      const duplicates = await prisma.$queryRaw<
        { emissionsId: string; ids: string[] }[]
      >(Prisma.sql`
        SELECT "emissionsId", array_agg("id") AS ids
        FROM "Scope1"
        WHERE "emissionsId" IS NOT NULL
        GROUP BY "emissionsId"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { emissionsId, ids } = duplicate;
  
        console.log(`Processing duplicates for emissionsId=${emissionsId}`);
  
        // Step 2: Fetch all Metadata information for these IDs to find the newest entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { scope1Id: { in: ids } },
          select: {
            id: true, // Metadata ID
            scope1Id: true, // Scope1 ID
            updatedAt: true, // Sort by this to find the newest entry
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for emissionsId=${emissionsId}. Skipping...`);
          continue;
        }
  
        // Step 3: The newest Metadata entry is the first item (due to descending order sorting)
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping Scope1 with ID ${newestMetadata.scope1Id} (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.scope1Id)
        );
  
        // Step 4: Delete the duplicate Scope1 entries
        await prisma.scope1.deleteMany({
          where: {
            id: { in: metadataToDelete
                .map((m) => m.scope1Id)
                .filter((id): id is string => id !== null)  }, // Delete duplicates
          },
        });
      }
  
      console.log("Duplicate removal process for Scope1 completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates from Scope1:", error);
    }
  }

  async function removeDuplicatesFromScope2() {
    try {
      // Step 1: Find duplicate Scope2 entries (same emissionsId)
      const duplicates = await prisma.$queryRaw<
        { emissionsId: string; ids: string[] }[]
      >(Prisma.sql`
        SELECT "emissionsId", array_agg("id") AS ids
        FROM "Scope2"
        WHERE "emissionsId" IS NOT NULL
        GROUP BY "emissionsId"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { emissionsId, ids } = duplicate;
  
        console.log(`Processing duplicates for emissionsId=${emissionsId}`);
  
        // Step 2: Fetch all Metadata information for these IDs to find the newest entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { scope2Id: { in: ids } },
          select: {
            id: true, // Metadata ID
            scope2Id: true, // Scope2 ID
            updatedAt: true, // Sort by this to find the newest entry
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for emissionsId=${emissionsId}. Skipping...`);
          continue;
        }
  
        // Step 3: The newest Metadata entry is the first item (due to descending order sorting)
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping Scope2 with ID ${newestMetadata.scope2Id} (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.scope2Id)
        );
  
        // Step 4: Delete the duplicate Scope2 entries
        await prisma.scope2.deleteMany({
          where: {
            id: { 
                in: metadataToDelete
                .map((m) => m.scope2Id)
                .filter((id): id is string => id !== null)  }, // Delete duplicates
          },
        });
      }
  
      console.log("Duplicate removal process for Scope2 completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates from Scope2:", error);
    }
  }

  async function removeDuplicatesFromScope1And2() {
    try {
      // Step 1: Find duplicate Scope1And2 entries (same emissionsId)
      const duplicates = await prisma.$queryRaw<
        { emissionsId: string; ids: string[] }[]
      >(Prisma.sql`
        SELECT "emissionsId", array_agg("id") AS ids
        FROM "Scope1And2"
        WHERE "emissionsId" IS NOT NULL
        GROUP BY "emissionsId"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { emissionsId, ids } = duplicate;
  
        console.log(`Processing duplicates for emissionsId=${emissionsId}`);
  
        // Step 2: Fetch Metadata information for these IDs to find the most recent entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { scope1And2Id: { in: ids } },
          select: {
            id: true, // Metadata ID
            scope1And2Id: true, // Scope1And2 ID
            updatedAt: true, // Sort by this field to find the newest entry
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for emissionsId=${emissionsId}. Skipping...`);
          continue;
        }
  
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping Scope1And2 with ID ${newestMetadata.scope1And2Id} (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.scope1And2Id)
        );
  
        // Step 4: Delete the duplicate Scope1And2 entries
        await prisma.scope1And2.deleteMany({
          where: {
            id: { in: metadataToDelete
                .map((m) => m.scope1And2Id)
                .filter((id): id is string => id !== null)  }, // Delete duplicates }, // Delete duplicates
          },
        });
      }
  
      console.log("Duplicate removal process for Scope1And2 completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates from Scope1And2:", error);
    }
  }

  async function removeDuplicatesFromBiogenicEmissions() {
    try {
      // Step 1: Find duplicate BiogenicEmissions entries (same emissionsId)
      const duplicates = await prisma.$queryRaw<
        { emissionsId: string; ids: string[] }[]
      >(Prisma.sql`
        SELECT "emissionsId", array_agg("id") AS ids
        FROM "BiogenicEmissions"
        WHERE "emissionsId" IS NOT NULL
        GROUP BY "emissionsId"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { emissionsId, ids } = duplicate;
  
        console.log(`Processing duplicates for emissionsId=${emissionsId}`);
  
        // Step 2: Fetch Metadata information for these IDs to find the most recent entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { biogenicEmissionsId: { in: ids } },
          select: {
            id: true, // Metadata ID
            biogenicEmissionsId: true, // BiogenicEmissions ID
            updatedAt: true, // Sort by this field to find the newest entry
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for emissionsId=${emissionsId}. Skipping...`);
          continue;
        }
  
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping BiogenicEmissions with ID ${newestMetadata.biogenicEmissionsId} (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.biogenicEmissionsId)
        );
  
        // Step 4: Delete the duplicate BiogenicEmissions entries
        await prisma.biogenicEmissions.deleteMany({
          where: {
            id: {in: metadataToDelete
                .map((m) => m.biogenicEmissionsId)
                .filter((id): id is string => id !== null) }, // Delete duplicates
          },
        });
      }
  
      console.log("Duplicate removal process for BiogenicEmissions completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates from BiogenicEmissions:", error);
    }
  }
  
  async function removeDuplicatesFromTurnover() {
    try {
      // Step 1: Find duplicate Turnover entries (same economyId)
      const duplicates = await prisma.$queryRaw<
        { economyId: string; ids: string[] }[]
      >(Prisma.sql`
        SELECT "economyId", array_agg("id") AS ids
        FROM "Turnover"
        WHERE "economyId" IS NOT NULL
        GROUP BY "economyId"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { economyId, ids } = duplicate;
  
        console.log(`Processing duplicates for economyId=${economyId}`);
  
        // Step 2: Fetch Metadata related to these duplicates to determine the newest entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { turnoverId: { in: ids } },
          select: {
            id: true, // Metadata ID
            turnoverId: true, // Turnover ID
            updatedAt: true, // Sort by this field to find the newest entry
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for economyId=${economyId}. Skipping...`);
          continue;
        }
  
        // Step 3: The newest Metadata entry determines the record to keep.
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping Turnover with ID ${newestMetadata.turnoverId} (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.turnoverId)
        );
  
        // Step 4: Delete older duplicates in Turnover
        await prisma.turnover.deleteMany({
          where: {
            id: { in: metadataToDelete
                .map((m) => m.turnoverId)
                .filter((id): id is string => id !== null)  }, // Delete duplicates
          },
        });
      }
  
      console.log("Duplicate removal process for Turnover completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates from Turnover:", error);
    }
  }
  
  async function removeDuplicatesFromEmployees() {
    try {
      // Step 1: Find duplicate Employees entries (same economyId)
      const duplicates = await prisma.$queryRaw<
        { economyId: string; ids: string[] }[]
      >(Prisma.sql`
        SELECT "economyId", array_agg("id") AS ids
        FROM "Employees"
        WHERE "economyId" IS NOT NULL
        GROUP BY "economyId"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { economyId, ids } = duplicate;
  
        console.log(`Processing duplicates for economyId=${economyId}`);
  
        // Step 2: Fetch Metadata related to these duplicates to determine the newest entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { employeesId: { in: ids } },
          select: {
            id: true, // Metadata ID
            employeesId: true, // Employees ID
            updatedAt: true, // Sort by this field to find the newest entry
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for economyId=${economyId}. Skipping...`);
          continue;
        }
  
        // Step 3: The newest Metadata entry determines the record to keep.
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping Employees with ID ${newestMetadata.employeesId} (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.employeesId)
        );
  
        // Step 4: Delete older duplicates in Employees
        await prisma.employees.deleteMany({
          where: {
            id: { in: metadataToDelete
                .map((m) => m.employeesId)
                .filter((id): id is string => id !== null)  }, // Delete duplicates
          },
        });
      }
  
      console.log("Duplicate removal process for Employees completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates from Employees:", error);
    }
  }

  async function removeDuplicatesFromStatedTotalEmissionsByScope3() {
    try {
      // Step 1: Find duplicate StatedTotalEmissions where entries belong to the same Scope3 entity.
      const duplicates = await prisma.$queryRaw<
        { scope3Id: string; ids: string[] }[]
      >(Prisma.sql`
        SELECT "scope3Id", array_agg("id") AS ids
        FROM "StatedTotalEmissions"
        WHERE "scope3Id" IS NOT NULL
        GROUP BY "scope3Id"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { scope3Id, ids } = duplicate;
  
        console.log(`Processing duplicates for scope3Id=${scope3Id}`);
  
        // Step 2: Fetch Metadata information to determine the newest entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { statedTotalEmissionsId: { in: ids } },
          select: {
            id: true, // Metadata ID
            statedTotalEmissionsId: true, // StatedTotalEmissions ID
            updatedAt: true, // Sort by this field to find the newest
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for scope3Id=${scope3Id}. Skipping...`);
          continue;
        }
  
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping StatedTotalEmissions with ID ${
            newestMetadata.statedTotalEmissionsId
          } (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.statedTotalEmissionsId)
        );
  
        // Step 4: Delete older duplicate entries
        await prisma.statedTotalEmissions.deleteMany({
          where: {
            id: { in: metadataToDelete
                .map((m) => m.statedTotalEmissionsId)
                .filter((id): id is string => id !== null)   },
          },
        });
      }
  
      console.log("Duplicate removal process for StatedTotalEmissions by Scope3 completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates from StatedTotalEmissions by Scope3:", error);
    }
  }

  async function removeDuplicatesFromStatedTotalEmissionsByEmission() {
    try {
      // Step 1: Find duplicate StatedTotalEmissions where entries belong to the same Emissions entity.
      const duplicates = await prisma.$queryRaw<
        { emissionsId: string; ids: string[] }[]
      >(Prisma.sql`
        SELECT "emissionsId", array_agg("id") AS ids
        FROM "StatedTotalEmissions"
        WHERE "emissionsId" IS NOT NULL
        GROUP BY "emissionsId"
        HAVING count(*) > 1
      `);
  
      for (const duplicate of duplicates) {
        const { emissionsId, ids } = duplicate;
  
        console.log(`Processing duplicates for emissionsId=${emissionsId}`);
  
        // Step 2: Fetch Metadata information to determine the newest entry
        const metadataWithTimestamps = await prisma.metadata.findMany({
          where: { statedTotalEmissionsId: { in: ids } },
          select: {
            id: true, // Metadata ID
            statedTotalEmissionsId: true, // StatedTotalEmissions ID
            updatedAt: true, // Sort by this field to find the newest
          },
          orderBy: {
            updatedAt: "desc", // Newer timestamps come first
          },
        });
  
        if (!metadataWithTimestamps || metadataWithTimestamps.length <= 1) {
          console.warn(`No duplicate metadata entries found for emissionsId=${emissionsId}. Skipping...`);
          continue;
        }
  
        const [newestMetadata, ...metadataToDelete] = metadataWithTimestamps;
  
        console.log(
          `Keeping StatedTotalEmissions with ID ${
            newestMetadata.statedTotalEmissionsId
          } (newest). Marking remaining for deletion:`,
          metadataToDelete.map((m) => m.statedTotalEmissionsId)
        );
  
        // Step 4: Delete older duplicate entries
        await prisma.statedTotalEmissions.deleteMany({
          where: {
            id: { in: metadataToDelete
                .map((m) => m.statedTotalEmissionsId)
                .filter((id): id is string => id !== null)   },
          },
        });
      }
  
      console.log("Duplicate removal process for StatedTotalEmissions by Emission completed successfully!");
    } catch (error) {
      console.error("Error removing duplicates from StatedTotalEmissions by Emission:", error);
    } 
  }

export function removeDuplicates() {
  // Run the duplicate removal process
  removeDuplicatesFromScope3Category();
  removeDuplicatesFromScope1();
  removeDuplicatesFromScope2();
  removeDuplicatesFromScope1And2();
  removeDuplicatesFromBiogenicEmissions();
  removeDuplicatesFromTurnover();
  removeDuplicatesFromEmployees();
  removeDuplicatesFromStatedTotalEmissionsByScope3();
  removeDuplicatesFromStatedTotalEmissionsByEmission();
}

removeDuplicates();
  
  