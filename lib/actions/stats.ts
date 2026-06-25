"use server";

import { prisma, safeSerialize, requireAmil } from "./helpers";

function buildChartTimeline(period: string = "6m") {
  const now = new Date();
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  let startDate: Date;
  let buckets: { key: string; label: string; start: Date; end: Date }[] = [];

  if (period === "1w") {
    // Last 7 days → daily buckets
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
        start: new Date(d),
        end,
      });
    }
  } else if (period === "1m") {
    // Last 30 days → daily buckets
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        start: new Date(d),
        end,
      });
    }
  } else if (period === "3m") {
    // Last ~12 weeks → weekly buckets
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 83);
    startDate.setHours(0, 0, 0, 0);
    const dayOfWeek = startDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diffToMonday);

    let cursor = new Date(startDate);
    while (cursor <= now) {
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      buckets.push({
        key: cursor.toISOString().slice(0, 10),
        label: `${cursor.getDate()} ${monthNames[cursor.getMonth()]}`,
        start: new Date(cursor),
        end: weekEnd,
      });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else if (period === "1y") {
    // Last 12 months → monthly buckets
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const end = new Date(d);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: monthNames[d.getMonth()],
        start: new Date(d),
        end,
      });
    }
  } else {
    // Default '6m' → last 6 months → monthly buckets
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 6; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const end = new Date(d);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: monthNames[d.getMonth()],
        start: new Date(d),
        end,
      });
    }
  }

  return { startDate, buckets };
}

function aggregateIntoBuckets(
  buckets: { key: string; label: string; start: Date; end: Date }[],
  transactions: { amount: number; date: Date | string }[],
  distributions: { amount: number; date: Date | string }[]
) {
  const chartData = buckets.map((b) => ({
    name: b.label,
    pemasukan: 0,
    penyaluran: 0,
  }));

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    for (let i = 0; i < buckets.length; i++) {
      if (txDate >= buckets[i].start && txDate <= buckets[i].end) {
        chartData[i].pemasukan += tx.amount;
        break;
      }
    }
  });

  distributions.forEach((d) => {
    const dDate = new Date(d.date);
    for (let i = 0; i < buckets.length; i++) {
      if (dDate >= buckets[i].start && dDate <= buckets[i].end) {
        chartData[i].penyaluran += d.amount;
        break;
      }
    }
  });

  return chartData;
}

function calculatePerformanceChange(current: number, previous: number) {
  if (previous === 0) {
    if (current > 0) return { change: "+100%", trend: "up" as const };
    return { change: "0%", trend: "up" as const };
  }
  const percent = ((current - previous) / previous) * 100;
  const formatted = (percent >= 0 ? "+" : "") + percent.toFixed(1) + "%";
  return {
    change: formatted,
    trend: percent >= 0 ? ("up" as const) : ("down" as const)
  };
}

function calculateCumulativeGrowth(added: number, base: number) {
  if (base === 0) {
    if (added > 0) return { change: "+100%", trend: "up" as const };
    return { change: "0%", trend: "up" as const };
  }
  const percent = (added / base) * 100;
  const formatted = (percent >= 0 ? "+" : "") + percent.toFixed(1) + "%";
  return {
    change: formatted,
    trend: percent >= 0 ? ("up" as const) : ("down" as const)
  };
}

export async function getDashboardStats(period: string = "6m") {
  try {
    await requireAmil();

    const { startDate, buckets } = buildChartTimeline(period);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalZakatResult,
      totalDistributionResult,
      totalTransactions,
      uniqueMuzakki,
      recentTransactions,
      recentDistributions,
      typeDistribution,
      zakatCurrent,
      zakatPrevious,
      muzakkiCurrentCount,
      muzakkiPreviousCount,
      distributionCurrent,
      distributionPrevious,
      txCurrentCount,
      txPreviousCount
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: "Success" },
        _sum: { amount: true }
      }),
      prisma.distribution.aggregate({
        _sum: { amount: true }
      }),
      prisma.transaction.count({
        where: { status: "Success" }
      }),
      prisma.muzakki.count(),
      prisma.transaction.findMany({
        where: {
          status: "Success",
          date: { gte: startDate }
        },
        select: { amount: true, date: true }
      }),
      prisma.distribution.findMany({
        where: {
          date: { gte: startDate }
        },
        select: { amount: true, date: true }
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { status: "Success" },
        _count: { id: true }
      }),
      prisma.transaction.aggregate({
        where: { status: "Success", date: { gte: thirtyDaysAgo } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { status: "Success", date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { amount: true }
      }),
      prisma.muzakki.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.muzakki.count({
        where: { createdAt: { lt: thirtyDaysAgo } }
      }),
      prisma.distribution.aggregate({
        where: { date: { gte: thirtyDaysAgo } },
        _sum: { amount: true }
      }),
      prisma.distribution.aggregate({
        where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { amount: true }
      }),
      prisma.transaction.count({
        where: { status: "Success", date: { gte: thirtyDaysAgo } }
      }),
      prisma.transaction.count({
        where: { status: "Success", date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
      })
    ]);

    const totalZakat = totalZakatResult._sum.amount || 0;
    const totalDistribution = totalDistributionResult._sum.amount || 0;

    const chartData = aggregateIntoBuckets(buckets, recentTransactions, recentDistributions);

    const totalForTypes = typeDistribution.reduce((acc: number, item: any) => acc + item._count.id, 0);
    const zakatTypes = typeDistribution.map((item: any) => ({
      label: item.type,
      value: totalForTypes > 0 ? Math.round((item._count.id / totalForTypes) * 100) : 0
    })).sort((a: any, b: any) => b.value - a.value);

    const growth = {
      zakat: calculatePerformanceChange(zakatCurrent._sum.amount || 0, zakatPrevious._sum.amount || 0),
      muzakki: calculateCumulativeGrowth(muzakkiCurrentCount, muzakkiPreviousCount),
      distribution: calculatePerformanceChange(distributionCurrent._sum.amount || 0, distributionPrevious._sum.amount || 0),
      transactions: calculatePerformanceChange(txCurrentCount, txPreviousCount)
    };

    return {
      totalZakat,
      totalTransactions,
      uniqueMuzakki,
      totalDistribution,
      chartData,
      zakatTypes,
      growth
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalZakat: 0,
      totalTransactions: 0,
      uniqueMuzakki: 0,
      totalDistribution: 0,
      chartData: [],
      zakatTypes: [],
      growth: {
        zakat: { change: "0%", trend: "up" as const },
        muzakki: { change: "0%", trend: "up" as const },
        distribution: { change: "0%", trend: "up" as const },
        transactions: { change: "0%", trend: "up" as const }
      }
    };
  }
}

export async function getPublicStats(period: string = "6m") {
  try {
    const { startDate, buckets } = buildChartTimeline(period);

    const [
      totalZakatResult,
      totalDistributionResult,
      uniqueMuzakki,
      recentTransactions,
      recentDistributions
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: "Success" },
        _sum: { amount: true }
      }),
      prisma.distribution.aggregate({
        _sum: { amount: true }
      }),
      prisma.muzakki.count(),
      prisma.transaction.findMany({
        where: {
          status: "Success",
          date: { gte: startDate }
        },
        select: { amount: true, date: true }
      }),
      prisma.distribution.findMany({
        where: {
          date: { gte: startDate }
        },
        select: { amount: true, date: true }
      })
    ]);

    const totalZakat = totalZakatResult._sum.amount || 0;
    const totalDistribution = totalDistributionResult._sum.amount || 0;

    const chartData = aggregateIntoBuckets(buckets, recentTransactions, recentDistributions);

    return {
      totalZakat,
      totalDistribution,
      uniqueMuzakki,
      chartData
    };
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return {
      totalZakat: 0,
      totalDistribution: 0,
      uniqueMuzakki: 0,
      chartData: []
    };
  }
}

export async function getReportData() {
  try {
    await requireAmil();

    const [
      totalIncomeResult,
      totalOutResult,
      recentTransactionsList,
      recentDistributionsList,
      categoryStats,
      incomeTypeStats,
      uniqueRecipientsResult
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: "Success" },
        _sum: { amount: true }
      }),
      prisma.distribution.aggregate({
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        where: { status: "Success" },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          txId: true,
          muzakkiName: true,
          type: true,
          amount: true,
          method: true,
          status: true,
          date: true
        }
      }),
      prisma.distribution.findMany({
        orderBy: { date: 'desc' },
        select: {
          id: true,
          mustahikName: true,
          amount: true,
          category: true,
          date: true,
          description: true
        }
      }),
      prisma.distribution.groupBy({
        by: ['category'],
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { status: "Success" },
        _sum: { amount: true }
      }),
      prisma.distribution.groupBy({
        by: ['mustahikId', 'mustahikName'],
      })
    ]);

    const totalIncome = totalIncomeResult._sum.amount || 0;
    const totalOut = totalOutResult._sum.amount || 0;
    const balance = totalIncome - totalOut;

    // Monthly Aggregation (fetch only last 6 months to prevent RAM bloat)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [allTransactionsSuccess, allDistributions] = await Promise.all([
      prisma.transaction.findMany({
        where: { status: "Success", date: { gte: sixMonthsAgo } },
        select: { amount: true, date: true }
      }),
      prisma.distribution.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { amount: true, date: true }
      })
    ]);

    const monthlyMap: any = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = { month: key, income: 0, out: 0 };
    }

    allTransactionsSuccess.forEach((t: any) => {
      const d = new Date(t.date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyMap[key]) {
        monthlyMap[key].income += t.amount;
      }
    });

    allDistributions.forEach((d: any) => {
      const date = new Date(d.date);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyMap[key]) {
        monthlyMap[key].out += d.amount;
      }
    });

    const monthlyData = Object.values(monthlyMap);

    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
    
    // Distribution by Asnaf Category (Penyaluran)
    const distributionData = categoryStats.map((item: any, i: number) => ({
      name: item.category,
      value: item._sum.amount || 0,
      color: colors[i % colors.length]
    }));

    // Income Distribution (by Type: Maal, Profesi, Fitrah)
    const incomeDistribution = incomeTypeStats.map((item: any, i: number) => ({
      name: item.type,
      value: item._sum.amount || 0,
      color: colors[(i + 3) % colors.length]
    }));

    const uniqueRecipients = uniqueRecipientsResult.length;

    return safeSerialize({
      totalIncome,
      totalOut,
      balance,
      mustahikCount: uniqueRecipients,
      monthlyData,
      distributionData,
      incomeDistribution,
      recentTransactions: recentTransactionsList,
      recentDistributions: recentDistributionsList
    });
  } catch (error) {
    console.error("Report error:", error);
    return null;
  }
}
