import { prisma } from '../src/lib/prisma';

describe('Prisma Client', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should save a record to the database', async () => {
    // Assuming there is a model called 'Example' in your Prisma schema
    const exampleData = { name: 'Test Example' };
    const createdExample = await prisma.example.create({
      data: exampleData,
    });

    expect(createdExample).toHaveProperty('id');
    expect(createdExample.name).toBe(exampleData.name);

    // Clean up
    await prisma.example.delete({
      where: { id: createdExample.id },
    });
  });
});
