import { PrismaClient } from "@prisma/client";

/**
 * One-shot CLI: promote / demote a user's role.
 *
 *   npx tsx scripts/set-user-role.ts <email> [role]
 *
 * Defaults role to "admin". Accepted roles: "user" | "pro" | "admin".
 */
const VALID_ROLES = new Set(["user", "pro", "admin"]);

async function main() {
  const [, , email, roleArg = "admin"] = process.argv;

  if (!email) {
    console.error("usage: npx tsx scripts/set-user-role.ts <email> [role]");
    process.exit(1);
  }
  const role = roleArg.toLowerCase();
  if (!VALID_ROLES.has(role)) {
    console.error(
      `invalid role "${roleArg}". valid: ${Array.from(VALID_ROLES).join(", ")}`,
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`no user with email ${email}`);
      process.exit(1);
    }
    const updated = await prisma.user.update({
      where: { email },
      data: { role },
      select: { id: true, email: true, role: true, name: true },
    });
    console.log(`updated:`, updated);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
