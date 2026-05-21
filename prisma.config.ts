import "dotenv/config";

const config = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'bun·./prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

export default config;