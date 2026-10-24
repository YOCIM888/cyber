import {
  CAMPAIGN_DAYS,
  FEE_RATE,
  GAME_VERSION,
  PREHISTORY_LENGTH,
  STOCKS,
  STARTING_CASH,
} from './stocks'
import { MARKET_EVENTS, SECTOR_EVENTS, STOCK_EVENTS } from './events'

export const REGIMES = [
  {
    key: 'greed',
    label: '贪婪',
    drift: 0.0018,
    volatility: 1.16,
    tone: 'up',
    copy: '资金正在追逐每一个故事。',
  },
  {
    key: 'neutral',
    label: '观望',
    drift: 0.0001,
    volatility: 0.94,
    tone: 'neutral',
    copy: '交易员在霓虹灯下等待下一个信号。',
  },
  {
    key: 'fear',
    label: '恐慌',
    drift: -0.0019,
    volatility: 1.3,
    tone: 'down',
    copy: '卖单比情报跑得更快。',
  },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100
const round4 = (value) => Math.round((Number(value) + Number.EPSILON) * 10000) / 10000
const randomBetween = (min, max) => min + Math.random() * (max - min)

function randomNormal() {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1))
}

function pickRandom(items) {
  if (!items.length) return null
  return items[Math.floor(Math.random() * items.length)]
}

function makePrehistory(endPrice, count, volatility) {
  const values = [round2(endPrice)]
  let price = endPrice
  for (let index = 1; index < count; index += 1) {
    const step = clamp(randomNormal() * volatility * 0.7, -volatility * 2.2, volatility * 2.2)
    price = Math.max(1, price / (1 + step))
    values.unshift(round2(price))
  }
  return values
}

function createStockState(meta) {
  const history = makePrehistory(meta.price, PREHISTORY_LENGTH, meta.volatility)
  const prevClose = history[history.length - 2] ?? meta.price
  const open = round2(prevClose * (1 + randomBetween(-0.008, 0.008)))
  const high = round2(Math.max(open, meta.price) * (1 + randomBetween(0.002, 0.012)))
  const low = round2(Math.min(open, meta.price) * (1 - randomBetween(0.002, 0.012)))

  return {
    ...meta,
    price: round2(meta.price),
    prevClose,
    open,
    high,
    low,
    volume: Math.round(meta.baseVolume * randomBetween(0.7, 1.4)),
    history,
  }
}

function pickRegime() {
  const roll = Math.random()
  if (roll < 0.32) return { ...REGIMES[0] }
  if (roll < 0.74) return { ...REGIMES[1] }
  return { ...REGIMES[2] }
}

function selectEvent(pool, usedIds, predicate = () => true) {
  const unused = pool.filter((event) => !usedIds.has(event.id) && predicate(event))
  const fallback = pool.filter((event) => predicate(event))
  return pickRandom(unused.length ? unused : fallback)
}

function buildIntelItem(event, game, index) {
  const targets = game.stocks
    .filter((stock) => {
      if (event.scope === 'market') return true
      if (event.scope === 'sector') return stock.sector === event.sector
      return stock.id === event.stockId
    })
    .map((stock) => stock.name)

  const targetLabel =
    event.scope === 'market'
      ? '全市场 · 12 只成分股'
      : event.scope === 'sector'
        ? `${event.sector}板块 · ${targets.join(' / ')}`
        : targets.join(' / ')

  return {
    ...event,
    id: `d${game.day}-${index}-${event.id}`,
    eventId: event.id,
    day: game.day,
    scopeLabel: event.scope === 'market' ? '大盘' : event.scope === 'sector' ? '板块' : '个股',
    tier: event.strength >= 0.08 ? 3 : event.strength >= 0.06 ? 2 : 1,
    targetLabel,
    targetNames: targets,
  }
}

function generateDailyIntel(game) {
  const usedIds = new Set(game.usedEventIds || [])
  const chosen = []
  const chosenStockIds = new Set()
  const chosenSectors = new Set()
  let hasMarket = false

  const plans = [
    ['stock', 'sector', 'stock'],
    ['stock', 'sector', 'market'],
    ['stock', 'market', 'stock'],
    ['stock', 'sector', 'stock'],
  ]
  const plan = pickRandom(plans)

  for (const scope of plan) {
    let event = null

    if (scope === 'stock' && !hasMarket) {
      event = selectEvent(
        STOCK_EVENTS,
        usedIds,
        (candidate) => !chosenStockIds.has(candidate.stockId),
      )
      if (event) chosenStockIds.add(event.stockId)
    } else if (scope === 'sector') {
      event = selectEvent(
        SECTOR_EVENTS,
        usedIds,
        (candidate) => !chosenSectors.has(candidate.sector),
      )
      if (event) chosenSectors.add(event.sector)
    } else if (scope === 'market' && !hasMarket) {
      event = selectEvent(MARKET_EVENTS, usedIds)
      hasMarket = Boolean(event)
    } else {
      event = selectEvent(
        STOCK_EVENTS,
        usedIds,
        (candidate) => !chosenStockIds.has(candidate.stockId),
      )
      if (event) chosenStockIds.add(event.stockId)
    }

    if (event && !chosen.some((item) => item.id === event.id)) chosen.push(event)
  }

  const intel = chosen.slice(0, 3).map((event, index) => buildIntelItem(event, game, index))
  const nextUsed = [...(game.usedEventIds || []), ...intel.map((item) => item.eventId)].slice(-27)
  game.usedEventIds = nextUsed

  return intel
}

export function createGame(mode = 'campaign') {
  const stocks = STOCKS.map(createStockState)
  const indexHistory = makePrehistory(1000, PREHISTORY_LENGTH, 0.0045)
  const game = {
    version: GAME_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode: mode === 'endless' ? 'endless' : 'campaign',
    day: 1,
    cash: STARTING_CASH,
    startingCash: STARTING_CASH,
    holdings: {},
    stocks,
    selectedStockId: 'cyb',
    index: indexHistory[indexHistory.length - 1],
    indexHistory,
    prehistoryLength: PREHISTORY_LENGTH,
    regime: pickRegime(),
    regimeDaysLeft: randomInt(2, 4),
    netWorthHistory: [STARTING_CASH],
    trades: [],
    dailyReports: [],
    realizedPnl: 0,
    usedEventIds: [],
    intel: [],
    finished: false,
    finalReport: null,
  }

  game.intel = generateDailyIntel(game)
  game.updatedAt = new Date().toISOString()
  return game
}

export function getStockChange(stock) {
  if (!stock?.prevClose) return 0
  return stock.price / stock.prevClose - 1
}

export function getIndexChange(game) {
  if (!game || game.indexHistory.length < 2) return 0
  const previous = game.indexHistory[game.indexHistory.length - 2]
  return previous ? game.index / previous - 1 : 0
}

export function computePortfolioValue(game) {
  return game.stocks.reduce((total, stock) => {
    const shares = game.holdings[stock.id]?.shares || 0
    return total + shares * stock.price
  }, 0)
}

export function computeNetWorth(game) {
  return round2(game.cash + computePortfolioValue(game))
}

export function getPositionRows(game) {
  const netWorth = computeNetWorth(game)
  return game.stocks
    .filter((stock) => (game.holdings[stock.id]?.shares || 0) > 0)
    .map((stock) => {
      const position = game.holdings[stock.id]
      const marketValue = round2(position.shares * stock.price)
      const costBasis = position.shares * position.avgCost
      const pnl = marketValue - costBasis
      const pnlPct = costBasis > 0 ? pnl / costBasis : 0
      return {
        id: stock.id,
        name: stock.name,
        code: stock.code,
        sector: stock.sector,
        shares: position.shares,
        avgCost: position.avgCost,
        price: stock.price,
        marketValue,
        pnl,
        pnlPct,
        weight: netWorth > 0 ? marketValue / netWorth : 0,
      }
    })
    .sort((a, b) => b.marketValue - a.marketValue)
}

export function getMaxBuyQuantity(stock, cash) {
  if (!stock || stock.price <= 0) return 0
  return Math.max(0, Math.floor(cash / (stock.price * (1 + FEE_RATE))))
}

export function getMaxSellQuantity(game, stockId) {
  return game.holdings[stockId]?.shares || 0
}

export function executeTrade(game, { stockId, side, quantity }) {
  if (!game || game.finished) throw new Error('本轮交易已结束。')
  const stock = game.stocks.find((item) => item.id === stockId)
  if (!stock) throw new Error('未找到该股票。')

  const shares = Math.floor(Number(quantity))
  if (!Number.isFinite(shares) || shares <= 0) throw new Error('请输入有效的整数股数。')

  const gross = round2(stock.price * shares)
  const fee = round2(gross * FEE_RATE)

  if (side === 'buy') {
    const total = round2(gross + fee)
    if (total > game.cash + 0.001) throw new Error('可用现金不足，无法完成这笔买入。')

    const existing = game.holdings[stock.id] || { shares: 0, avgCost: 0 }
    const nextShares = existing.shares + shares
    const nextAverage = round4(
      (existing.shares * existing.avgCost + total) / Math.max(1, nextShares),
    )

    game.cash = round2(game.cash - total)
    game.holdings[stock.id] = {
      shares: nextShares,
      avgCost: nextAverage,
    }

    const trade = {
      id: `trade-${Date.now()}-${game.trades.length}`,
      day: game.day,
      historyIndex: stock.history.length - 1,
      stockId: stock.id,
      code: stock.code,
      name: stock.name,
      side: 'buy',
      quantity: shares,
      price: stock.price,
      gross,
      fee,
      cashDelta: -total,
      realizedPnl: 0,
    }
    game.trades.push(trade)
    return trade
  }

  if (side === 'sell') {
    const existing = game.holdings[stock.id]
    if (!existing || existing.shares < shares) throw new Error('持仓数量不足，无法卖出。')

    const netProceeds = round2(gross - fee)
    const realizedPnl = round2(netProceeds - shares * existing.avgCost)

    game.cash = round2(game.cash + netProceeds)
    game.realizedPnl = round2(game.realizedPnl + realizedPnl)
    existing.shares -= shares
    if (existing.shares <= 0) delete game.holdings[stock.id]

    const trade = {
      id: `trade-${Date.now()}-${game.trades.length}`,
      day: game.day,
      historyIndex: stock.history.length - 1,
      stockId: stock.id,
      code: stock.code,
      name: stock.name,
      side: 'sell',
      quantity: shares,
      price: stock.price,
      gross,
      fee,
      cashDelta: netProceeds,
      realizedPnl,
    }
    game.trades.push(trade)
    return trade
  }

  throw new Error('未知的交易方向。')
}

function eventImpactForStock(game, stock) {
  let impact = 0
  for (const item of game.intel || []) {
    const applies =
      item.scope === 'market' ||
      (item.scope === 'sector' && item.sector === stock.sector) ||
      (item.scope === 'stock' && item.stockId === stock.id)

    if (!applies) continue

    const reliability = 0.45 + clamp(item.confidence, 0.4, 0.95) * 0.65
    impact +=
      item.sentiment * item.strength * reliability * randomBetween(0.82, 1.16)
  }
  return impact
}

export function settleDay(game) {
  if (!game || game.finished) return null

  const completedDay = game.day
  const previousIndex = game.index
  const previousNetWorth = computeNetWorth(game)
  const stockReturns = []

  for (const stock of game.stocks) {
    const previousPrice = stock.price
    const momentum =
      stock.history.length > 2
        ? (stock.history[stock.history.length - 1] / stock.history[stock.history.length - 2] - 1) *
          0.06
        : 0

    const marketPulse =
      game.regime.drift + randomNormal() * 0.0072 * game.regime.volatility * stock.beta
    const sectorPulse = randomNormal() * 0.0038
    const idiosyncratic = randomNormal() * stock.volatility * 0.62
    const intelImpact = eventImpactForStock(game, stock)

    const dailyReturn = clamp(
      marketPulse + sectorPulse + idiosyncratic + intelImpact + momentum,
      -0.19,
      0.19,
    )

    const nextPrice = round2(Math.max(1, previousPrice * (1 + dailyReturn)))
    const open = round2(previousPrice * (1 + randomBetween(-0.006, 0.006) + dailyReturn * 0.22))
    const high = round2(
      Math.max(open, nextPrice) * (1 + randomBetween(0.0015, 0.013)),
    )
    const low = round2(Math.min(open, nextPrice) * (1 - randomBetween(0.0015, 0.013)))

    stock.prevClose = previousPrice
    stock.price = nextPrice
    stock.open = open
    stock.high = high
    stock.low = low
    stock.volume = Math.round(
      stock.baseVolume * (0.65 + Math.random() * 0.8 + Math.abs(dailyReturn) * 8),
    )
    stock.history.push(nextPrice)
    stockReturns.push(nextPrice / previousPrice - 1)
  }

  const indexReturn =
    stockReturns.reduce((total, value) => total + value, 0) / Math.max(1, stockReturns.length)
  game.index = round2(game.index * (1 + indexReturn))
  game.indexHistory.push(game.index)

  const rankedStocks = game.stocks
    .map((stock) => ({
      id: stock.id,
      name: stock.name,
      code: stock.code,
      change: stock.price / stock.prevClose - 1,
    }))
    .sort((a, b) => b.change - a.change)

  const netWorth = computeNetWorth(game)
  game.netWorthHistory.push(netWorth)

  const report = {
    day: completedDay,
    index: game.index,
    indexChange: game.index / previousIndex - 1,
    netWorth,
    netWorthChange: netWorth - previousNetWorth,
    topGainer: rankedStocks[0],
    topLoser: rankedStocks[rankedStocks.length - 1],
    headlines: (game.intel || []).map((item) => ({
      title: item.title,
      sentiment: item.sentiment,
      scope: item.scope,
    })),
  }

  game.dailyReports.push(report)
  game.updatedAt = new Date().toISOString()

  if (game.mode === 'campaign' && completedDay >= CAMPAIGN_DAYS) {
    game.finished = true
    game.finishedAt = new Date().toISOString()
    game.finalReport = report
    game.intel = []
  } else {
    game.day = completedDay + 1
    game.regimeDaysLeft -= 1
    if (game.regimeDaysLeft <= 0) {
      game.regime = pickRegime()
      game.regimeDaysLeft = randomInt(2, 4)
    }
    game.intel = generateDailyIntel(game)
  }

  return report
}

export function finishSession(game) {
  if (!game) return null
  game.finished = true
  game.finishedAt = game.finishedAt || new Date().toISOString()
  game.intel = []
  game.updatedAt = new Date().toISOString()
  return buildResult(game)
}

function getRank(returnRatio) {
  if (returnRatio >= 2) {
    return {
      grade: 'SSS',
      label: '霓虹神话',
      blurb: '整座城市的资本流向都在复述你的名字。',
      tone: 'myth',
    }
  }
  if (returnRatio >= 1.5) {
    return {
      grade: 'SS',
      label: '城市传说',
      blurb: '你的仓位成了交易所里流传的下一个传说。',
      tone: 'legend',
    }
  }
  if (returnRatio >= 1) {
    return {
      grade: 'S',
      label: '资本幽灵',
      blurb: '市场记住了你的每一次下单。',
      tone: 'elite',
    }
  }
  if (returnRatio >= 0.5) {
    return {
      grade: 'A',
      label: '赛博猎手',
      blurb: '你嗅到了机会，并且在它消失前动手。',
      tone: 'good',
    }
  }
  if (returnRatio >= 0.3) {
    return {
      grade: 'B',
      label: '街头赢家',
      blurb: '你比大多数交易员更懂得何时收手。',
      tone: 'stable',
    }
  }
  if (returnRatio >= 0.1) {
    return {
      grade: 'C',
      label: '霓虹操盘手',
      blurb: '你跑赢了交易税，也跑赢了大多数散户。',
      tone: 'stable',
    }
  }
  if (returnRatio >= 0) {
    return {
      grade: 'D',
      label: '霓虹幸存者',
      blurb: '至少，你带着本金离开了牌桌。',
      tone: 'warn',
    }
  }
  if (returnRatio >= -0.3) {
    return {
      grade: 'E',
      label: '被套牢者',
      blurb: '市场没有针对你，它只是继续运行。',
      tone: 'danger',
    }
  }
  return {
    grade: 'F',
    label: '系统弃子',
    blurb: '霓虹还在亮，但你的账户已经离开牌桌。',
    tone: 'severe',
  }
}

function calculateMaxDrawdown(series) {
  let peak = series[0] || 0
  let maxDrawdown = 0
  for (const value of series) {
    peak = Math.max(peak, value)
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, value / peak - 1)
  }
  return Math.abs(maxDrawdown)
}

export function buildResult(game) {
  const netWorth = computeNetWorth(game)
  const totalReturn = netWorth / game.startingCash - 1
  const indexReturn = game.index / 1000 - 1
  const series = [...game.netWorthHistory]
  if (series[series.length - 1] !== netWorth) series.push(netWorth)
  const sellTrades = game.trades.filter((trade) => trade.side === 'sell')
  const winningTrades = sellTrades.filter((trade) => trade.realizedPnl > 0).length

  return {
    mode: game.mode,
    daysPlayed: game.dailyReports.length,
    netWorth,
    totalReturn,
    indexReturn,
    excessReturn: totalReturn - indexReturn,
    maxDrawdown: calculateMaxDrawdown(series),
    peakNetWorth: Math.max(...series),
    tradeCount: game.trades.length,
    sellCount: sellTrades.length,
    winRate: sellTrades.length ? winningTrades / sellTrades.length : 0,
    realizedPnl: game.realizedPnl,
    rank: getRank(totalReturn),
  }
}

