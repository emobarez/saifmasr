import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tables = [
    "ServiceRequest",
    "User",
    "Service",
    "RequestAttachment",
  ];

  console.log("# Columns by table\n");
  for (const t of tables) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `select column_name, data_type, udt_name, is_nullable, column_default
       from information_schema.columns
       where table_schema = 'public' and table_name = $1
       order by ordinal_position`,
       t
    );
    console.log(`Table: ${t}`);
    console.table(rows);
    console.log();
  }

  console.log("# Enum types and values (if any)\n");
  const enumRows = await prisma.$queryRawUnsafe<any[]>(`
    select t.typname as enum_name, string_agg(e.enumlabel, ',') as labels
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    join pg_catalog.pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
    group by t.typname
    order by t.typname
  `);
  console.table(enumRows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
