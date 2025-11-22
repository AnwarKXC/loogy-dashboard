import prisma from '../../db'
import { requireSuperAdmin } from '../../utils/superadmin-session'
import { startOfDay, subDays } from 'date-fns'
import { Prisma } from '@prisma/client'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event)

  const today = startOfDay(new Date())
  const lastWeek = subDays(today, 7)
  const lastMonth = subDays(today, 30)

  const [
    totalConversations,
    activeConversations,
    totalMessages,
    todayMessages,
    avgResponseTime,
    totalUsers,
    conversationsToday,
    conversationsThisWeek,
    conversationsThisMonth
  ] = await Promise.all([
    // Total conversations
    prisma.conversation.count(),

    // Active conversations (with messages in last 7 days)
    prisma.conversation.count({
      where: {
        lastMessageAt: { gte: lastWeek }
      }
    }),

    // Total messages
    prisma.chat.count(),

    // Messages today
    prisma.chat.count({
      where: {
        createdAt: { gte: today }
      }
    }),

    // Average response time
    prisma.conversationAnalytics.aggregate({
      _avg: {
        avgResponseTimeMs: true
      }
    }),

    // Total unique users with conversations
    prisma.conversation.groupBy({
      by: ['userId'],
      _count: true
    }).then(result => result.length),

    // Conversations started today
    prisma.conversation.count({
      where: {
        createdAt: { gte: today }
      }
    }),

    // Conversations this week
    prisma.conversation.count({
      where: {
        createdAt: { gte: lastWeek }
      }
    }),

    // Conversations this month
    prisma.conversation.count({
      where: {
        createdAt: { gte: lastMonth }
      }
    })
  ])

  // Get message distribution by hour (last 24 hours)
  const messagesByHour = await prisma.$queryRaw<Array<{ hour: number, count: bigint }>>(
    Prisma.sql`SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count FROM "Chat" WHERE "createdAt" >= NOW() - INTERVAL '24 hours' GROUP BY hour ORDER BY hour`
  )

  // Get top 10 most active conversations
  const topConversations = await prisma.conversation.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      analytics: true,
      _count: {
        select: {
          messages: true
        }
      }
    },
    orderBy: {
      messages: {
        _count: 'desc'
      }
    },
    take: 10
  })

  // Response time distribution
  const responseTimeStats = await prisma.conversationAnalytics.aggregate({
    _min: { avgResponseTimeMs: true },
    _max: { avgResponseTimeMs: true },
    _avg: { avgResponseTimeMs: true }
  })

  return {
    overview: {
      totalConversations,
      activeConversations,
      totalMessages,
      todayMessages,
      totalUsers,
      conversationsToday,
      conversationsThisWeek,
      conversationsThisMonth,
      avgResponseTimeMs: avgResponseTime._avg?.avgResponseTimeMs || 0,
      avgResponseTimeMinutes: avgResponseTime._avg?.avgResponseTimeMs
        ? Math.round(avgResponseTime._avg.avgResponseTimeMs / 60000)
        : 0
    },
    responseTime: {
      min: responseTimeStats._min?.avgResponseTimeMs || 0,
      max: responseTimeStats._max?.avgResponseTimeMs || 0,
      avg: responseTimeStats._avg?.avgResponseTimeMs || 0,
      minMinutes: responseTimeStats._min?.avgResponseTimeMs
        ? Math.round(responseTimeStats._min.avgResponseTimeMs / 60000)
        : 0,
      maxMinutes: responseTimeStats._max?.avgResponseTimeMs
        ? Math.round(responseTimeStats._max.avgResponseTimeMs / 60000)
        : 0,
      avgMinutes: responseTimeStats._avg?.avgResponseTimeMs
        ? Math.round(responseTimeStats._avg.avgResponseTimeMs / 60000)
        : 0
    },
    messagesByHour: messagesByHour.map(item => ({
      hour: Number(item.hour),
      count: Number(item.count)
    })),
    topConversations: topConversations.map(conv => ({
      id: conv.id,
      user: conv.user,
      messageCount: conv._count.messages,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      avgResponseTime: conv.analytics?.avgResponseTimeMs || 0,
      userMessages: conv.analytics?.userMessages || 0,
      adminMessages: conv.analytics?.adminMessages || 0
    }))
  }
})
