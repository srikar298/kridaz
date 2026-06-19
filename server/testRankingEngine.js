import { prisma } from "./config/prisma.js";

async function test() {
  try {
    const pros = await prisma.ownerProfile.findMany({
      include: {
        user: {
          select: { role: true, city: true, state: true },
        },
      },
    });

    console.log(
      `Found ${pros.length} professionals. Sorting them using new logic...`
    );
    const groups = {};
    for (const pro of pros) {
      if (!pro.user || !pro.user.city || !pro.user.state) continue;
      const key = `${pro.user.role}_${pro.user.state.toUpperCase()}_${pro.user.city.toUpperCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(pro);
    }

    for (const [key, groupPros] of Object.entries(groups)) {
      groupPros.sort((a, b) => {
        const getScore = (pro) => {
          const trust = pro.trustScore || 0;
          const daat = pro.avgDailyActivePct || 0;
          const accept = pro.acceptanceRate30d || 0;
          const trustNormalized = Math.min((trust / 300) * 100, 100);
          return trustNormalized * 0.5 + daat * 0.25 + accept * 0.25;
        };
        return getScore(b) - getScore(a);
      });

      console.log(`\nGroup: ${key} (${groupPros.length} pros)`);
      groupPros.forEach((pro, index) => {
        const score = (
          Math.min(((pro.trustScore || 0) / 300) * 100, 100) * 0.5 +
          (pro.avgDailyActivePct || 0) * 0.25 +
          (pro.acceptanceRate30d || 0) * 0.25
        ).toFixed(2);
        console.log(
          `  #${index + 1}: ${pro.user?.role} - Trust: ${pro.trustScore}, DAAT: ${pro.avgDailyActivePct}%, Accept: ${pro.acceptanceRate30d}% -> Combined Score: ${score}/100`
        );
      });
    }

    console.log("\nSuccess: Ranking math executed without errors.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
