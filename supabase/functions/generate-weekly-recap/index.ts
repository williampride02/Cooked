// Supabase Edge Function: generate-weekly-recap
// Generates weekly recap data for all groups with activity in the past week.
// Can be triggered by cron job or manually via HTTP POST.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for HTTP requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types matching src/types/index.ts
interface RecapAwardWinner {
  user_id: string
  display_name: string
  avatar_url: string | null
  value: number
}

interface RecapExcuseAward {
  user_id: string
  display_name: string
  avatar_url: string | null
  excuse: string
  count: number
}

interface RecapRoastAward {
  response_id: string
  user_id: string
  display_name: string
  avatar_url: string | null
  content: string
  content_type: 'text' | 'gif' | 'image'
  reaction_count: number
}

interface RecapLeaderboardEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  completion_rate: number
  check_ins: number
  folds: number
}

interface RecapStreakHighlight {
  user_id: string
  display_name: string
  avatar_url: string | null
  pact_name: string
  streak_days: number
}

interface RecapData {
  awards: {
    most_consistent: RecapAwardWinner | null
    biggest_fold: RecapAwardWinner | null
    excuse_hall_of_fame: RecapExcuseAward | null
    comeback_player: RecapAwardWinner | null
    best_roast: RecapRoastAward | null
  }
  stats: {
    group_completion_rate: number
    total_check_ins: number
    total_folds: number
    active_pacts: number
    roast_threads_opened: number
    leaderboard: RecapLeaderboardEntry[]
  }
  highlights: {
    top_roasts: RecapRoastAward[]
    biggest_improvement: RecapAwardWinner | null
    longest_streak: RecapStreakHighlight | null
  }
}

// Helper to get Monday of the given week (ISO week starts on Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper to get Sunday of the given week
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

// Format date as YYYY-MM-DD for database
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Main function to generate recap for a single group
async function generateRecapForGroup(
  supabase: ReturnType<typeof createClient>,
  groupId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<RecapData> {
  const weekStartStr = formatDate(weekStart)
  const weekEndStr = formatDate(weekEnd)

  console.log(`Generating recap for group ${groupId}: ${weekStartStr} to ${weekEndStr}`)

  // Get group members with user info
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select(`
      user_id,
      users!inner(id, display_name, avatar_url)
    `)
    .eq('group_id', groupId)

  if (membersError) {
    console.error('Error fetching members:', membersError)
    throw membersError
  }

  const memberMap = new Map(
    members?.map((m: any) => [m.user_id, m.users]) || []
  )
  const memberIds = Array.from(memberMap.keys())

  // Get active pacts for this group during the week
  const { data: pacts, error: pactsError } = await supabase
    .from('pacts')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'active')
    .lte('start_date', weekEndStr)
    .or(`end_date.is.null,end_date.gte.${weekStartStr}`)

  if (pactsError) {
    console.error('Error fetching pacts:', pactsError)
    throw pactsError
  }

  const pactIds = pacts?.map((p: any) => p.id) || []
  const activePactsCount = pactIds.length

  // Get all check-ins for this week
  const { data: checkIns, error: checkInsError } = await supabase
    .from('check_ins')
    .select('*')
    .in('pact_id', pactIds.length ? pactIds : ['no-pacts'])
    .gte('check_in_date', weekStartStr)
    .lte('check_in_date', weekEndStr)

  if (checkInsError) {
    console.error('Error fetching check-ins:', checkInsError)
    throw checkInsError
  }

  const checkInsList = checkIns || []
  const totalCheckIns = checkInsList.filter((c: any) => c.status === 'success').length
  const totalFolds = checkInsList.filter((c: any) => c.status === 'fold').length

  // Calculate expected check-ins per user based on pact frequency
  function calculateExpectedCheckIns(
    pact: any,
    startDate: Date,
    endDate: Date
  ): number {
    let expected = 0
    const current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = current.getDay() // 0=Sun, 1=Mon, etc.
      const pactStart = new Date(pact.start_date)
      const pactEnd = pact.end_date ? new Date(pact.end_date) : null

      if (current >= pactStart && (!pactEnd || current <= pactEnd)) {
        if (pact.frequency === 'daily') {
          expected++
        } else if (pact.frequency === 'weekly') {
          // Weekly pacts are due on the same day they started
          if (dayOfWeek === pactStart.getDay()) {
            expected++
          }
        } else if (pact.frequency === 'custom' && pact.frequency_days) {
          // Custom: frequency_days is array like [1,3,5] for Mon,Wed,Fri
          // Note: DB uses 1=Mon, but JS uses 0=Sun, 1=Mon
          const jsDay = dayOfWeek === 0 ? 7 : dayOfWeek // Convert to 1-7 (Mon-Sun)
          if (pact.frequency_days.includes(jsDay)) {
            expected++
          }
        }
      }
      current.setDate(current.getDate() + 1)
    }
    return expected
  }

  // Get pact participants
  const { data: participants, error: participantsError } = await supabase
    .from('pact_participants')
    .select('pact_id, user_id')
    .in('pact_id', pactIds.length ? pactIds : ['no-pacts'])

  if (participantsError) {
    console.error('Error fetching participants:', participantsError)
    throw participantsError
  }

  // Calculate stats per user
  const userStats = new Map<
    string,
    { checkIns: number; folds: number; expected: number }
  >()

  // Initialize all members
  for (const memberId of memberIds) {
    userStats.set(memberId, { checkIns: 0, folds: 0, expected: 0 })
  }

  // Calculate expected check-ins for each user based on their pact participation
  const participantsList = participants || []
  for (const participant of participantsList) {
    const pact = pacts?.find((p: any) => p.id === participant.pact_id)
    if (pact) {
      const expected = calculateExpectedCheckIns(pact, weekStart, weekEnd)
      const stats = userStats.get(participant.user_id)
      if (stats) {
        stats.expected += expected
      }
    }
  }

  // Count actual check-ins and folds per user
  for (const checkIn of checkInsList) {
    const stats = userStats.get(checkIn.user_id)
    if (stats) {
      if (checkIn.status === 'success') {
        stats.checkIns++
      } else if (checkIn.status === 'fold') {
        stats.folds++
      }
    }
  }

  // Build leaderboard
  const leaderboard: RecapLeaderboardEntry[] = []
  for (const [userId, stats] of userStats) {
    if (stats.expected > 0) {
      const user = memberMap.get(userId)
      if (user) {
        const completionRate =
          stats.expected > 0
            ? ((stats.checkIns) / stats.expected) * 100
            : 0
        leaderboard.push({
          user_id: userId,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          completion_rate: Math.min(completionRate, 100),
          check_ins: stats.checkIns,
          folds: stats.folds,
        })
      }
    }
  }

  // Sort by completion rate descending
  leaderboard.sort((a, b) => b.completion_rate - a.completion_rate)

  // Calculate group completion rate
  let totalExpected = 0
  let totalCompleted = 0
  for (const stats of userStats.values()) {
    totalExpected += stats.expected
    totalCompleted += stats.checkIns
  }
  const groupCompletionRate =
    totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0

  // Get roast threads opened this week
  const checkInIds = checkInsList.map((c: any) => c.id)
  let roastThreadsOpened = 0

  if (checkInIds.length > 0) {
    const { data: threads, error: threadsError } = await supabase
      .from('roast_threads')
      .select('id')
      .in('check_in_id', checkInIds)

    if (!threadsError && threads) {
      roastThreadsOpened = threads.length
    }
  }

  // === AWARDS ===

  // Most Consistent: highest completion rate (min 1 expected check-in)
  let mostConsistent: RecapAwardWinner | null = null
  if (leaderboard.length > 0 && leaderboard[0].completion_rate > 0) {
    mostConsistent = {
      user_id: leaderboard[0].user_id,
      display_name: leaderboard[0].display_name,
      avatar_url: leaderboard[0].avatar_url,
      value: leaderboard[0].completion_rate,
    }
  }

  // Biggest Fold: most folds this week
  let biggestFold: RecapAwardWinner | null = null
  let maxFolds = 0
  for (const entry of leaderboard) {
    if (entry.folds > maxFolds) {
      maxFolds = entry.folds
      biggestFold = {
        user_id: entry.user_id,
        display_name: entry.display_name,
        avatar_url: entry.avatar_url,
        value: entry.folds,
      }
    }
  }
  // Only award if there were actual folds
  if (maxFolds === 0) {
    biggestFold = null
  }

  // Excuse Hall of Fame: most creative/repeated excuse
  let excuseHallOfFame: RecapExcuseAward | null = null
  const excuseCounts = new Map<string, { excuse: string; count: number; userId: string }>()

  for (const checkIn of checkInsList) {
    if (checkIn.status === 'fold' && checkIn.excuse) {
      const key = `${checkIn.user_id}:${checkIn.excuse}`
      const existing = excuseCounts.get(key)
      if (existing) {
        existing.count++
      } else {
        excuseCounts.set(key, {
          excuse: checkIn.excuse,
          count: 1,
          userId: checkIn.user_id,
        })
      }
    }
  }

  // Find the excuse used most times (or first one if tied)
  let topExcuse: { excuse: string; count: number; userId: string } | null = null
  for (const exc of excuseCounts.values()) {
    if (!topExcuse || exc.count > topExcuse.count ||
        (exc.count === topExcuse.count && exc.excuse.length > topExcuse.excuse.length)) {
      topExcuse = exc
    }
  }

  if (topExcuse) {
    const user = memberMap.get(topExcuse.userId)
    if (user) {
      excuseHallOfFame = {
        user_id: topExcuse.userId,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        excuse: topExcuse.excuse,
        count: topExcuse.count,
      }
    }
  }

  // Comeback Player: compare to previous week
  let comebackPlayer: RecapAwardWinner | null = null
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const prevWeekEnd = new Date(weekEnd)
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7)

  const { data: prevCheckIns } = await supabase
    .from('check_ins')
    .select('*')
    .in('pact_id', pactIds.length ? pactIds : ['no-pacts'])
    .gte('check_in_date', formatDate(prevWeekStart))
    .lte('check_in_date', formatDate(prevWeekEnd))

  if (prevCheckIns && prevCheckIns.length > 0) {
    // Calculate previous week stats per user
    const prevUserStats = new Map<string, { checkIns: number; expected: number }>()

    for (const memberId of memberIds) {
      prevUserStats.set(memberId, { checkIns: 0, expected: 0 })
    }

    // Calculate expected for previous week
    for (const participant of participantsList) {
      const pact = pacts?.find((p: any) => p.id === participant.pact_id)
      if (pact) {
        const expected = calculateExpectedCheckIns(pact, prevWeekStart, prevWeekEnd)
        const stats = prevUserStats.get(participant.user_id)
        if (stats) {
          stats.expected += expected
        }
      }
    }

    // Count previous week check-ins
    for (const checkIn of prevCheckIns) {
      if (checkIn.status === 'success') {
        const stats = prevUserStats.get(checkIn.user_id)
        if (stats) {
          stats.checkIns++
        }
      }
    }

    // Find biggest improvement
    let maxImprovement = 0
    for (const [userId, currentStats] of userStats) {
      const prevStats = prevUserStats.get(userId)
      if (prevStats && currentStats.expected > 0 && prevStats.expected > 0) {
        const currentRate = (currentStats.checkIns / currentStats.expected) * 100
        const prevRate = (prevStats.checkIns / prevStats.expected) * 100
        const improvement = currentRate - prevRate

        if (improvement > maxImprovement && improvement > 10) {
          maxImprovement = improvement
          const user = memberMap.get(userId)
          if (user) {
            comebackPlayer = {
              user_id: userId,
              display_name: user.display_name,
              avatar_url: user.avatar_url,
              value: improvement,
            }
          }
        }
      }
    }
  }

  // Best Roast: most reactions on a roast response this week
  let bestRoast: RecapRoastAward | null = null
  const topRoasts: RecapRoastAward[] = []

  if (checkInIds.length > 0) {
    // Get roast threads for this week's check-ins
    const { data: threads } = await supabase
      .from('roast_threads')
      .select('id')
      .in('check_in_id', checkInIds)

    if (threads && threads.length > 0) {
      const threadIds = threads.map((t: any) => t.id)

      // Get roast responses
      const { data: responses } = await supabase
        .from('roast_responses')
        .select('*')
        .in('thread_id', threadIds)
        .neq('content_type', 'poll') // Exclude polls

      if (responses && responses.length > 0) {
        const responseIds = responses.map((r: any) => r.id)

        // Get reactions for these responses
        const { data: reactions } = await supabase
          .from('reactions')
          .select('target_id')
          .eq('target_type', 'roast_response')
          .in('target_id', responseIds)

        // Count reactions per response
        const reactionCounts = new Map<string, number>()
        if (reactions) {
          for (const reaction of reactions) {
            const count = reactionCounts.get(reaction.target_id) || 0
            reactionCounts.set(reaction.target_id, count + 1)
          }
        }

        // Build roast awards list
        for (const response of responses) {
          const reactionCount = reactionCounts.get(response.id) || 0
          const user = memberMap.get(response.user_id)
          if (user && (reactionCount > 0 || response.content_type === 'text')) {
            topRoasts.push({
              response_id: response.id,
              user_id: response.user_id,
              display_name: user.display_name,
              avatar_url: user.avatar_url,
              content: response.content,
              content_type: response.content_type,
              reaction_count: reactionCount,
            })
          }
        }

        // Sort by reaction count
        topRoasts.sort((a, b) => b.reaction_count - a.reaction_count)

        // Set best roast
        if (topRoasts.length > 0 && topRoasts[0].reaction_count > 0) {
          bestRoast = topRoasts[0]
        }
      }
    }
  }

  // === HIGHLIGHTS ===

  // Biggest Improvement (same as comeback player if exists)
  const biggestImprovement = comebackPlayer

  // Longest Streak: find the user with longest active streak on any pact
  let longestStreak: RecapStreakHighlight | null = null

  for (const pact of pacts || []) {
    // Get all check-ins for this pact ordered by date
    const { data: pactCheckIns } = await supabase
      .from('check_ins')
      .select('user_id, check_in_date, status')
      .eq('pact_id', pact.id)
      .eq('status', 'success')
      .order('check_in_date', { ascending: false })

    if (pactCheckIns && pactCheckIns.length > 0) {
      // Group by user
      const userCheckIns = new Map<string, string[]>()
      for (const ci of pactCheckIns) {
        const dates = userCheckIns.get(ci.user_id) || []
        dates.push(ci.check_in_date)
        userCheckIns.set(ci.user_id, dates)
      }

      // Calculate streak for each user
      for (const [userId, dates] of userCheckIns) {
        // Check for consecutive dates (accounting for pact frequency)
        let streak = 1
        for (let i = 1; i < dates.length; i++) {
          const current = new Date(dates[i - 1])
          const prev = new Date(dates[i])
          const diffDays = Math.round(
            (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
          )

          // For daily pacts, consecutive days; for weekly, ~7 days
          let maxGap = 1
          if (pact.frequency === 'weekly') {
            maxGap = 8
          } else if (pact.frequency === 'custom' && pact.frequency_days) {
            // Calculate expected gap between check-in days
            maxGap = 7 / pact.frequency_days.length + 1
          }

          if (diffDays <= maxGap) {
            streak++
          } else {
            break
          }
        }

        if (!longestStreak || streak > longestStreak.streak_days) {
          const user = memberMap.get(userId)
          if (user) {
            longestStreak = {
              user_id: userId,
              display_name: user.display_name,
              avatar_url: user.avatar_url,
              pact_name: pact.name,
              streak_days: streak,
            }
          }
        }
      }
    }
  }

  // Build final RecapData
  const recapData: RecapData = {
    awards: {
      most_consistent: mostConsistent,
      biggest_fold: biggestFold,
      excuse_hall_of_fame: excuseHallOfFame,
      comeback_player: comebackPlayer,
      best_roast: bestRoast,
    },
    stats: {
      group_completion_rate: Math.round(groupCompletionRate * 10) / 10,
      total_check_ins: totalCheckIns,
      total_folds: totalFolds,
      active_pacts: activePactsCount,
      roast_threads_opened: roastThreadsOpened,
      leaderboard: leaderboard.slice(0, 10), // Top 10
    },
    highlights: {
      top_roasts: topRoasts.slice(0, 5), // Top 5 roasts
      biggest_improvement: biggestImprovement,
      longest_streak: longestStreak,
    },
  }

  return recapData
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse request body for optional parameters
    let groupIds: string[] | null = null
    let weekOffset = 1 // Default: generate for last week

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        groupIds = body.group_ids || null
        weekOffset = body.week_offset ?? 1
      } catch {
        // No body or invalid JSON, use defaults
      }
    }

    // Calculate week dates
    const now = new Date()
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() - (weekOffset * 7))

    const weekStart = getWeekStart(targetDate)
    const weekEnd = getWeekEnd(targetDate)
    const weekStartStr = formatDate(weekStart)

    console.log(`Generating recaps for week: ${weekStartStr} to ${formatDate(weekEnd)}`)

    // Get groups to process
    let groupsToProcess: { id: string }[]

    if (groupIds && groupIds.length > 0) {
      // Process specific groups
      groupsToProcess = groupIds.map((id) => ({ id }))
    } else {
      // Get all groups that had activity this week
      const { data: activeGroups, error: groupsError } = await supabase
        .from('groups')
        .select('id')

      if (groupsError) {
        throw groupsError
      }

      groupsToProcess = activeGroups || []
    }

    console.log(`Processing ${groupsToProcess.length} groups`)

    const results: Array<{
      group_id: string
      status: 'created' | 'updated' | 'skipped' | 'error'
      error?: string
    }> = []

    for (const group of groupsToProcess) {
      try {
        // Check if recap already exists for this week
        const { data: existingRecap } = await supabase
          .from('weekly_recaps')
          .select('id')
          .eq('group_id', group.id)
          .eq('week_start', weekStartStr)
          .single()

        // Generate recap data
        const recapData = await generateRecapForGroup(
          supabase,
          group.id,
          weekStart,
          weekEnd
        )

        // Skip if no activity (no check-ins and no active pacts)
        if (
          recapData.stats.total_check_ins === 0 &&
          recapData.stats.total_folds === 0 &&
          recapData.stats.active_pacts === 0
        ) {
          results.push({ group_id: group.id, status: 'skipped' })
          continue
        }

        if (existingRecap) {
          // Update existing recap
          const { error: updateError } = await supabase
            .from('weekly_recaps')
            .update({
              data: recapData,
              week_end: formatDate(weekEnd),
            })
            .eq('id', existingRecap.id)

          if (updateError) throw updateError
          results.push({ group_id: group.id, status: 'updated' })
        } else {
          // Insert new recap
          const { data: newRecap, error: insertError } = await supabase
            .from('weekly_recaps')
            .insert({
              group_id: group.id,
              week_start: weekStartStr,
              week_end: formatDate(weekEnd),
              data: recapData,
            })
            .select('id')
            .single()

          if (insertError) throw insertError
          results.push({ group_id: group.id, status: 'created' })

          // Send notification for new recap
          try {
            const notifyUrl = `${supabaseUrl}/functions/v1/notify-recap-ready`
            await fetch(notifyUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recapId: newRecap.id,
                groupId: group.id,
                weekStart: weekStartStr,
                weekEnd: formatDate(weekEnd),
              }),
            })
          } catch (notifyErr) {
            console.error(`Failed to send recap notification for group ${group.id}:`, notifyErr)
            // Don't fail the recap generation if notification fails
          }
        }
      } catch (err) {
        console.error(`Error processing group ${group.id}:`, err)
        results.push({
          group_id: group.id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const summary = {
      week_start: weekStartStr,
      week_end: formatDate(weekEnd),
      groups_processed: groupsToProcess.length,
      created: results.filter((r) => r.status === 'created').length,
      updated: results.filter((r) => r.status === 'updated').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      details: results,
    }

    console.log('Recap generation complete:', summary)

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Fatal error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
