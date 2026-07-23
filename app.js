(() => {
  const YEAR_FALLBACK = 2026
  const ROI_TARGET = 0.8
  const PLOT_TEXT = "#0f172a"
  const PLOT_MUTED = "#475569"
  const PLOT_GRID = "rgba(15, 23, 42, 0.12)"
  const PLOT_GRID_LIGHT = "rgba(15, 23, 42, 0.06)"
  const PLOT_COST = "rgba(37,99,235,0.65)"
  const PLOT_REVENUE = "rgba(5,150,105,0.60)"
  const PLOT_ROI = "#f59e0b"
  const plotConfig = { responsive: true, displayModeBar: false }
  const modalPlotConfig = { responsive: true, displayModeBar: true, scrollZoom: true }
  let visiblePlotResizeTimer = null

  const PROCESS_SPECS = [
    { key: "attend", title: "到播（day1到播-day5到播）", dayStart: 1, dayEnd: 5, field: (d) => `day${d}到播`, tickformat: ".1%" },
    { key: "retention", title: "直播间留存（day1留存-day5留存）", dayStart: 1, dayEnd: 5, field: (d) => `day${d}留存`, tickformat: ".1%" },
    { key: "speak", title: "用户发言率（day1发言-day5发言）", dayStart: 1, dayEnd: 5, field: (d) => `day${d}发言`, tickformat: ".1%" },
    { key: "homework", title: "作业（day1晨读-day5晨读）", dayStart: 1, dayEnd: 5, field: (d) => `day${d}晨读`, tickformat: ".1%" },
    { key: "replyRate", title: "班长回复率（day1回复-day5回复）", dayStart: 1, dayEnd: 5, field: (d) => `day${d}回复`, tickformat: ".1%" },
    { key: "replyTime", title: "班长回复时长（day1回复时长-day5回复时长）", dayStart: 1, dayEnd: 5, field: (d) => `day${d}回复时长`, tickformat: null }
  ]

  const CONVERSION_SPECS = [
    { key: "convRate", title: "转率（day3转率-day7转率）", dayStart: 3, dayEnd: 7, resolver: (d) => [`day${d}转率`], tickformat: ".2%", formatter: formatChartPercent2 },
    { key: "individualConvRate", title: "个销转率（day3个销转率-day7个销转率）", dayStart: 3, dayEnd: 7, resolver: (d) => [`day${d}个销转率`], tickformat: ".2%", formatter: formatChartPercent2 },
    { key: "liveRoomConvRate", title: "直播间转率（day3直播间转率-day7直播间转率）", dayStart: 3, dayEnd: 7, resolver: (d) => [`day${d}直播间转率`, `day${d}直播转率`], tickformat: ".2%", formatter: formatChartPercent2 },
    { key: "attendConvRate", title: "到播转率（day3到播转率-day7到播转率）", dayStart: 3, dayEnd: 7, resolver: (d) => [`day${d}到播转率`], tickformat: ".2%", formatter: formatChartPercent2 },
    { key: "pendingRate", title: "待支付率（day3待支付率-day7待支付率）", dayStart: 3, dayEnd: 7, resolver: (d) => [`day${d}待支付率`], tickformat: ".1%" },
    { key: "pendingConv", title: "待支付转率（day3待支付转率-day7待支付转率）", dayStart: 3, dayEnd: 7, resolver: (d) => [`day${d}待支付转率`], tickformat: ".1%" }
  ]

  const DECAY_SPECS = [
    { key: "attendDecay", title: "到播衰减", dayStart: 1, dayEnd: 5, field: (d) => `day${d}到播`, tickformat: ".1%" },
    { key: "retentionDecay", title: "留存衰减", dayStart: 1, dayEnd: 5, field: (d) => `day${d}留存`, tickformat: ".1%" },
    { key: "homeworkDecay", title: "晨读衰减", dayStart: 1, dayEnd: 5, field: (d) => `day${d}晨读`, tickformat: ".1%" }
  ]

  const dom = {
    importView: document.getElementById("importView"),
    dashboardView: document.getElementById("dashboardView"),
    fileClass: document.getElementById("fileClass"),
    fileLimit: document.getElementById("fileLimit"),
    classStatusTag: document.getElementById("classStatusTag"),
    classFileInfo: document.getElementById("classFileInfo"),
    limitStatusTag: document.getElementById("limitStatusTag"),
    limitFileInfo: document.getElementById("limitFileInfo"),
    importSummaryTag: document.getElementById("importSummaryTag"),
    importChecks: document.getElementById("importChecks"),
    importErrors: document.getElementById("importErrors"),
    startAnalysisBtn: document.getElementById("startAnalysisBtn"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    backToImportBtn: document.getElementById("backToImportBtn"),
    toggleSidebarBtn: document.getElementById("toggleSidebarBtn"),
    applyFiltersBtn: document.getElementById("applyFiltersBtn"),
    toggleFiltersBtn: document.getElementById("toggleFiltersBtn"),
    activeScopeSummary: document.getElementById("activeScopeSummary"),
    analysisBreadcrumb: document.getElementById("analysisBreadcrumb"),
    analysisPageHint: document.getElementById("analysisPageHint"),
    summaryText: document.getElementById("summaryText"),
    asOfText: document.getElementById("asOfText"),
    projectSelect: document.getElementById("projectSelect"),
    monthSelect: document.getElementById("monthSelect"),
    weekSelect: document.getElementById("weekSelect"),
    campSelect: document.getElementById("campSelect"),
    groupSelect: document.getElementById("groupSelect"),
    smallGroupSelect: document.getElementById("smallGroupSelect"),
    overviewMetrics: document.getElementById("overviewMetrics"),
    overviewPulse: document.getElementById("overviewPulse"),
    activeCampCards: document.getElementById("activeCampCards"),
    yesterdayAnomalyFocus: document.getElementById("yesterdayAnomalyFocus"),
    yesterdayAnomalyTable: document.getElementById("yesterdayAnomalyTable"),
    recentClosedSummary: document.getElementById("recentClosedSummary"),
    recentClosedTable: document.getElementById("recentClosedTable"),
    projectCompareOverviewTable: document.getElementById("projectCompareOverviewTable"),
    projectCompareCumConv: document.getElementById("projectCompareCumConv"),
    projectCompareHmOrder: document.getElementById("projectCompareHmOrder"),
    projectCompareHmConv: document.getElementById("projectCompareHmConv"),
    projectCompareHmPending: document.getElementById("projectCompareHmPending"),
    projectCompareHmPendingConv: document.getElementById("projectCompareHmPendingConv"),
    projectCompareProcessCharts: document.getElementById("projectCompareProcessCharts"),
    projectCompareConversionCharts: document.getElementById("projectCompareConversionCharts"),
    projectCompareDecayCharts: document.getElementById("projectCompareDecayCharts"),
    projectCompareWarmOverviewTable: document.getElementById("projectCompareWarmOverviewTable"),
    anomalyList: document.getElementById("anomalyList"),
    actionList: document.getElementById("actionList"),
    riskRanking: document.getElementById("riskRanking"),
    groupAnomalyList: document.getElementById("groupAnomalyList"),
    qualityMetrics: document.getElementById("qualityMetrics"),
    qualityFieldTable: document.getElementById("qualityFieldTable"),
    qualityDayTable: document.getElementById("qualityDayTable"),
    qualityNotes: document.getElementById("qualityNotes"),
    filterPanel: document.querySelector(".filter-panel"),
    campViewDimensionSwitch: document.getElementById("campViewDimensionSwitch"),
    campOverviewTable: document.getElementById("campOverviewTable"),
    campOverviewExportCsvBtn: document.getElementById("campOverviewExportCsvBtn"),
    campOverviewExportPngBtn: document.getElementById("campOverviewExportPngBtn"),
    campInsightOpenBtn: document.getElementById("campInsightOpenBtn"),
    campInsightModal: document.getElementById("campInsightModal"),
    campInsightTitle: document.getElementById("campInsightTitle"),
    campInsightBody: document.getElementById("campInsightBody"),
    campInsightCopyBtn: document.getElementById("campInsightCopyBtn"),
    campInsightCloseBtn: document.getElementById("campInsightCloseBtn"),
    monthDrillPanel: document.getElementById("monthDrillPanel"),
    monthDrillTitle: document.getElementById("monthDrillTitle"),
    monthDrillPath: document.getElementById("monthDrillPath"),
    monthDrillHint: document.getElementById("monthDrillHint"),
    monthDrillTable: document.getElementById("monthDrillTable"),
    monthDrillBackBtn: document.getElementById("monthDrillBackBtn"),
    monthDrillResetBtn: document.getElementById("monthDrillResetBtn"),
    monthDrillPathModeBtn: document.getElementById("monthDrillPathModeBtn"),
    monthDrillExpandModeBtn: document.getElementById("monthDrillExpandModeBtn"),
    monthDrillExpandView: document.getElementById("monthDrillExpandView"),
    monthDrillGroupTable: document.getElementById("monthDrillGroupTable"),
    monthDrillSmallGroupTable: document.getElementById("monthDrillSmallGroupTable"),
    monthDrillClassTable: document.getElementById("monthDrillClassTable"),
    monthDrillGroupFilter: document.getElementById("monthDrillGroupFilter"),
    monthDrillSmallGroupFilter: document.getElementById("monthDrillSmallGroupFilter"),
    campEntityDrillPanel: document.getElementById("campEntityDrillPanel"),
    campEntityDrillTitle: document.getElementById("campEntityDrillTitle"),
    campEntityDrillPath: document.getElementById("campEntityDrillPath"),
    campEntityDrillHint: document.getElementById("campEntityDrillHint"),
    campEntityDrillTable: document.getElementById("campEntityDrillTable"),
    campEntityDrillBackBtn: document.getElementById("campEntityDrillBackBtn"),
    campEntityDrillResetBtn: document.getElementById("campEntityDrillResetBtn"),
    campEntityDrillPathModeBtn: document.getElementById("campEntityDrillPathModeBtn"),
    campEntityDrillExpandModeBtn: document.getElementById("campEntityDrillExpandModeBtn"),
    campEntityDrillExpandView: document.getElementById("campEntityDrillExpandView"),
    campEntityDrillGroupTable: document.getElementById("campEntityDrillGroupTable"),
    campEntityDrillSmallGroupTable: document.getElementById("campEntityDrillSmallGroupTable"),
    campEntityDrillClassTable: document.getElementById("campEntityDrillClassTable"),
    campEntityDrillGroupFilter: document.getElementById("campEntityDrillGroupFilter"),
    campEntityDrillSmallGroupFilter: document.getElementById("campEntityDrillSmallGroupFilter"),
    campProcessCharts: document.getElementById("campProcessCharts"),
    campConversionCharts: document.getElementById("campConversionCharts"),
    campDecayCharts: document.getElementById("campDecayCharts"),
    campRhythmDimensionSwitch: document.getElementById("campRhythmDimensionSwitch"),
    campByDayDimensionSwitch: document.getElementById("campByDayDimensionSwitch"),
    campHmPendingConv: document.getElementById("campHmPendingConv"),
    groupFocusChaseSwitch: document.getElementById("groupFocusChaseSwitch"),
    groupFocusByDaySwitch: document.getElementById("groupFocusByDaySwitch"),
    groupFocusByDaySelectAllBtn: document.getElementById("groupFocusByDaySelectAllBtn"),
    groupFocusByDayClearBtn: document.getElementById("groupFocusByDayClearBtn"),
    groupFocusProcessCharts: document.getElementById("groupFocusProcessCharts"),
    groupFocusConversionCharts: document.getElementById("groupFocusConversionCharts"),
    groupFocusDecayCharts: document.getElementById("groupFocusDecayCharts"),
    groupOrderRhythmSwitch: document.getElementById("groupOrderRhythmSwitch"),
    groupTrendDimensionSwitch: document.getElementById("groupTrendDimensionSwitch"),
    campWarmTimeDimensionSwitch: document.getElementById("campWarmTimeDimensionSwitch"),
    campWarmDimensionSwitch: document.getElementById("campWarmDimensionSwitch"),
    campWarmHeatmap: document.getElementById("campWarmHeatmap"),
    campWarmOverviewTable: document.getElementById("campWarmOverviewTable"),
    smallGroupFocusChaseSwitch: document.getElementById("smallGroupFocusChaseSwitch"),
    smallGroupFocusByDaySwitch: document.getElementById("smallGroupFocusByDaySwitch"),
    smallGroupFocusByDaySelectAllBtn: document.getElementById("smallGroupFocusByDaySelectAllBtn"),
    smallGroupFocusByDayClearBtn: document.getElementById("smallGroupFocusByDayClearBtn"),
    smallGroupFocusProcessCharts: document.getElementById("smallGroupFocusProcessCharts"),
    smallGroupFocusConversionCharts: document.getElementById("smallGroupFocusConversionCharts"),
    smallGroupFocusDecayCharts: document.getElementById("smallGroupFocusDecayCharts"),
    smallGroupOrderRhythmSwitch: document.getElementById("smallGroupOrderRhythmSwitch"),
    smallGroupTrendDimensionSwitch: document.getElementById("smallGroupTrendDimensionSwitch"),
    smallGroupRadarChart: document.getElementById("smallGroupRadarChart"),
    smallGroupRadarTable: document.getElementById("smallGroupRadarTable"),
    classMetrics: document.getElementById("classMetrics"),
    classRoiScatter: document.getElementById("classRoiScatter"),
    classHeatmapSmallGroupSwitch: document.getElementById("classHeatmapSmallGroupSwitch"),
    classAddRevenueSmallGroupSwitch: document.getElementById("classAddRevenueSmallGroupSwitch"),
    classHeatmapSearchInput: document.getElementById("classHeatmapSearchInput"),
    classWeeklyRoiHeatmap: document.getElementById("classWeeklyRoiHeatmap"),
    classWeeklyAddRevenueTable: document.getElementById("classWeeklyAddRevenueTable"),
    classByDayLeaderSelect: document.getElementById("classByDayLeaderSelect"),
    classByDayCampSelect: document.getElementById("classByDayCampSelect"),
    classByDayHint: document.getElementById("classByDayHint"),
    classByDayProcessCharts: document.getElementById("classByDayProcessCharts"),
    classByDayConversionCharts: document.getElementById("classByDayConversionCharts"),
    classByDayDecayCharts: document.getElementById("classByDayDecayCharts"),
    classCompareByDayCampSelect: document.getElementById("classCompareByDayCampSelect"),
    classCompareByDaySearchInput: document.getElementById("classCompareByDaySearchInput"),
    classCompareByDayHint: document.getElementById("classCompareByDayHint"),
    classCompareByDayProcessCharts: document.getElementById("classCompareByDayProcessCharts"),
    classCompareByDayConversionCharts: document.getElementById("classCompareByDayConversionCharts"),
    classCompareByDayDecayCharts: document.getElementById("classCompareByDayDecayCharts"),
    classTierDonut: document.getElementById("classTierDonut"),
    classTierGroupChart: document.getElementById("classTierGroupChart"),
    classTierSmallGroupChart: document.getElementById("classTierSmallGroupChart"),
    classTierCompareToggleBtn: document.getElementById("classTierCompareToggleBtn"),
    classTierCompareBody: document.getElementById("classTierCompareBody"),
    classTierCompareTable: document.getElementById("classTierCompareTable"),
    classTierProcessCharts: document.getElementById("classTierProcessCharts"),
    classTierConversionCharts: document.getElementById("classTierConversionCharts"),
    classTierDecayCharts: document.getElementById("classTierDecayCharts"),
    classTypeDonut: document.getElementById("classTypeDonut"),
    classTypeGroupChart: document.getElementById("classTypeGroupChart"),
    classTypeSmallGroupChart: document.getElementById("classTypeSmallGroupChart"),
    classTypeCompareToggleBtn: document.getElementById("classTypeCompareToggleBtn"),
    classTypeCompareBody: document.getElementById("classTypeCompareBody"),
    classTypeCompareTable: document.getElementById("classTypeCompareTable"),
    classTypeProcessCharts: document.getElementById("classTypeProcessCharts"),
    classTypeConversionCharts: document.getElementById("classTypeConversionCharts"),
    classTypeDecayCharts: document.getElementById("classTypeDecayCharts"),
    classFormatDonut: document.getElementById("classFormatDonut"),
    classFormatGroupChart: document.getElementById("classFormatGroupChart"),
    classFormatSmallGroupChart: document.getElementById("classFormatSmallGroupChart"),
    classFormatCompareToggleBtn: document.getElementById("classFormatCompareToggleBtn"),
    classFormatCompareBody: document.getElementById("classFormatCompareBody"),
    classFormatCompareTable: document.getElementById("classFormatCompareTable"),
    classFormatProcessCharts: document.getElementById("classFormatProcessCharts"),
    classFormatConversionCharts: document.getElementById("classFormatConversionCharts"),
    classFormatDecayCharts: document.getElementById("classFormatDecayCharts"),
    classTable: document.getElementById("classTable"),
    classTableSearchInput: document.getElementById("classTableSearchInput"),
    banImpactEmpty: document.getElementById("banImpactEmpty"),
    banImpactContent: document.getElementById("banImpactContent"),
    banCoverageHint: document.getElementById("banCoverageHint"),
    banInsightCopyBtn: document.getElementById("banInsightCopyBtn"),
    banImpactMetrics: document.getElementById("banImpactMetrics"),
    banInsightText: document.getElementById("banInsightText"),
    banDaySwitch: document.getElementById("banDaySwitch"),
    banDayDistribution: document.getElementById("banDayDistribution"),
    banCompareHint: document.getElementById("banCompareHint"),
    banConversionTrend: document.getElementById("banConversionTrend"),
    banConversionGap: document.getElementById("banConversionGap"),
    banPendingTrend: document.getElementById("banPendingTrend"),
    banPendingGap: document.getElementById("banPendingGap"),
    banPostImpact: document.getElementById("banPostImpact"),
    banProcessCharts: document.getElementById("banProcessCharts"),
    banGroupTable: document.getElementById("banGroupTable"),
    banDetailTable: document.getElementById("banDetailTable"),
    chartModal: document.getElementById("chartModal"),
    chartModalTitle: document.getElementById("chartModalTitle"),
    chartModalPlot: document.getElementById("chartModalPlot"),
    chartModalCloseBtn: document.getElementById("chartModalCloseBtn")
  }

  const state = {
    uploads: { class: null, limit: null },
    model: null,
    filters: {
      asOfDate: toDateOnly(new Date()),
      projects: [],
      months: [],
      weeks: [],
      camps: [],
      groups: [],
      smallGroups: []
    },
    draftFilters: {
      asOfDate: toDateOnly(new Date()),
      projects: [],
      months: [],
      weeks: [],
      camps: [],
      groups: [],
      smallGroups: []
    },
    ui: {
      activeTab: "overview",
      projectMS: null,
      monthMS: null,
      weekMS: null,
      campMS: null,
      groupMS: null,
      smallGroupMS: null,
      monthDrill: null,
      campEntityDrill: null,
      monthDrillMode: "path",
      campEntityDrillMode: "path",
      filterCollapsed: false,
      sidebarCollapsed: false,
      overviewFocusedCampId: null,
      campWarmDimension: "group",
      campWarmTimeDimension: "camp",
      campRhythmDimension: "camp",
      campByDayDimension: "camp",
      campViewDimension: "camp",
      campInsightText: "",
      banDay: "全部",
      banInsightCopyText: "",
      projectCompareOverviewExpanded: [],
      projectCompareWarmOverviewExpanded: [],
      campOverviewExpanded: [],
      campWarmOverviewExpanded: [],
      groupFocus: null,
      groupFocusCompare: [],
      groupByDayCamps: [],
      groupByDayCampsManuallyCleared: false,
      smallGroupFocus: null,
      smallGroupByDayCamps: [],
      smallGroupByDayCampsManuallyCleared: false,
      groupRhythmMetric: "orderShare",
      smallGroupRhythmMetric: "orderShare",
      groupTrendDimension: "camp",
      smallGroupTrendDimension: "camp",
      classHeatmapSmallGroup: "",
      classHeatmapSearch: "",
      classByDayLeader: "",
      classByDayCamp: "",
      classCompareByDayCamp: "",
      classCompareByDaySearch: "",
      classTierCompareCollapsed: true,
      classTypeCompareCollapsed: true,
      classFormatCompareCollapsed: true,
      classTierCompareExpanded: [],
      classTypeCompareExpanded: [],
      classTableSearch: "",
      classTableSort: "roiDesc",
      classTierDimension: "project",
      campBroadcasts: {}
    }
  }

  function toDateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  function formatDate(date) {
    if (!date || !Number.isFinite(date.getTime())) return "-"
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  function parseNumber(value) {
    if (value === null || value === undefined) return null
    if (typeof value === "number") return Number.isFinite(value) ? value : null
    const raw = String(value).trim()
    if (!raw) return null
    const cleaned = raw.replace(/[，,\s]/g, "")
    if (/^\d{1,2}[/-]\d{1,2}$/.test(cleaned)) return null
    if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(cleaned)) return null
    if (cleaned.includes(":")) return null
    const isPct = cleaned.endsWith("%")
    const num = parseFloat(isPct ? cleaned.slice(0, -1) : cleaned)
    if (!Number.isFinite(num)) return null
    return isPct ? num / 100 : num
  }

  function formatMoney(value) {
    if (!Number.isFinite(value)) return "-"
    const abs = Math.abs(value)
    if (abs >= 100000000) return `${(value / 100000000).toFixed(2)}亿`
    if (abs >= 10000) return `${(value / 10000).toFixed(2)}万`
    if (abs >= 1000) return value.toFixed(0)
    return value.toFixed(2)
  }

  function formatPct(value, digits = 1) {
    if (!Number.isFinite(value)) return "-"
    return `${(value * 100).toFixed(digits)}%`
  }

  function formatNum(value, digits = 2) {
    if (!Number.isFinite(value)) return "-"
    return value.toFixed(digits)
  }

  function trimTrailingZero(text) {
    return String(text).replace(/\.0($|[^\d])/, "$1")
  }

  function formatChartNumber(value) {
    if (!Number.isFinite(value)) return ""
    const abs = Math.abs(value)
    if (abs >= 10000) return trimTrailingZero(`${(value / 10000).toFixed(1)}万`)
    if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value))
    return trimTrailingZero(value.toFixed(1))
  }

  function formatChartPercent(value) {
    if (!Number.isFinite(value)) return ""
    return trimTrailingZero(`${(value * 100).toFixed(1)}%`)
  }

  function formatChartPercent2(value) {
    if (!Number.isFinite(value)) return ""
    return trimTrailingZero(`${(value * 100).toFixed(2)}%`)
  }

  function withValueLabels(traces, formatter = formatChartNumber) {
    return traces.map((trace) => {
      if (!Array.isArray(trace.y) || trace.type === "heatmap") return trace
      const next = { ...trace }
      next.text = trace.y.map((value) => formatter(value))
      next.textfont = { size: 10, color: PLOT_MUTED }
      next.cliponaxis = false
      next.textposition = trace.type === "bar" ? "outside" : "top center"
      if (trace.type === "scatter") {
        const mode = String(trace.mode || "lines+markers")
        next.mode = mode.includes("text") ? mode : `${mode}+text`
      }
      return next
    })
  }

  function normalizeField(field) {
    return String(field || "").replace(/[\u0000\uFEFF]/g, "").trim()
  }

  function uniq(arr) {
    return Array.from(new Set(arr))
  }

  function cloneFilters(filters) {
    return {
      asOfDate: filters.asOfDate ? toDateOnly(filters.asOfDate) : null,
      projects: (filters.projects || []).slice(),
      months: (filters.months || []).slice(),
      weeks: (filters.weeks || []).slice(),
      camps: (filters.camps || []).slice(),
      groups: (filters.groups || []).slice(),
      smallGroups: (filters.smallGroups || []).slice()
    }
  }

  function createEmptyFilters() {
    return {
      asOfDate: toDateOnly(new Date()),
      projects: [],
      months: [],
      weeks: [],
      camps: [],
      groups: [],
      smallGroups: []
    }
  }

  function normalizeProjectName(value) {
    const text = String(value || "").trim()
    return text || "默认项目"
  }

  function isMissingGroupName(value) {
    const text = String(value || "").trim()
    return !text || text === "暂无大组"
  }

  function normalizedGroupName(value) {
    const text = String(value || "").trim()
    return text || "暂无大组"
  }

  function normalizedSmallGroupName(value) {
    const text = String(value || "").trim()
    return text || "未知小组"
  }

  function buildGroupLookupBySmallGroup(rows, groupField, smallGroupField) {
    const counter = new Map()
    rows.forEach((row) => {
      const smallGroupName = String(row?.[smallGroupField] || "").trim()
      const groupName = normalizedGroupName(row?.[groupField])
      if (!smallGroupName || isMissingGroupName(groupName)) return
      if (!counter.has(smallGroupName)) counter.set(smallGroupName, new Map())
      const groupCounter = counter.get(smallGroupName)
      groupCounter.set(groupName, (groupCounter.get(groupName) || 0) + 1)
    })
    const lookup = new Map()
    counter.forEach((groupCounter, smallGroupName) => {
      const best = Array.from(groupCounter.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))[0]
      if (best?.[0]) lookup.set(smallGroupName, best[0])
    })
    return lookup
  }

  function latestLeaderOrgRecord(prev, next) {
    if (!prev) return next
    const prevTime = prev.startDate && Number.isFinite(prev.startDate.getTime()) ? prev.startDate.getTime() : -Infinity
    const nextTime = next.startDate && Number.isFinite(next.startDate.getTime()) ? next.startDate.getTime() : -Infinity
    if (nextTime !== prevTime) return nextTime > prevTime ? next : prev
    const prevCamp = String(prev.campId || "")
    const nextCamp = String(next.campId || "")
    if (nextCamp !== prevCamp) return nextCamp.localeCompare(prevCamp, "zh-CN", { numeric: true }) > 0 ? next : prev
    return next.rowIndex > prev.rowIndex ? next : prev
  }

  function buildLeaderOrgLookup(rows, meta) {
    const lookup = new Map()
    rows.forEach((row, rowIndex) => {
      const leaderName = String(row?.[meta.leaderField] || row?.[meta.classField] || "").trim()
      if (!leaderName) return
      const projectName = normalizeProjectName(row?.[meta.projectField])
      const record = {
        rowIndex,
        campId: row?.[meta.campField],
        startDate: parseStartDate(row?.[meta.startField]),
        groupName: normalizedGroupName(row?.[meta.groupField]),
        smallGroupName: normalizedSmallGroupName(row?.[meta.smallGroupField])
      }
      const key = `${projectName}__${leaderName}`
      lookup.set(key, latestLeaderOrgRecord(lookup.get(key), record))
    })
    return lookup
  }

  function rowWeekKey(row, meta) {
    const direct = String(row?._开营周起始 || "").trim()
    if (direct) return direct
    const fallback = weekInfo(parseStartDate(row?.[meta.startField]))
    return fallback?.key || ""
  }

  function rowWeekLabel(row, meta) {
    const direct = String(row?._开营周 || "").trim()
    if (direct) return direct
    const fallback = weekInfo(parseStartDate(row?.[meta.startField]))
    return fallback?.label || ""
  }

  function warmMetricValue(row, fieldNames) {
    return firstMetric(row, null, fieldNames)
  }

  function normalizeRateLikeValue(value) {
    if (!Number.isFinite(value)) return null
    if (value > 1 && value <= 100) return value / 100
    return value
  }

  function weightedAverageByAdds(rows, fieldName) {
    let numerator = 0
    let denominator = 0
    rows.forEach((row) => {
      const addsValue = rowAdds(row)
      const metricValue = firstMetric(row, null, [fieldName])
      if (!Number.isFinite(addsValue) || !Number.isFinite(metricValue)) return
      numerator += addsValue * metricValue
      denominator += addsValue
    })
    return denominator > 0 ? numerator / denominator : null
  }

  function stageLabel(item) {
    if (!item) return "-"
    if (item.status === "已结营") return "已结营"
    if (item.status === "未开始") return "未开始"
    return Number.isFinite(item.day) && item.day > 0 ? `Day${item.day}` : "进行中"
  }

  function stageTagClass(item) {
    if (!item) return "neutral"
    if (item.status === "已结营") return "good"
    if (item.status === "未开始") return "neutral"
    return "warn"
  }

  function stageTag(item) {
    return `<span class="tag ${stageTagClass(item)}">${stageLabel(item)}</span>`
  }

  function recentMonthValues(months, count = 2) {
    const ordered = uniq(months.filter((item) => item !== null)).sort((a, b) => a - b)
    return ordered.slice(Math.max(0, ordered.length - count))
  }

  function sum(values) {
    const valid = values.filter((value) => Number.isFinite(value))
    return valid.length ? valid.reduce((acc, value) => acc + value, 0) : null
  }

  function avg(values) {
    const valid = values.filter((value) => Number.isFinite(value))
    return valid.length ? valid.reduce((acc, value) => acc + value, 0) / valid.length : null
  }

  function max(values) {
    const valid = values.filter((value) => Number.isFinite(value))
    return valid.length ? Math.max(...valid) : null
  }

  function stdDev(values) {
    const valid = values.filter((value) => Number.isFinite(value))
    if (!valid.length) return null
    const mean = valid.reduce((acc, value) => acc + value, 0) / valid.length
    const variance = valid.reduce((acc, value) => acc + (value - mean) ** 2, 0) / valid.length
    return Math.sqrt(variance)
  }

  function valueRange(values) {
    const valid = values.filter((value) => Number.isFinite(value))
    if (!valid.length) return null
    return Math.max(...valid) - Math.min(...valid)
  }

  function ratio(numerator, denominator) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null
    return numerator / denominator
  }

  function median(values) {
    const valid = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
    if (!valid.length) return 0
    const mid = Math.floor(valid.length / 2)
    return valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2
  }

  function groupBy(rows, keyFn) {
    const map = new Map()
    rows.forEach((row) => {
      const key = keyFn(row)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(row)
    })
    return map
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error || new Error("读取文件失败"))
      reader.readAsArrayBuffer(file)
    })
  }

  function decodeText(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer)
    let encoding = "utf-8"
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le"
    else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be"
    else if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) encoding = "utf-8"
    try {
      return { text: new TextDecoder(encoding).decode(arrayBuffer), encoding }
    } catch {
      return { text: new TextDecoder("utf-8").decode(arrayBuffer), encoding: "utf-8" }
    }
  }

  function detectDelimiter(text) {
    const firstLine = String(text).split(/\r?\n/)[0] || ""
    const tabs = (firstLine.match(/\t/g) || []).length
    const commas = (firstLine.match(/,/g) || []).length
    return tabs >= commas ? "\t" : ","
  }

  async function parseCsvFile(file) {
    const buffer = await readFileAsArrayBuffer(file)
    const decoded = decodeText(buffer)
    const cleaned = String(decoded.text).replace(/\u0000/g, "").replace(/^\uFEFF/, "")
    const delimiter = detectDelimiter(cleaned)
    const parsed = await new Promise((resolve, reject) => {
      Papa.parse(cleaned, {
        header: true,
        delimiter,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      })
    })
    return {
      rows: (parsed.data || []).map((row) => {
        const next = {}
        Object.entries(row).forEach(([key, value]) => {
          const kk = normalizeField(key)
          if (!kk) return
          next[kk] = typeof value === "string" ? value.replace(/[\u0000\uFEFF]/g, "").trim() : value
        })
        return next
      }),
      fields: (parsed.meta?.fields || []).map(normalizeField),
      encoding: decoded.encoding,
      delimiter
    }
  }

  function pickField(fields, candidates) {
    const set = new Set(fields)
    return candidates.find((candidate) => set.has(candidate)) || null
  }

  function parseStartDate(raw) {
    if (raw === null || raw === undefined) return null
    const str = String(raw).replace(/[\u0000\uFEFF]/g, "").trim()
    if (!str) return null
    const normalized = str.replace(/[年/\\.]/g, "-").replace(/[月]/g, "-").replace(/[日]/g, "")
    const nums = normalized.match(/\d+/g) || []
    if (nums.length < 2) return null
    let year = YEAR_FALLBACK
    let month = null
    let day = null
    if (nums.length >= 3 && nums[0].length === 4) {
      year = Number(nums[0])
      month = Number(nums[1])
      day = Number(nums[2])
    } else if (nums.length >= 3 && nums[2].length === 4) {
      year = Number(nums[2])
      month = Number(nums[0])
      day = Number(nums[1])
    } else {
      month = Number(nums[0])
      day = Number(nums[1])
    }
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
    const date = new Date(year, month - 1, day)
    return Number.isFinite(date.getTime()) ? toDateOnly(date) : null
  }

  function startOfWeek(date) {
    if (!date || !Number.isFinite(date.getTime())) return null
    const normalized = toDateOnly(date)
    const offset = (normalized.getDay() + 6) % 7
    return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate() - offset)
  }

  function endOfWeek(date) {
    const start = startOfWeek(date)
    return start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6) : null
  }

  function weekInfo(date) {
    const startDate = startOfWeek(date)
    const endDate = endOfWeek(date)
    if (!startDate || !endDate) return null
    return {
      key: formatDate(startDate),
      startDate,
      endDate,
      label: `${formatDate(startDate)}~${formatDate(endDate)}`,
      shortLabel: `${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}~${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`
    }
  }

  function computeStatus(startDate, asOfDate) {
    if (!startDate) return { status: "未知", day: null, endDate: null }
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6)
    if (asOfDate < startDate) return { status: "未开始", day: 0, endDate }
    if (asOfDate > endDate) return { status: "已结营", day: 7, endDate }
    return {
      status: "进行中",
      day: Math.min(7, Math.max(1, Math.floor((asOfDate - startDate) / 86400000) + 1)),
      endDate
    }
  }

  function firstMetric(primary, secondary, candidates) {
    for (const candidate of candidates) {
      const a = parseNumber(primary?.[candidate])
      if (a !== null) return a
      const b = parseNumber(secondary?.[candidate])
      if (b !== null) return b
    }
    return null
  }

  function byFields(primary, secondary, fields) {
    const values = fields.map((field) => firstMetric(primary, secondary, [field])).filter((value) => value !== null)
    return values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : null
  }

  function normalizeMonth(...candidates) {
    for (const candidate of candidates) {
      const parsed = parseNumber(candidate)
      if (parsed !== null && Number.isFinite(parsed)) return Math.round(parsed)
    }
    return null
  }

  function cleanClassName(value) {
    let text = String(value || "").trim()
    if (!text) return ""
    text = text.replace(/[（(].*$/, "")
    text = text.replace(/尾量/g, "")
    text = text.replace(/\*.*/, "")
    return text.trim()
  }

  function normalizeBanClassKey(value) {
    return String(value || "").replace(/\s+/g, " ").trim()
  }

  function firstNonEmpty(rows, candidates) {
    for (const row of rows) {
      for (const key of candidates) {
        const value = row?.[key]
        if (value !== null && value !== undefined && String(value).trim() !== "") return value
      }
    }
    return null
  }

  function rowAdds(row) {
    return firstMetric(row, null, ["添加人数", "添加", "加微人数"])
  }

  function rowConv(row) {
    return firstMetric(row, null, ["转化人数", "转化", "成单人数"])
  }

  function rowRevenue(row) {
    return firstMetric(row, null, ["流水", "产值", "GMV"])
  }

  function rowCost(row) {
    return firstMetric(row, null, ["_映射成本", "总成本", "成本", "投放成本", "消耗"])
  }

  function rowAcquire(row) {
    return firstMetric(row, null, ["_映射获客", "营期外投获客人数", "获客", "获客量"])
  }

  function rowPendingRate(row, day = null) {
    return day === null
      ? firstMetric(row, null, ["待支付率", "待支付比例"])
      : firstMetric(row, null, [`day${day}待支付率`])
  }

  function rowPendingConvRate(row, day = null) {
    return day === null
      ? firstMetric(row, null, ["待支付转率", "待支付转化", "待支付转化率"])
      : firstMetric(row, null, [`day${day}待支付转率`])
  }

  function rowConvRate(row, day = null) {
    return day === null
      ? firstMetric(row, null, ["转率", "转化率"])
      : firstMetric(row, null, [`day${day}转率`])
  }

  function rowIndividualShare(row) {
    return firstMetric(row, null, ["个销占比", "个销比例", "个销占比(%)", "个销占比%"])
  }

  function rowOrderShare(row, day) {
    return firstMetric(row, null, [`day${day}出单占比`, `day${day}出单比例`, `day${day}出单占比%`])
  }

  function rowAttendPeople(row, day) {
    const direct = firstMetric(row, null, [`_day${day}到播人数`, `day${day}到播人数`])
    if (Number.isFinite(direct)) return direct
    const addsValue = rowAdds(row)
    const attendRate = normalizeRateLikeValue(firstMetric(row, null, [`day${day}到播`]))
    return Number.isFinite(addsValue) && Number.isFinite(attendRate) ? addsValue * attendRate : null
  }

  function rowLiveOrderCount(row, day) {
    const direct = firstMetric(row, null, [`_day${day}直播单数`, `day${day}直播单数`])
    if (Number.isFinite(direct)) return direct
    const attendPeople = rowAttendPeople(row, day)
    const attendConvRate = normalizeRateLikeValue(firstMetric(row, null, [`day${day}到播转率`]))
    if (Number.isFinite(attendPeople) && Number.isFinite(attendConvRate)) return attendPeople * attendConvRate
    const addsValue = rowAdds(row)
    const liveRoomConvRate = normalizeRateLikeValue(firstMetric(row, null, [`day${day}直播间转率`, `day${day}直播转率`]))
    return Number.isFinite(addsValue) && Number.isFinite(liveRoomConvRate) ? addsValue * liveRoomConvRate : null
  }

  function rowIndividualOrderCount(row, day) {
    const direct = firstMetric(row, null, [`_day${day}个销单数`, `day${day}个销单数`])
    if (Number.isFinite(direct)) return direct
    const addsValue = rowAdds(row)
    const individualConvRate = normalizeRateLikeValue(firstMetric(row, null, [`day${day}个销转率`]))
    return Number.isFinite(addsValue) && Number.isFinite(individualConvRate) ? addsValue * individualConvRate : null
  }

  function rowClassName(row) {
    return cleanClassName(firstNonEmpty([row], ["班级", "班级名称", "班长"]) || "")
  }

  function rowClassType(row) {
    const raw = String(firstNonEmpty([row], ["班型", "班级类型", "类型"]) || "").trim()
    if (/小班/.test(raw)) return "小班"
    if (/中班/.test(raw)) return "中班"
    if (/大班/.test(raw)) return "大班"
    const machineSlots = firstMetric(row, null, ["机器号数"])
    if (machineSlots === 1) return "小班"
    if (machineSlots === 2) return "中班"
    if (machineSlots === 3) return "大班"
    return null
  }

  function rowMachineSlots(row) {
    const classType = rowClassType(row)
    if (classType === "小班") return 1
    if (classType === "中班") return 2
    if (classType === "大班") return 3
    const direct = firstMetric(row, null, ["机器号数"])
    return Number.isFinite(direct) ? Math.round(direct) : null
  }

  function aggregateUnifiedRows(rows) {
    if (!rows.length) return {}
    const out = { ...rows[0] }
    const meta = currentMeta()
    const adds = sum(rows.map(rowAdds))
    const conv = sum(rows.map(rowConv))
    const revenue = sum(rows.map(rowRevenue))
    const cost = sum(rows.map(rowCost))
    const acquire = sum(rows.map(rowAcquire))
    const pendingPeople = sum(rows.map((row) => {
      const addsValue = rowAdds(row)
      const pendingRate = rowPendingRate(row)
      return Number.isFinite(addsValue) && Number.isFinite(pendingRate) ? addsValue * pendingRate : null
    }))
    const pendingConvPeople = sum(rows.map((row) => {
      const addsValue = rowAdds(row)
      const pendingRate = rowPendingRate(row)
      const pendingConvRate = rowPendingConvRate(row)
      return Number.isFinite(addsValue) && Number.isFinite(pendingRate) && Number.isFinite(pendingConvRate)
        ? addsValue * pendingRate * pendingConvRate
        : null
    }))
    const individualRevenue = sum(rows.map((row) => {
      const revenueValue = rowRevenue(row)
      const share = rowIndividualShare(row)
      return Number.isFinite(revenueValue) && Number.isFinite(share) ? revenueValue * share : null
    }))
    const classEntityMap = new Map()
    rows.forEach((row, index) => {
      const campId = String(row[meta.campField] || "").trim() || `__camp_${index}`
      const className = rowClassName(row) || `__row_${index}`
      const key = `${campId}__${className}`
      if (!classEntityMap.has(key)) {
        classEntityMap.set(key, {
          key,
          campId,
          className,
          machineSlots: rowMachineSlots(row),
          classType: rowClassType(row)
        })
      }
    })
    const classEntities = Array.from(classEntityMap.values())
    const leaderCount = classEntities.filter((item) => !item.className.startsWith("__row_")).length || classEntities.length
    const machineSlots = sum(classEntities.map((item) => item.machineSlots))
    const upgradeNumerator = classEntities.filter((item) => item.classType === "中班" || item.classType === "大班" || item.machineSlots >= 2).length
    const upgradeDenominator = classEntities.length

    if (Number.isFinite(cost)) {
      out.总成本 = cost
      out.成本 = cost
    }
    if (Number.isFinite(acquire)) {
      out.营期外投获客人数 = acquire
      out.获客 = acquire
    }
    if (Number.isFinite(adds)) out.添加人数 = adds
    if (Number.isFinite(conv)) out.转化人数 = conv
    if (Number.isFinite(revenue)) out.流水 = revenue
    if (Number.isFinite(ratio(revenue, cost))) out.ROI = ratio(revenue, cost)
    if (Number.isFinite(ratio(conv, adds))) out.转率 = ratio(conv, adds)
    if (Number.isFinite(ratio(pendingPeople, adds))) out.待支付率 = ratio(pendingPeople, adds)
    if (Number.isFinite(ratio(pendingConvPeople, pendingPeople))) out.待支付转率 = ratio(pendingConvPeople, pendingPeople)
    if (Number.isFinite(ratio(individualRevenue, revenue))) out.个销占比 = ratio(individualRevenue, revenue)
    if (leaderCount) out._班长数 = leaderCount
    if (Number.isFinite(machineSlots)) out.机器号数 = machineSlots
    if (upgradeDenominator) {
      out._升班分子 = upgradeNumerator
      out._升班分母 = upgradeDenominator
      out.升班率 = ratio(upgradeNumerator, upgradeDenominator)
    }
    if (Number.isFinite(pendingPeople)) out._待支付人数 = pendingPeople
    if (Number.isFinite(pendingConvPeople)) out._待支付转化人数 = pendingConvPeople
    if (Number.isFinite(individualRevenue)) out._个销流水 = individualRevenue
    const warmGroupIn = avg(rows.map((row) => normalizeRateLikeValue(warmMetricValue(row, ["保温进群"]))))
    const warmAttend = avg(rows.map((row) => normalizeRateLikeValue(warmMetricValue(row, ["保温到播"]))))
    const warmBlacklist = avg(rows.map((row) => normalizeRateLikeValue(warmMetricValue(row, ["保温拉黑"]))))
    const day0Speak = avg(rows.map((row) => normalizeRateLikeValue(warmMetricValue(row, ["day0发言"]))))
    const highImmerseRate = avg(rows.map((row) => normalizeRateLikeValue(warmMetricValue(row, ["高沉浸率"]))))
    const highImmerseConvRate = avg(rows.map((row) => normalizeRateLikeValue(warmMetricValue(row, ["高沉浸转率"]))))
    if (Number.isFinite(warmGroupIn)) out.保温进群 = warmGroupIn
    if (Number.isFinite(warmAttend)) out.保温到播 = warmAttend
    if (Number.isFinite(warmBlacklist)) out.保温拉黑 = warmBlacklist
    if (Number.isFinite(day0Speak)) out.day0发言 = day0Speak
    if (Number.isFinite(highImmerseRate)) out.高沉浸率 = highImmerseRate
    if (Number.isFinite(highImmerseConvRate)) out.高沉浸转率 = highImmerseConvRate

    for (let day = 1; day <= 7; day += 1) {
      ;["晨读", "到播", "留存", "发言", "回复", "回复时长"].forEach((suffix) => {
        const weighted = weightedAverageByAdds(rows, `day${day}${suffix}`)
        if (Number.isFinite(weighted)) out[`day${day}${suffix}`] = weighted
      })
    }

    for (let day = 3; day <= 7; day += 1) {
      const dayAttendPeople = sum(rows.map((row) => rowAttendPeople(row, day)))
      const dayLiveOrders = sum(rows.map((row) => rowLiveOrderCount(row, day)))
      const dayIndividualOrders = sum(rows.map((row) => rowIndividualOrderCount(row, day)))
      const dayPendingPeople = sum(rows.map((row) => {
        const addsValue = rowAdds(row)
        const rate = rowPendingRate(row, day)
        return Number.isFinite(addsValue) && Number.isFinite(rate) ? addsValue * rate : null
      }))
      const dayPendingConvPeople = sum(rows.map((row) => {
        const addsValue = rowAdds(row)
        const pendingRate = rowPendingRate(row, day)
        const pendingConvRate = rowPendingConvRate(row, day)
        return Number.isFinite(addsValue) && Number.isFinite(pendingRate) && Number.isFinite(pendingConvRate)
          ? addsValue * pendingRate * pendingConvRate
          : null
      }))
      const dayOrderContribution = sum(rows.map((row) => {
        const convValue = rowConv(row)
        const share = rowOrderShare(row, day)
        return Number.isFinite(convValue) && Number.isFinite(share) ? convValue * share : null
      }))
      const dayOrders = sum(rows.map((row) => firstMetric(row, null, [`day${day}单数`])))
      const effectiveDayOrders = Number.isFinite(dayOrders) ? dayOrders : dayOrderContribution

      if (Number.isFinite(dayAttendPeople)) out[`_day${day}到播人数`] = dayAttendPeople
      if (Number.isFinite(dayLiveOrders)) out[`_day${day}直播单数`] = dayLiveOrders
      if (Number.isFinite(dayIndividualOrders)) out[`_day${day}个销单数`] = dayIndividualOrders
      if (Number.isFinite(ratio(effectiveDayOrders, adds))) out[`day${day}转率`] = ratio(effectiveDayOrders, adds)
      if (Number.isFinite(ratio(dayLiveOrders, dayAttendPeople))) out[`day${day}到播转率`] = ratio(dayLiveOrders, dayAttendPeople)
      if (Number.isFinite(ratio(dayLiveOrders, adds))) {
        out[`day${day}直播间转率`] = ratio(dayLiveOrders, adds)
        out[`day${day}直播转率`] = ratio(dayLiveOrders, adds)
      }
      if (Number.isFinite(ratio(dayIndividualOrders, adds))) out[`day${day}个销转率`] = ratio(dayIndividualOrders, adds)
      if (Number.isFinite(ratio(dayPendingPeople, adds))) out[`day${day}待支付率`] = ratio(dayPendingPeople, adds)
      if (Number.isFinite(ratio(dayPendingConvPeople, dayPendingPeople))) out[`day${day}待支付转率`] = ratio(dayPendingConvPeople, dayPendingPeople)
      if (Number.isFinite(dayOrders)) out[`day${day}单数`] = dayOrders
      else if (Number.isFinite(dayOrderContribution)) out[`day${day}单数`] = dayOrderContribution
      if (Number.isFinite(ratio(dayOrderContribution, conv))) out[`day${day}出单占比`] = ratio(dayOrderContribution, conv)
    }

    const exampleCost = firstNonEmpty(rows, ["例子成本"])
    if (exampleCost !== null) out.例子成本 = exampleCost
    return out
  }

  function compareStart(a, b) {
    const ta = a.startDate ? a.startDate.getTime() : 0
    const tb = b.startDate ? b.startDate.getTime() : 0
    if (ta !== tb) return ta - tb
    if (a.campId !== b.campId) return String(a.campId || "").localeCompare(String(b.campId || ""), "zh-CN", { numeric: true })
    return String(a.groupName || "").localeCompare(String(b.groupName || ""), "zh-CN")
  }

  function snapshotBase({ type, campId, projectName, groupName, month, raw, supplement, startDate, status }) {
    const week = weekInfo(startDate)
    const cost = firstMetric(raw, supplement, ["_映射成本", "总成本", "成本", "投放成本", "消耗"])
    const acquire = firstMetric(raw, supplement, ["_映射获客", "营期外投获客人数", "获客", "获客量"])
    const revenue = firstMetric(raw, supplement, ["流水", "产值", "GMV"])
    const adds = firstMetric(raw, supplement, ["添加人数", "添加", "加微人数"])
    const conv = firstMetric(raw, supplement, ["转化人数", "转化", "成单人数"])
    const roi = ratio(revenue, cost) ?? firstMetric(raw, supplement, ["ROI"])
    const convRate = ratio(conv, adds) ?? firstMetric(raw, supplement, ["转率", "转化率"])
    const individualShare = firstMetric(raw, supplement, ["个销占比", "个销比例", "个销占比(%)", "个销占比%"])
    const pendingRate = firstMetric(raw, supplement, ["待支付率", "待支付比例"])
    const pendingConv = firstMetric(raw, supplement, ["待支付转率", "待支付转化", "待支付转化率"])
    return {
      type,
      campId,
      projectName: normalizeProjectName(projectName),
      groupName,
      month,
      weekKey: week?.key || "",
      weekLabel: week?.label || "",
      weekShortLabel: week?.shortLabel || "",
      weekStartDate: week?.startDate || null,
      raw,
      supplement,
      startDate,
      endDate: status.endDate,
      status: status.status,
      day: status.day,
      metrics: {
        cost,
        acquire,
        revenue,
        adds,
        conv,
        leaderCount: parseNumber(raw?._班长数),
        machineSlots: firstMetric(raw, supplement, ["机器号数"]),
        roi,
        convRate,
        upgradeRate: firstMetric(raw, supplement, ["升班率"]),
        individualShare,
        pendingRate,
        pendingConv,
        addCost: ratio(cost, adds),
        addRevenue: ratio(revenue, adds),
        aov: ratio(revenue, conv),
        personEfficiency: ratio(adds, parseNumber(raw?._班长数)),
        machineLoad: ratio(adds, firstMetric(raw, supplement, ["机器号数"])),
        replyTime: byFields(raw, supplement, [1, 2, 3, 4, 5].map((d) => `day${d}回复时长`)),
        speakRate: byFields(raw, supplement, [1, 2, 3, 4, 5].map((d) => `day${d}发言`))
      }
    }
  }

  const MONTH_DRILL_METRICS = [
    { key: "personEfficiency", label: "人效", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", value: (item) => item.metrics.personEfficiency },
    { key: "machineLoad", label: "单号承载", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", value: (item) => item.metrics.machineLoad },
    { key: "upgradeRate", label: "升班率", formatter: formatPct, better: "high", value: (item) => item.metrics.upgradeRate },
    { key: "aov", label: "客单价", formatter: formatMoney, better: "high", value: (item) => item.metrics.aov },
    { key: "adds", label: "添加人数", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", value: (item) => item.metrics.adds },
    { key: "addCost", label: "添加成本", formatter: formatMoney, better: "low", value: (item) => item.metrics.addCost },
    { key: "addRevenue", label: "添加产值", formatter: formatMoney, better: "high", value: (item) => item.metrics.addRevenue },
    { key: "roi", label: "ROI", formatter: (value) => formatNum(value, 2), better: "high", value: (item) => item.metrics.roi },
    { key: "convRate", label: "转率", formatter: formatPct, better: "high", value: (item) => item.metrics.convRate },
    { key: "individualShare", label: "个销占比", formatter: formatPct, better: "high", value: (item) => item.metrics.individualShare },
    { key: "pendingRate", label: "待支付率", formatter: formatPct, better: "low", value: (item) => item.metrics.pendingRate },
    { key: "pendingConv", label: "待支付转率", formatter: formatPct, better: "high", value: (item) => item.metrics.pendingConv },
    { key: "replyTime", label: "回复时长", formatter: (value) => formatNum(value, 0), better: "low", value: (item) => item.metrics.replyTime }
  ]

  const CAMP_ENTITY_DRILL_METRICS = [
    { key: "leaderCount", label: "班长数", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", compare: false, value: (item) => item.metrics.leaderCount },
    { key: "machineSlots", label: "机器号数", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", compare: false, value: (item) => item.metrics.machineSlots },
    { key: "personEfficiency", label: "人效", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", compare: true, value: (item) => item.metrics.personEfficiency },
    { key: "upgradeRate", label: "升班率", formatter: formatPct, better: "high", compare: false, value: (item) => item.metrics.upgradeRate },
    { key: "aov", label: "客单价", formatter: formatMoney, better: "high", compare: true, value: (item) => item.metrics.aov },
    { key: "adds", label: "添加人数", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", compare: false, value: (item) => item.metrics.adds },
    { key: "conv", label: "转化人数", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", compare: false, value: (item) => item.metrics.conv },
    { key: "day3OrderShare", label: "Day3占比", formatter: formatPct, better: "high", compare: false, value: (item) => firstMetric(item.raw, item.supplement, ["day3出单占比"]) },
    { key: "day4OrderShare", label: "Day4占比", formatter: formatPct, better: "high", compare: false, value: (item) => firstMetric(item.raw, item.supplement, ["day4出单占比"]) },
    { key: "day5OrderShare", label: "Day5占比", formatter: formatPct, better: "high", compare: false, value: (item) => firstMetric(item.raw, item.supplement, ["day5出单占比"]) },
    { key: "day6OrderShare", label: "Day6占比", formatter: formatPct, better: "high", compare: false, value: (item) => firstMetric(item.raw, item.supplement, ["day6出单占比"]) },
    { key: "day7OrderShare", label: "Day7占比", formatter: formatPct, better: "high", compare: false, value: (item) => firstMetric(item.raw, item.supplement, ["day7出单占比"]) },
    { key: "addCost", label: "添加成本", formatter: formatMoney, better: "low", compare: false, value: (item) => item.metrics.addCost },
    { key: "addRevenue", label: "添加产值", formatter: formatMoney, better: "high", compare: false, value: (item) => item.metrics.addRevenue },
    { key: "roi", label: "ROI", formatter: (value) => formatNum(value, 2), better: "high", compare: true, value: (item) => item.metrics.roi },
    { key: "convRate", label: "转率", formatter: formatPct, better: "high", compare: false, value: (item) => item.metrics.convRate },
    { key: "individualShare", label: "个销占比", formatter: formatPct, better: "high", compare: true, value: (item) => item.metrics.individualShare },
    { key: "pendingRate", label: "待支付率", formatter: formatPct, better: "low", compare: true, value: (item) => item.metrics.pendingRate },
    { key: "pendingConv", label: "待支付转率", formatter: formatPct, better: "high", compare: false, value: (item) => item.metrics.pendingConv },
    { key: "replyTime", label: "回复时长", formatter: (value) => formatNum(value, 0), better: "low", compare: true, value: (item) => item.metrics.replyTime }
  ]

  const GROUP_COMPARE_METRICS = [
    { key: "roi", label: "ROI", formatter: (value) => formatNum(value, 2), better: "high", value: (item) => item.roi },
    { key: "personEfficiency", label: "人效", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", value: (item) => item.personEfficiency },
    { key: "convRate", label: "转率", formatter: formatPct, better: "high", value: (item) => item.convRate },
    { key: "addRevenue", label: "添加产值", formatter: formatMoney, better: "high", value: (item) => item.addRevenue },
    { key: "aov", label: "客单价", formatter: formatMoney, better: "high", value: (item) => item.aov },
    { key: "individualShare", label: "个销占比", formatter: formatPct, better: "high", value: (item) => item.individualShare },
    { key: "pendingRate", label: "待支付率", formatter: formatPct, better: "low", value: (item) => item.pendingRate },
    { key: "pendingConv", label: "待支付转率", formatter: formatPct, better: "high", value: (item) => item.pendingConv }
  ]

  const GROUP_TREND_SPECS = [
    { chartId: "groupTrendRoi", label: "ROI", tickformat: null, value: (item) => item.roi },
    { chartId: "groupTrendConvRate", label: "转率", tickformat: ".1%", value: (item) => item.convRate },
    { chartId: "groupTrendAddRevenue", label: "添加产值", tickformat: null, value: (item) => item.addRevenue },
    { chartId: "groupTrendIndividualShare", label: "个销占比", tickformat: ".1%", value: (item) => item.individualShare },
    { chartId: "groupTrendPendingRate", label: "待支付率", tickformat: ".1%", value: (item) => item.pendingRate },
    { chartId: "groupTrendPendingConv", label: "待支付转率", tickformat: ".1%", value: (item) => item.pendingConv },
    { chartId: "groupTrendEfficiency", label: "人效", tickformat: null, value: (item) => item.personEfficiency },
    { chartId: "groupTrendAov", label: "客单价", tickformat: null, value: (item) => item.aov }
  ]

  const SMALL_GROUP_TREND_SPECS = GROUP_TREND_SPECS.map((spec) => ({
    ...spec,
    chartId: spec.chartId.replace(/^group/, "smallGroup")
  }))

  const ENTITY_HEATMAP_METRICS = [
    { key: "roi", label: "ROI", formatter: (value) => formatNum(value, 2), better: "high", value: (item) => item.roi },
    { key: "roiStd", label: "ROI标准差", formatter: (value) => formatNum(value, 2), better: "low", value: (item) => item.roiStd },
    { key: "roiRange", label: "ROI极差", formatter: (value) => formatNum(value, 2), better: "low", value: (item) => item.roiRange },
    ...GROUP_COMPARE_METRICS.slice(1)
  ]

  const ENTITY_ANALYSIS_CONFIG = {
    group: {
      label: "大组",
      metricHostId: "groupCompareMetrics",
      heatmapId: "groupCompareHeatmap",
      orderRhythmHeatmapId: "groupOrderRhythmHeatmap",
      orderRhythmSwitch: dom.groupOrderRhythmSwitch,
      orderRhythmStateKey: "groupRhythmMetric",
      trendTableId: "groupTrendTable",
      trendSpecs: GROUP_TREND_SPECS,
      trendDimensionSwitch: dom.groupTrendDimensionSwitch,
      trendDimensionStateKey: "groupTrendDimension",
      focusStateKey: "groupFocus",
      focusChaseSwitch: dom.groupFocusChaseSwitch,
      focusByDaySwitch: dom.groupFocusByDaySwitch,
      processChartsHost: dom.groupFocusProcessCharts,
      conversionChartsHost: dom.groupFocusConversionCharts,
      decayChartsHost: dom.groupFocusDecayCharts,
      focusChartIds: {
        day3Pending: "groupFocusTrendDay3Pending",
        day3ConvChase: "groupFocusTrendDay3ConvChase",
        d6d7ConvChase: "groupFocusTrendD6D7ConvChase"
      }
    },
    smallGroup: {
      label: "小组",
      metricHostId: "smallGroupCompareMetrics",
      heatmapId: "smallGroupCompareHeatmap",
      orderRhythmHeatmapId: "smallGroupOrderRhythmHeatmap",
      orderRhythmSwitch: dom.smallGroupOrderRhythmSwitch,
      orderRhythmStateKey: "smallGroupRhythmMetric",
      trendTableId: "smallGroupTrendTable",
      trendSpecs: SMALL_GROUP_TREND_SPECS,
      trendDimensionSwitch: dom.smallGroupTrendDimensionSwitch,
      trendDimensionStateKey: "smallGroupTrendDimension",
      focusStateKey: "smallGroupFocus",
      focusChaseSwitch: dom.smallGroupFocusChaseSwitch,
      focusByDaySwitch: dom.smallGroupFocusByDaySwitch,
      processChartsHost: dom.smallGroupFocusProcessCharts,
      conversionChartsHost: dom.smallGroupFocusConversionCharts,
      decayChartsHost: dom.smallGroupFocusDecayCharts,
      focusChartIds: {
        day3Pending: "smallGroupFocusTrendDay3Pending",
        day3ConvChase: "smallGroupFocusTrendDay3ConvChase",
        d6d7ConvChase: "smallGroupFocusTrendD6D7ConvChase"
      }
    }
  }

  const SMALL_GROUP_RADAR_METRICS = [
    { key: "pendingRate", label: "待支付率", formatter: formatPct, better: "low", value: (item) => item.pendingRate },
    { key: "pendingConv", label: "待支付转率", formatter: formatPct, better: "high", value: (item) => item.pendingConv },
    { key: "individualShare", label: "个销占比", formatter: formatPct, better: "high", value: (item) => item.individualShare },
    { key: "highImmerseRate", label: "高沉浸率", formatter: formatPct, better: "high", value: (item) => item.highImmerseRate },
    { key: "roiCv", label: "组内变异系数", formatter: (value) => formatNum(value, 2), better: "low", value: (item) => item.roiCv },
    { key: "tailLeaderShare", label: "尾部人次占比", formatter: formatPct, better: "low", value: (item) => item.tailLeaderShare },
    { key: "personEfficiency", label: "人效", formatter: (value) => Number.isFinite(value) ? String(Math.round(value)) : "-", better: "high", value: (item) => item.personEfficiency },
    { key: "day3ConvRate", label: "Day3转率", formatter: formatPct, better: "high", value: (item) => item.day3ConvRate }
  ]

  function makeDrillButton(label, dataset = {}) {
    const encode = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const attrs = Object.entries(dataset).map(([key, value]) => `data-${key}="${encode(value)}"`).join(" ")
    return `<button class="drill-btn" type="button" ${attrs}>${encode(label)}</button>`
  }

  function metricCellClass(value, allValues, better) {
    const valid = allValues.filter((item) => Number.isFinite(item))
    if (!Number.isFinite(value) || valid.length < 2) return ""
    const best = better === "low" ? Math.min(...valid) : Math.max(...valid)
    const worst = better === "low" ? Math.max(...valid) : Math.min(...valid)
    if (best === worst) return ""
    if (value === best) return "td-good"
    if (value === worst) return "td-bad"
    return ""
  }

  function metricCell(value, spec, pool) {
    if (spec.compare === false) return spec.formatter(value)
    const klass = metricCellClass(value, pool.map((item) => spec.value(item)), spec.better)
    const text = spec.formatter(value)
    return klass ? `<span class="${klass}">${text}</span>` : text
  }

  function currentMeta() {
    return state.model?.meta || {}
  }

  function buildDrillSnapshot(rows, labels, scope = {}) {
    const raw = aggregateUnifiedRows(rows)
    const meta = currentMeta()
    const campId = scope.campId ?? String(raw[meta.campField] || "").trim()
    const projectName = scope.projectName ?? labels.projectName ?? normalizeProjectName(raw[meta.projectField])
    const startDate = parseStartDate(firstNonEmpty(rows, ["_营期开营时间", meta.startField]))
    const status = computeStatus(startDate, state.filters.asOfDate)
    return {
      ...snapshotBase({
        type: scope.type || "group",
        campId,
        projectName,
        groupName: labels.groupName || scope.groupName || null,
        month: normalizeMonth(scope.month, raw._营期月份, raw[meta.monthFieldClass], raw[meta.monthFieldCamp]),
        raw,
        supplement: {},
        startDate,
        status
      }),
      smallGroupName: labels.smallGroupName || scope.smallGroupName || null,
      className: labels.className || null,
      rowCount: rows.length,
      coveredCampCount: uniq(rows.map((row) => String(row[meta.campField] || "").trim())).filter(Boolean).length
    }
  }

  function getScopedUnifiedRows(drill) {
    const meta = currentMeta()
    let rows = state.model.unifiedRows.slice()
    const projectSet = new Set(state.filters.projects)
    const monthSet = new Set(state.filters.months)
    const weekSet = new Set(state.filters.weeks)
    const campSet = new Set(state.filters.camps)
    const groupSet = new Set(state.filters.groups)
    const smallGroupSet = new Set(state.filters.smallGroups)
    rows = rows.filter((row) => {
      const projectName = normalizeProjectName(row[meta.projectField])
      const month = normalizeMonth(row[meta.monthFieldClass], row._营期月份)
      const weekKey = rowWeekKey(row, meta)
      const campId = String(row[meta.campField] || "").trim()
      const groupName = String(row[meta.groupField] || "未知大组").trim() || "未知大组"
      const smallGroupName = String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组"
      return (!projectSet.size || projectSet.has(projectName))
        && (!monthSet.size || monthSet.has(month))
        && (!weekSet.size || weekSet.has(weekKey))
        && (!campSet.size || campSet.has(campId))
        && (!groupSet.size || groupSet.has(groupName))
        && (!smallGroupSet.size || smallGroupSet.has(smallGroupName))
    })
    if (!drill) return rows
    if (drill.month !== null && drill.month !== undefined) {
      rows = rows.filter((row) => normalizeMonth(row[meta.monthFieldClass], row._营期月份) === drill.month)
    }
    if (drill.campId) {
      rows = rows.filter((row) => String(row[meta.campField] || "").trim() === drill.campId)
    }
    if (drill.groupName) {
      rows = rows.filter((row) => (String(row[meta.groupField] || "未知大组").trim() || "未知大组") === drill.groupName)
    }
    if (drill.smallGroupName) {
      rows = rows.filter((row) => (String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组") === drill.smallGroupName)
    }
    return rows
  }

  function getOverviewScopedRows() {
    const meta = currentMeta()
    const projectSet = new Set(state.filters.projects)
    return state.model.unifiedRows.filter((row) => {
      const projectName = normalizeProjectName(row[meta.projectField])
      return !projectSet.size || projectSet.has(projectName)
    })
  }

  function buildCampDrillRowsByLevel(scope, targetLevel) {
    const meta = currentMeta()
    const rows = getScopedUnifiedRows(scope)
    const keyFn = targetLevel === "group"
      ? (row) => String(row[meta.groupField] || "未知大组").trim() || "未知大组"
      : targetLevel === "smallGroup"
        ? (row) => `${String(row[meta.groupField] || "未知大组").trim() || "未知大组"}__${String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组"}`
        : (row) => `${String(row[meta.groupField] || "未知大组").trim() || "未知大组"}__${String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组"}__${String(row[meta.classField] || "未知班级").trim() || "未知班级"}`
    return Array.from(groupBy(rows, keyFn).entries()).map(([, bucket]) => {
      const base = bucket[0] || {}
      const groupName = String(base[meta.groupField] || scope.groupName || "未知大组").trim() || "未知大组"
      const smallGroupName = String(base[meta.smallGroupField] || scope.smallGroupName || "未知小组").trim() || "未知小组"
      const className = String(base[meta.classField] || "未知班级").trim() || "未知班级"
      return buildDrillSnapshot(bucket, {
        groupName: targetLevel === "group" ? groupName : (scope.groupName || groupName),
        smallGroupName: targetLevel === "smallGroup" ? smallGroupName : (scope.smallGroupName || smallGroupName),
        className: targetLevel === "class" ? className : null
      }, {
        type: "group",
        campId: scope.campId || null,
        groupName: scope.groupName || groupName || null,
        smallGroupName: scope.smallGroupName || smallGroupName || null,
        month: scope.month ?? null
      })
    }, {
    }).sort((a, b) => (b.metrics.roi || 0) - (a.metrics.roi || 0))
  }

  function buildCampDrillRows(drill) {
    const nextLevel = drill?.level === "group" ? "smallGroup" : drill?.level === "smallGroup" ? "class" : "group"
    return buildCampDrillRowsByLevel(drill, nextLevel)
  }

  function drillRootScope(drill) {
    if (!drill) return null
    if (drill.campId) return { level: "camp", campId: drill.campId }
    return { level: "month", month: drill.month }
  }

  function campDrillConfig(drill) {
    if (!drill) return null
    if (drill.level === "month") {
      return {
        nextLevel: "group",
        title: `${drill.month}月大组对比`,
        hint: "点击大组名称可继续下钻到小组；绿色代表当前维度更优，红色代表当前维度偏弱。",
        nameLabel: "大组",
        clickKey: "groupName"
      }
    }
    if (drill.level === "camp") {
      return {
        nextLevel: "group",
        title: `营期 ${drill.campId}｜大组对比`,
        hint: "点击大组名称可继续下钻到小组；下钻表会沿用当前全局筛选范围。",
        nameLabel: "大组",
        clickKey: "groupName"
      }
    }
    if (drill.level === "group") {
      return {
        nextLevel: "smallGroup",
        title: `${drill.groupName}｜小组对比`,
        hint: "点击小组名称可继续下钻到班长维度。",
        nameLabel: "小组",
        clickKey: "smallGroupName"
      }
    }
    if (drill.level === "smallGroup") {
      return {
        nextLevel: "class",
        title: `${drill.smallGroupName}｜班长对比`,
        hint: "当前已是最细层级，继续结合班级分析页查看趋势与热力图。",
        nameLabel: "班长",
        clickKey: null
      }
    }
    return null
  }

  function drillModeRefs(kind) {
    return kind === "month"
      ? {
        stateKey: "monthDrill",
        modeKey: "monthDrillMode",
        pathBtn: dom.monthDrillPathModeBtn,
        expandBtn: dom.monthDrillExpandModeBtn,
        pathTable: dom.monthDrillTable,
        expandView: dom.monthDrillExpandView,
        groupTable: dom.monthDrillGroupTable,
        smallGroupTable: dom.monthDrillSmallGroupTable,
        classTable: dom.monthDrillClassTable,
        groupFilter: dom.monthDrillGroupFilter,
        smallGroupFilter: dom.monthDrillSmallGroupFilter
      }
      : {
        stateKey: "campEntityDrill",
        modeKey: "campEntityDrillMode",
        pathBtn: dom.campEntityDrillPathModeBtn,
        expandBtn: dom.campEntityDrillExpandModeBtn,
        pathTable: dom.campEntityDrillTable,
        expandView: dom.campEntityDrillExpandView,
        groupTable: dom.campEntityDrillGroupTable,
        smallGroupTable: dom.campEntityDrillSmallGroupTable,
        classTable: dom.campEntityDrillClassTable,
        groupFilter: dom.campEntityDrillGroupFilter,
        smallGroupFilter: dom.campEntityDrillSmallGroupFilter
      }
  }

  function setDrillMode(kind, mode) {
    const refs = drillModeRefs(kind)
    state.ui[refs.modeKey] = mode
    refs.pathBtn?.classList.toggle("active", mode === "path")
    refs.expandBtn?.classList.toggle("active", mode === "expand")
    refs.pathTable?.classList.toggle("hidden", mode !== "path")
    refs.expandView?.classList.toggle("hidden", mode !== "expand")
  }

  function buildValidation(parsed, type = "class") {
    const required = type === "limit" ? ["营期", "班级"] : ["营期", "开营时间", "月份", "大组", "小组", "班级"]
    const missing = required.filter((field) => !parsed.fields.includes(field))
    const hasLimitMetric = type !== "limit" || parsed.fields.includes("day8前限制数") || parsed.fields.some((field) => /^day(?:负[12]|[0-7])限制数$/.test(field))
    return {
      ok: missing.length === 0 && hasLimitMetric,
      missing: hasLimitMetric ? missing : [...missing, "限制数字段"],
      rows: parsed.rows.length,
      encoding: parsed.encoding,
      delimiter: parsed.delimiter === "\t" ? "TAB" : parsed.delimiter
    }
  }

  async function onFileChange(type, event) {
    const file = event.target.files[0]
    if (!file) {
      state.uploads[type] = null
      renderImportState()
      return
    }
    try {
      const parsed = await parseCsvFile(file)
      state.uploads[type] = { fileName: file.name, parsed, validation: buildValidation(parsed, type) }
    } catch (error) {
      state.uploads[type] = {
        fileName: file.name,
        parsed: null,
        validation: { ok: false, missing: [], rows: 0, encoding: "-", delimiter: "-", error: String(error.message || error) }
      }
    }
    renderImportState()
  }

  function setChip(el, kind, text) {
    el.className = `status-chip ${kind}`
    el.textContent = text
  }

  function renderImportState() {
    const klass = state.uploads.class
    const limit = state.uploads.limit
    const delimiterText = klass?.validation?.delimiter === "\t"
      ? "Tab"
      : (klass?.validation?.delimiter || "待识别")

    if (klass?.validation?.ok) {
      setChip(dom.classStatusTag, "good", "已通过")
      dom.classFileInfo.textContent = `${klass.fileName}｜${klass.validation.rows} 行｜${klass.validation.encoding}｜${delimiterText}`
    } else if (klass?.validation) {
      setChip(dom.classStatusTag, "bad", "需修复")
      dom.classFileInfo.textContent = klass.validation.error || `缺失字段：${klass.validation.missing.join("、") || "未知"}`
    } else {
      setChip(dom.classStatusTag, "neutral", "未导入")
      dom.classFileInfo.textContent = "需要包含：营期、开营时间、月份、大组、小组、班级，以及班级级过程/转化/成本字段。"
    }

    if (limit?.validation?.ok) {
      setChip(dom.limitStatusTag, "good", "已通过")
      dom.limitFileInfo.textContent = `${limit.fileName}｜${limit.validation.rows} 行｜${limit.validation.encoding}｜${limit.validation.delimiter || "已识别"}`
    } else if (limit?.validation) {
      setChip(dom.limitStatusTag, "bad", "需修复")
      dom.limitFileInfo.textContent = limit.validation.error || `缺失字段：${limit.validation.missing.join("、") || "未知"}`
    } else {
      setChip(dom.limitStatusTag, "neutral", "未导入")
      dom.limitFileInfo.textContent = "需要包含：营期、班级、day8前限制数，以及day负2～day7限制数字段；建议包含项目。"
    }

    const checks = []
    const errors = []
    if (!klass?.validation) {
      checks.push(
        { label: "班级文件", value: "待上传", statusText: "等待中", desc: "上传 CSV 后自动开始校验。", kind: "neutral" },
        { label: "编码识别", value: "等待识别", statusText: "等待中", desc: "支持 UTF-8 / UTF-16 自动识别。", kind: "neutral" },
        { label: "分隔符", value: "等待识别", statusText: "等待中", desc: "自动识别逗号或 Tab 分隔。", kind: "neutral" },
        { label: "字段校验", value: "等待检查", statusText: "等待中", desc: "将核对营期、组织、过程、转化和成本字段。", kind: "neutral" }
      )
    } else {
      checks.push(
        {
          label: "班级文件",
          value: klass.validation.ok ? `${klass.validation.rows} 行` : "未通过",
          statusText: klass.validation.ok ? "已读取" : "异常",
          desc: klass.fileName || "已读取文件",
          kind: klass.validation.ok ? "good" : "bad"
        },
        {
          label: "编码识别",
          value: klass.validation.encoding || "未知",
          statusText: klass.validation.encoding ? "已识别" : "待确认",
          desc: "自动识别文件编码，避免中文乱码。",
          kind: klass.validation.encoding ? "good" : "neutral"
        },
        {
          label: "分隔符",
          value: delimiterText,
          statusText: klass.validation.delimiter ? "已识别" : "待确认",
          desc: "自动匹配 CSV / Tab 分隔格式。",
          kind: klass.validation.delimiter ? "good" : "neutral"
        },
        {
          label: "字段校验",
          value: klass.validation.ok ? "字段完整" : `缺失 ${klass.validation.missing?.length || 0} 项`,
          statusText: klass.validation.ok ? "通过" : "需修复",
          desc: klass.validation.ok
            ? "核心字段已通过，可直接进入看板。"
            : `缺失字段：${klass.validation.missing.join("、") || "未知"}`,
          kind: klass.validation.ok ? "good" : "bad"
        }
      )
      if (klass.validation.missing?.length) errors.push(`班级文件缺失字段：${klass.validation.missing.join("、")}`)
      if (klass.validation.error) errors.push(`班级文件读取失败：${klass.validation.error}`)
    }
    checks.push({
      label: "班级限制表（可选）",
      value: !limit ? "未上传" : limit.validation?.ok ? `${limit.validation.rows} 行` : "未通过",
      statusText: !limit ? "不影响基础分析" : limit.validation?.ok ? "封号分析已启用" : "需修复",
      desc: !limit ? "上传后解锁封号影响Tab。" : limit.validation?.ok ? "将按项目、营期、班级匹配经营数据。" : `缺失字段：${limit.validation?.missing?.join("、") || "未知"}`,
      kind: !limit ? "neutral" : limit.validation?.ok ? "good" : "bad"
    })
    if (limit?.validation?.missing?.length) errors.push(`限制表缺失字段：${limit.validation.missing.join("、")}`)
    dom.importChecks.innerHTML = checks.map((item) => `
      <div class="check-item import-check-item">
        <div class="import-check-main">
          <div class="import-check-label">${item.label}</div>
          <div class="import-check-value">${item.value}</div>
          <div class="import-check-desc">${item.desc || ""}</div>
        </div>
        <span class="status-chip ${item.kind}">${item.statusText || item.value}</span>
      </div>
    `).join("")
    dom.importErrors.innerHTML = errors.length
      ? errors.map((item) => `<div class="alert-item error">${item}</div>`).join("")
      : `<div class="alert-item info">已就绪后点击“开始分析”，系统会自动建立统一数据模型并输出异常诊断。</div>`

    const ready = !!klass?.validation?.ok
    setChip(dom.importSummaryTag, ready ? "good" : "neutral", ready ? "可以分析" : "等待文件")
    dom.startAnalysisBtn.disabled = !ready
  }

  const BAN_DAY_KEYS = ["day负2", "day负1", "day0", "day1", "day2", "day3", "day4", "day5", "day6", "day7"]

  function prepareLimitLookup(upload) {
    if (!upload?.validation?.ok || !upload.parsed?.rows) return null
    const fields = upload.parsed.fields
    const projectField = pickField(fields, ["项目", "项目名称", "业务线", "项目组"])
    const campField = pickField(fields, ["营期", "营期号", "营期ID", "期数"])
    const classField = pickField(fields, ["班级", "班级名称"])
    const exact = new Map()
    const fallbackBuckets = new Map()
    upload.parsed.rows.forEach((row) => {
      const project = normalizeProjectName(projectField ? row[projectField] : null)
      const camp = String(row[campField] || "").trim()
      const className = normalizeBanClassKey(row[classField])
      if (!camp || !className) return
      const dayCounts = Object.fromEntries(BAN_DAY_KEYS.map((day) => [day, parseNumber(row[`${day}限制数`]) || 0]))
      const firstDay = BAN_DAY_KEYS.find((day) => dayCounts[day] > 0) || "未知"
      const totalBeforeDay8 = parseNumber(row["day8前限制数"])
      const limited = (Number.isFinite(totalBeforeDay8) ? totalBeforeDay8 : sum(Object.values(dayCounts))) > 0
      const prepared = { project, camp, className, dayCounts, firstDay, limited, total: Number.isFinite(totalBeforeDay8) ? totalBeforeDay8 : sum(Object.values(dayCounts)) }
      exact.set(`${project}__${camp}__${className}`, prepared)
      const fallbackKey = `${camp}__${className}`
      if (!fallbackBuckets.has(fallbackKey)) fallbackBuckets.set(fallbackKey, [])
      fallbackBuckets.get(fallbackKey).push(prepared)
    })
    const fallback = new Map(Array.from(fallbackBuckets.entries()).filter(([, items]) => items.length === 1).map(([key, items]) => [key, items[0]]))
    return { exact, fallback, rows: upload.parsed.rows.length }
  }

  function buildModel() {
    const classRows = state.uploads.class.parsed.rows
    const classFields = state.uploads.class.parsed.fields

    const campField = pickField(classFields, ["营期", "营期号", "营期ID", "期数"])
    const startField = pickField(classFields, ["开营时间", "开营日期", "开营", "开课时间"])
    const monthFieldClass = pickField(classFields, ["月份", "月", "月份(自然月)", "自然月"])
    const sourceProjectField = pickField(classFields, ["项目", "项目名称", "业务线", "项目组"])
    const groupField = pickField(classFields, ["大组", "组别", "部门", "分组"])
    const smallGroupField = pickField(classFields, ["小组"])
    const leaderField = pickField(classFields, ["班长", "班主任", "班主任姓名", "班级负责人"])
    const classNameField = pickField(classFields, ["班级", "班级名称"])
    const classField = pickField(classFields, ["班级", "班级名称"])
    if (!campField || !startField || !monthFieldClass || !groupField || !smallGroupField || !classField) {
      throw new Error("核心字段识别失败，请确认上传的是班级数据明细。")
    }

    const projectField = "_项目"
    const smallGroupGroupLookup = buildGroupLookupBySmallGroup(classRows, groupField, smallGroupField)
    const normalizedClassRows = classRows.map((row) => {
      const smallGroupName = String(row[smallGroupField] || "").trim()
      const rawGroupName = normalizedGroupName(row[groupField])
      const backfilledGroupName = isMissingGroupName(rawGroupName) ? (smallGroupGroupLookup.get(smallGroupName) || rawGroupName) : rawGroupName
      const cleanedLeader = cleanClassName(leaderField ? row[leaderField] : row[classField])
      const rawClassDisplay = String(classNameField ? row[classNameField] : row[classField] || "").trim()
      const cleanedClass = cleanClassName(classNameField ? row[classNameField] : row[classField])
      const banClassKey = normalizeBanClassKey(rawClassDisplay)
      return {
        ...row,
        [classField]: cleanClassName(row[classField]),
        ...(leaderField ? { [leaderField]: cleanedLeader } : {}),
        ...(classNameField ? { [classNameField]: cleanedClass } : {}),
        _原始班级: rawClassDisplay,
        _封号匹配班级: banClassKey,
        [groupField]: backfilledGroupName,
        [projectField]: normalizeProjectName(sourceProjectField ? row[sourceProjectField] : null)
      }
    })
    const leaderOrgLookup = buildLeaderOrgLookup(normalizedClassRows, {
      campField,
      startField,
      projectField,
      groupField,
      smallGroupField,
      leaderField,
      classField
    })
    const alignedClassRows = normalizedClassRows.map((row) => {
      const leaderName = String(leaderField ? row[leaderField] : row[classField] || "").trim()
      const projectName = normalizeProjectName(row[projectField])
      const leaderOrg = leaderName ? leaderOrgLookup.get(`${projectName}__${leaderName}`) : null
      const nextRow = {
        ...row,
        [groupField]: leaderOrg?.groupName || normalizedGroupName(row[groupField]),
        [smallGroupField]: leaderOrg?.smallGroupName || normalizedSmallGroupName(row[smallGroupField])
      }
      const normalizedType = rowClassType(nextRow)
      const machineSlots = rowMachineSlots(nextRow)
      const parsedStartDate = parseStartDate(nextRow[startField])
      const week = weekInfo(parsedStartDate)
      return {
        ...nextRow,
        _标准班长: leaderField ? nextRow[leaderField] : nextRow[classField],
        _标准班级: classNameField ? nextRow[classNameField] : nextRow[classField],
        _预处理班型: normalizedType || "",
        机器号数: Number.isFinite(machineSlots) ? machineSlots : row["机器号数"],
        _开营周: week?.label || "",
        _开营周起始: week ? formatDate(week.startDate) : "",
        _开营周结束: week ? formatDate(week.endDate) : ""
      }
    })

    const leaderExperienceLookup = buildLeaderExperienceLookupFromRows(alignedClassRows, {
      projectField,
      campField,
      classField
    })
    const enrichedClassRows = alignedClassRows.map((row) => {
      const key = leaderLookupKeyByProjectAndName(row[projectField], row[classField])
      const leaderInfo = leaderExperienceLookup.get(key)
      return {
        ...row,
        _班长营期数: leaderInfo?.campCount ?? "",
        _班长类型: leaderInfo?.leaderType || ""
      }
    })

    const limitLookup = prepareLimitLookup(state.uploads.limit)
    let limitMatched = 0
    const unifiedRows = enrichedClassRows.map((row) => {
      if (!limitLookup) return { ...row, _封号情况: "未提供限制表", _首次封号日: "未知", _限制匹配: false }
      const project = normalizeProjectName(row[projectField])
      const camp = String(row[campField] || "").trim()
      const className = normalizeBanClassKey(row._封号匹配班级 || row._原始班级 || row[classNameField] || row[classField])
      const matched = limitLookup.exact.get(`${project}__${camp}__${className}`) || limitLookup.fallback.get(`${camp}__${className}`)
      if (matched) limitMatched += 1
      return {
        ...row,
        _封号情况: matched ? (matched.limited ? "封号" : "未封号") : "未知",
        _首次封号日: matched?.firstDay || "未知",
        _限制数: matched?.total || 0,
        _限制匹配: !!matched,
        ...Object.fromEntries(BAN_DAY_KEYS.map((day) => [`_${day}限制数`, matched?.dayCounts?.[day] || 0]))
      }
    })
    const { campSnapshots, groupSnapshots, smallGroupSnapshots, classSnapshots } = buildSnapshotsFromRows(unifiedRows, {
      campField, startField, monthFieldClass, groupField, smallGroupField, classField
    })

    const quality = buildQualityReport(enrichedClassRows, unifiedRows, campSnapshots, groupSnapshots, smallGroupSnapshots, classSnapshots, {
      campField, startField, monthFieldClass, projectField, groupField, smallGroupField, classField
    })
    const anomalies = detectAnomalies(campSnapshots, groupSnapshots)
    const recommendations = buildRecommendations(anomalies)

    return {
      campSnapshots,
      groupSnapshots,
      smallGroupSnapshots,
      classSnapshots,
      unifiedRows,
      quality,
      anomalies,
      recommendations,
      limitMeta: limitLookup ? { supplied: true, sourceRows: limitLookup.rows, matchedRows: limitMatched, coverageRate: ratio(limitMatched, enrichedClassRows.length) } : { supplied: false, sourceRows: 0, matchedRows: 0, coverageRate: 0 },
      meta: {
        campField,
        startField,
        monthFieldCamp: monthFieldClass,
        monthFieldClass,
        projectField,
        groupField,
        smallGroupField,
        classField,
        leaderField: leaderField || classField,
        classNameField: classNameField || classField
      }
    }
  }

  function buildSnapshotsFromRows(rows, meta) {
    const campSnapshots = []
    groupBy(rows, (row) => String(row[meta.campField] || "").trim()).forEach((bucket, campId) => {
      if (!campId) return
      const raw = aggregateUnifiedRows(bucket)
      const supplement = {}
      const startDate = parseStartDate(raw[meta.startField])
      const status = computeStatus(startDate, state.filters.asOfDate)
      campSnapshots.push(snapshotBase({
        type: "camp",
        campId,
        projectName: normalizeProjectName(raw[meta.projectField]),
        groupName: null,
        month: normalizeMonth(raw[meta.monthFieldClass]),
        raw,
        supplement,
        startDate,
        status
      }))
    })
    campSnapshots.sort(compareStart)

    const groupSnapshots = []
    groupBy(rows, (row) => `${String(row[meta.campField] || "").trim()}__${String(row[meta.groupField] || "未知大组").trim() || "未知大组"}`).forEach((bucket, key) => {
      const [campId, groupName] = key.split("__")
      if (!campId) return
      const raw = aggregateUnifiedRows(bucket)
      const supplement = {}
      const startDate = parseStartDate(raw[meta.startField])
      const status = computeStatus(startDate, state.filters.asOfDate)
      groupSnapshots.push(snapshotBase({
        type: "group",
        campId,
        projectName: normalizeProjectName(raw[meta.projectField]),
        groupName,
        month: normalizeMonth(raw[meta.monthFieldClass]),
        raw,
        supplement,
        startDate,
        status
      }))
    })
    groupSnapshots.sort(compareStart)

    const smallGroupSnapshots = []
    groupBy(rows, (row) => `${String(row[meta.campField] || "").trim()}__${String(row[meta.groupField] || "未知大组").trim() || "未知大组"}__${String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组"}`).forEach((bucket, key) => {
      const [campId, groupName, smallGroupName] = key.split("__")
      if (!campId) return
      const raw = aggregateUnifiedRows(bucket)
      const supplement = {}
      const startDate = parseStartDate(raw[meta.startField])
      const status = computeStatus(startDate, state.filters.asOfDate)
      smallGroupSnapshots.push({
        ...snapshotBase({
          type: "group",
          campId,
          projectName: normalizeProjectName(raw[meta.projectField]),
          groupName,
          month: normalizeMonth(raw[meta.monthFieldClass]),
          raw,
          supplement,
          startDate,
          status
        }),
        smallGroupName
      })
    })
    smallGroupSnapshots.sort(compareStart)

    const classSnapshots = []
    groupBy(rows, (row) => `${String(row[meta.campField] || "").trim()}__${String(row[meta.groupField] || "未知大组").trim() || "未知大组"}__${String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组"}__${String(row[meta.classField] || "未知班级").trim() || "未知班级"}`).forEach((bucket, key) => {
      const [campId, groupName, smallGroupName, className] = key.split("__")
      if (!campId) return
      const raw = aggregateUnifiedRows(bucket)
      const supplement = {}
      const startDate = parseStartDate(raw[meta.startField])
      const status = computeStatus(startDate, state.filters.asOfDate)
      classSnapshots.push({
        ...snapshotBase({
          type: "group",
          campId,
          projectName: normalizeProjectName(raw[meta.projectField]),
          groupName,
          month: normalizeMonth(raw[meta.monthFieldClass]),
          raw,
          supplement,
          startDate,
          status
        }),
        smallGroupName,
        className,
        leaderType: String(raw._班长类型 || "").trim() || leaderTypeByCampCount(parseNumber(raw._班长营期数)),
        leaderExperienceCampCount: parseNumber(raw._班长营期数)
      })
    })
    classSnapshots.sort(compareStart)

    return { campSnapshots, groupSnapshots, smallGroupSnapshots, classSnapshots }
  }

  function buildQualityReport(classRows, unifiedRows, campSnapshots, groupSnapshots, smallGroupSnapshots, classSnapshots, meta) {
    const keyFields = [
      { label: "班级数据-项目", field: meta.projectField, rows: classRows },
      { label: "班级数据-营期", field: meta.campField, rows: classRows },
      { label: "班级数据-开营时间", field: meta.startField, rows: classRows },
      { label: "班级数据-月份", field: meta.monthFieldClass, rows: classRows },
      { label: "班级数据-大组", field: meta.groupField, rows: classRows },
      { label: "班级数据-小组", field: meta.smallGroupField, rows: classRows },
      { label: "班级数据-班级", field: meta.classField, rows: classRows }
    ].map((item) => ({
      label: item.label,
      missing: item.rows.filter((row) => !String(row[item.field] || "").trim()).length,
      total: item.rows.length
    }))

    const dayFields = ["day1晨读", "day1到播", "day1留存", "day3转率", "day3待支付率", "day5到播转率", "day6转率", "day7转率"].map((field) => ({
      field,
      available: classRows.filter((row) => parseNumber(row[field]) !== null).length,
      total: classRows.length
    }))

    return {
      classRows: classRows.length,
      unifiedRows: unifiedRows.length,
      parsedStartDates: campSnapshots.filter((item) => item.startDate).length,
      totalCamps: campSnapshots.length,
      totalGroups: groupSnapshots.length,
      totalSmallGroups: smallGroupSnapshots.length,
      totalClasses: classSnapshots.length,
      totalProjects: uniq(classRows.map((row) => normalizeProjectName(row[meta.projectField]))).length,
      missingGroupRows: classRows.filter((row) => !String(row[meta.groupField] || "").trim()).length,
      missingSmallGroupRows: classRows.filter((row) => !String(row[meta.smallGroupField] || "").trim()).length,
      keyFields,
      dayFields,
      notes: [
        `目标 ROI 默认使用 ${ROI_TARGET}。`,
        "异常判断采用固定阈值与相对偏差结合。",
        "营期 / 大组 / 小组 / 班级分析全部基于班级明细聚合。",
        "成本、获客、过程与转化字段均优先使用班级明细自身字段。",
        "营期状态依赖班级明细中的开营时间进行推断。"
      ]
    }
  }

  function detectAnomalies(camps, groups) {
    const anomalies = []
    const campPendingMedian = median(camps.map((item) => firstMetric(item.raw, item.supplement, ["day3待支付率", "待支付率"])))
    const groupRoiMedian = median(groups.map((item) => item.metrics.roi))
    camps.forEach((item) => {
      const day3Pending = firstMetric(item.raw, item.supplement, ["day3待支付率", "待支付率"])
      const d67Conv = sum([6, 7].map((day) => firstMetric(item.raw, item.supplement, [`day${day}转率`])))
      if (Number.isFinite(item.metrics.roi) && item.metrics.roi < ROI_TARGET) {
        anomalies.push(anomaly(item, "ROI", item.metrics.roi, item.metrics.roi < ROI_TARGET * 0.8 ? "high" : "medium", "低于目标线", "营期分析 > 添加成本 / 添加产值 / ROI"))
      }
      if (Number.isFinite(day3Pending) && day3Pending > Math.max(0.30, campPendingMedian + 0.03)) {
        anomalies.push(anomaly(item, "Day3 待支付率", day3Pending, "medium", "转化前置阻塞", "营期分析 > 关键过程趋势"))
      }
      if (Number.isFinite(item.metrics.replyTime) && item.metrics.replyTime > 800) {
        anomalies.push(anomaly(item, "班长回复时长", item.metrics.replyTime, "medium", "课程互动偏慢", "营期分析 > By-day 过程数据"))
      }
      if (Number.isFinite(d67Conv) && d67Conv < 0.03) {
        anomalies.push(anomaly(item, "D6-D7 转率", d67Conv, "low", "中后程出单偏弱", "营期分析 > 关键过程趋势"))
      }
    })
    groups.forEach((item) => {
      const peers = groups.filter((peer) => peer.month === item.month)
      const peerRoiMedian = median(peers.map((peer) => peer.metrics.roi))
      const peerAddCostMedian = median(peers.map((peer) => peer.metrics.addCost))
      const day3Conv = firstMetric(item.raw, item.supplement, ["day3转率"])
      if (Number.isFinite(item.metrics.roi) && (item.metrics.roi < ROI_TARGET || item.metrics.roi < peerRoiMedian - 0.12 || item.metrics.roi < groupRoiMedian - 0.12)) {
        anomalies.push(anomaly(item, "大组 ROI", item.metrics.roi, item.metrics.roi < ROI_TARGET * 0.75 ? "high" : "medium", "低于目标线或同期中位数", "大组分析 > 大组排名"))
      }
      if (Number.isFinite(item.metrics.addCost) && Number.isFinite(peerAddCostMedian) && item.metrics.addCost > peerAddCostMedian * 1.2) {
        anomalies.push(anomaly(item, "添加成本", item.metrics.addCost, "medium", "获客效率偏弱", "大组分析 > 趋势总览"))
      }
      if (Number.isFinite(day3Conv) && day3Conv < 0.03) {
        anomalies.push(anomaly(item, "Day3 转率", day3Conv, "medium", "首波转化偏弱", "大组分析 > D3-D7 转率热力图"))
      }
    })
    return anomalies.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity)).slice(0, 20)
  }

  function anomaly(item, metric, value, severity, reason, drillPath) {
    return { type: item.type, campId: item.campId, groupName: item.groupName, metric, value, severity, reason, drillPath }
  }

  function severityWeight(level) {
    return ({ high: 3, medium: 2, low: 1 }[level] || 0)
  }

  function severityClass(level) {
    return ({ high: "bad", medium: "warn", low: "good" }[level] || "warn")
  }

  function severityLabel(level) {
    return ({ high: "高风险", medium: "关注", low: "提示" }[level] || "关注")
  }

  function buildRecommendations(anomalies) {
    return anomalies.slice(0, 5).map((item) => {
      let advice = "优先复核数据与口径。"
      if (/ROI|添加成本/.test(item.metric)) advice = "优先检查投放成本、获客质量与个销占比，确认是否是前端流量效率问题。"
      else if (/待支付|Day3/.test(item.metric)) advice = "优先检查 Day3 到播转率、待支付率和直播间承接，定位首波转化阻塞点。"
      else if (/回复时长|发言/.test(item.metric)) advice = "优先查看课程侧互动过程，确认班长回复时效、用户发言和到播表现是否同步走弱。"
      else if (/D6-D7/.test(item.metric)) advice = "优先复盘中后程转化节奏，关注 D6-D7 出单占比和班级运营动作。"
      return {
        title: item.type === "camp" ? `营期 ${item.campId}` : `${item.groupName}｜营期 ${item.campId}`,
        metric: item.metric,
        advice,
        drillPath: item.drillPath,
        severity: item.severity
      }
    })
  }

  function onStartAnalysis() {
    try {
      dom.importErrors.innerHTML = ""
      state.ui.monthDrill = null
      state.ui.campEntityDrill = null
      state.model = null
      state.model = buildModel()
      initFilters()
      switchScreen("dashboard")
      renderAll()
    } catch (error) {
      console.error(error)
      switchScreen("import")
      dom.importErrors.innerHTML = `<div class="alert-item">${String(error.message || error)}</div>`
    }
  }

  function switchScreen(mode) {
    dom.importView.classList.toggle("active", mode === "import")
    dom.dashboardView.classList.toggle("active", mode === "dashboard")
    if (mode === "dashboard") renderSidebarState()
  }

  function resetAnalysisSession({ clearUpload = false } = {}) {
    state.model = null
    if (clearUpload) {
      state.uploads.class = null
      state.uploads.limit = null
    }
    state.filters = createEmptyFilters()
    state.draftFilters = cloneFilters(state.filters)
    Object.assign(state.ui, {
      activeTab: "overview",
      monthDrill: null,
      campEntityDrill: null,
      monthDrillMode: "path",
      campEntityDrillMode: "path",
      filterCollapsed: false,
      sidebarCollapsed: false,
      overviewFocusedCampId: null,
      campWarmDimension: "group",
      campWarmDimension: "group",
      campWarmTimeDimension: "camp",
      campRhythmDimension: "camp",
      campByDayDimension: "camp",
      campViewDimension: "camp",
      projectCompareOverviewExpanded: [],
      projectCompareWarmOverviewExpanded: [],
      campOverviewExpanded: [],
      campWarmOverviewExpanded: [],
      groupFocus: null,
      groupFocusCompare: [],
      groupByDayCamps: [],
      groupByDayCampsManuallyCleared: false,
      smallGroupFocus: null,
      smallGroupByDayCamps: [],
      smallGroupByDayCampsManuallyCleared: false,
      groupRhythmMetric: "orderShare",
      smallGroupRhythmMetric: "orderShare",
      groupTrendDimension: "camp",
      smallGroupTrendDimension: "camp",
      classHeatmapSmallGroup: "",
      classHeatmapSearch: "",
      classByDayLeader: "",
      classByDayCamp: "",
      classCompareByDayCamp: "",
      classCompareByDaySearch: "",
      classTierCompareCollapsed: true,
      classTypeCompareCollapsed: true,
      classFormatCompareCollapsed: true,
      classTierCompareExpanded: [],
      classTypeCompareExpanded: [],
      classTableSearch: "",
      classTableSort: "roiDesc",
      classTierDimension: "project",
      campBroadcasts: {},
      banDay: "全部",
      banInsightCopyText: ""
    })
    if (dom.fileClass) dom.fileClass.value = ""
    if (dom.fileLimit) dom.fileLimit.value = ""
    if (dom.summaryText) dom.summaryText.textContent = ""
    if (dom.importErrors) dom.importErrors.innerHTML = ""
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "overview"))
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === "overview"))
    renderFilterPanelState()
    renderImportState()
  }

  function initFilters() {
    if (!state.ui.projectMS) state.ui.projectMS = createMultiSelect(dom.projectSelect, "选择项目")
    if (!state.ui.monthMS) state.ui.monthMS = createMultiSelect(dom.monthSelect, "选择月份")
    if (!state.ui.weekMS) state.ui.weekMS = createMultiSelect(dom.weekSelect, "选择周")
    if (!state.ui.campMS) state.ui.campMS = createMultiSelect(dom.campSelect, "选择营期")
    if (!state.ui.groupMS) state.ui.groupMS = createMultiSelect(dom.groupSelect, "选择大组")
    if (!state.ui.smallGroupMS) state.ui.smallGroupMS = createMultiSelect(dom.smallGroupSelect, "选择小组")
    state.ui.projectMS.setOnChange((values) => {
      state.draftFilters.projects = values
      syncMonthOptions(state.draftFilters, { useDefault: true, forceAll: true })
      updateFilterApplyState()
    })
    state.ui.monthMS.setOnChange((values) => {
      state.draftFilters.months = values.map(Number)
      syncWeekOptions(state.draftFilters, { useDefault: true, forceAll: true })
      updateFilterApplyState()
    })
    state.ui.weekMS.setOnChange((values) => {
      state.draftFilters.weeks = values
      syncCampOptions(state.draftFilters, { useDefault: true, forceAll: true })
      updateFilterApplyState()
    })
    state.ui.campMS.setOnChange((values) => {
      state.draftFilters.camps = values
      syncGroupOptions(state.draftFilters, { forceAll: true })
      updateFilterApplyState()
    })
    state.ui.groupMS.setOnChange((values) => {
      state.draftFilters.groups = values
      syncSmallGroupOptions(state.draftFilters, { forceAll: true })
      updateFilterApplyState()
    })
    state.ui.smallGroupMS.setOnChange((values) => {
      state.draftFilters.smallGroups = values
      updateFilterApplyState()
    })

    state.draftFilters = cloneFilters(state.filters)
    const projectOptions = uniq(state.model.unifiedRows.map((row) => normalizeProjectName(row[state.model.meta.projectField]))).sort((a, b) => a.localeCompare(b, "zh-CN")).map((projectName) => ({
      value: projectName,
      label: projectName
    }))
    state.filters.projects = projectOptions.map((item) => item.value)
    state.draftFilters.projects = state.filters.projects.slice()
    state.ui.projectMS.setOptions(projectOptions, state.draftFilters.projects)
    const monthOptions = uniq(state.model.campSnapshots.map((item) => item.month).filter((item) => item !== null)).sort((a, b) => a - b).map((month) => ({
      value: String(month),
      label: `${month}月`
    }))
    const defaultMonths = recentMonthValues(monthOptions.map((item) => Number(item.value)), 2)
    state.filters.months = defaultMonths
    state.draftFilters.months = defaultMonths.slice()
    state.ui.monthMS.setOptions(monthOptions, defaultMonths.map((item) => String(item)))
    syncWeekOptions(state.draftFilters, { useDefault: true, forceAll: true })
    state.filters = cloneFilters(state.draftFilters)
    updateFilterApplyState()
  }

  function normalizedFilterValues(values) {
    return (values || []).map(String).sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }))
  }

  function filtersHaveChanges() {
    return ["projects", "months", "weeks", "camps", "groups", "smallGroups"].some((key) => {
      return JSON.stringify(normalizedFilterValues(state.filters[key])) !== JSON.stringify(normalizedFilterValues(state.draftFilters[key]))
    })
  }

  function updateFilterApplyState() {
    if (!dom.applyFiltersBtn) return
    const dirty = filtersHaveChanges()
    dom.applyFiltersBtn.disabled = !dirty
    dom.applyFiltersBtn.textContent = dirty ? "应用筛选" : "筛选已生效"
    dom.filterPanel?.classList.toggle("has-draft-changes", dirty)
  }

  function filteredRowsForOptions(targetFilters, { ignoreMonths = false, ignoreWeeks = false, ignoreCamps = false, ignoreGroups = false, ignoreSmallGroups = false } = {}) {
    const meta = currentMeta()
    const projectSet = new Set(targetFilters.projects)
    const monthSet = new Set(targetFilters.months)
    const weekSet = new Set(targetFilters.weeks)
    const campSet = new Set(targetFilters.camps)
    const groupSet = new Set(targetFilters.groups)
    const smallGroupSet = new Set(targetFilters.smallGroups)
    return state.model.unifiedRows.filter((row) => {
      const projectName = normalizeProjectName(row[meta.projectField])
      const month = normalizeMonth(row[meta.monthFieldClass], row._营期月份)
      const weekKey = rowWeekKey(row, meta)
      const campId = String(row[meta.campField] || "").trim()
      const groupName = String(row[meta.groupField] || "未知大组").trim() || "未知大组"
      const smallGroupName = String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组"
      return (!projectSet.size || projectSet.has(projectName))
        && (ignoreMonths || !monthSet.size || monthSet.has(month))
        && (ignoreWeeks || !weekSet.size || weekSet.has(weekKey))
        && (ignoreCamps || !campSet.size || campSet.has(campId))
        && (ignoreGroups || !groupSet.size || groupSet.has(groupName))
        && (ignoreSmallGroups || !smallGroupSet.size || smallGroupSet.has(smallGroupName))
    })
  }

  function syncMonthOptions(targetFilters, { useDefault = false, forceAll = false } = {}) {
    const meta = currentMeta()
    const rows = filteredRowsForOptions(targetFilters, { ignoreMonths: true, ignoreWeeks: true, ignoreCamps: true, ignoreGroups: true, ignoreSmallGroups: true })
    const options = uniq(rows.map((row) => normalizeMonth(row[meta.monthFieldClass], row._营期月份)).filter((month) => month !== null)).sort((a, b) => a - b).map((month) => ({
      value: String(month),
      label: `${month}月`
    }))
    const selected = targetFilters.months.filter((value) => options.some((item) => Number(item.value) === value))
    targetFilters.months = selected.length ? selected : (useDefault ? recentMonthValues(options.map((item) => Number(item.value)), 2) : options.map((item) => Number(item.value)))
    state.ui.monthMS.setOptions(options, targetFilters.months.map((item) => String(item)))
    syncWeekOptions(targetFilters, { useDefault: true, forceAll })
  }

  function syncWeekOptions(targetFilters, { useDefault = false, forceAll = false } = {}) {
    const meta = currentMeta()
    const rows = filteredRowsForOptions(targetFilters, { ignoreWeeks: true, ignoreCamps: true, ignoreGroups: true, ignoreSmallGroups: true })
    const weekMap = new Map()
    rows.forEach((row) => {
      const weekKey = rowWeekKey(row, meta)
      const weekLabel = rowWeekLabel(row, meta)
      if (!weekKey || !weekLabel) return
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, weekLabel)
    })
    const options = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0], "zh-CN")).map(([value, label]) => ({ value, label }))
    const selected = targetFilters.weeks.filter((value) => options.some((item) => item.value === value))
    targetFilters.weeks = forceAll ? options.map((item) => item.value) : (selected.length ? selected : (useDefault ? options.map((item) => item.value) : []))
    state.ui.weekMS.setOptions(options, targetFilters.weeks)
    syncCampOptions(targetFilters, { useDefault: true, forceAll })
  }

  function syncCampOptions(targetFilters, { useDefault = false, forceAll = false } = {}) {
    const meta = currentMeta()
    const rows = filteredRowsForOptions(targetFilters, { ignoreCamps: true, ignoreGroups: true, ignoreSmallGroups: true })
    const campMeta = new Map()
    rows.forEach((row) => {
      const campId = String(row[meta.campField] || "").trim()
      if (!campId || campMeta.has(campId)) return
      campMeta.set(campId, parseStartDate(row[meta.startField]))
    })
    const options = Array.from(campMeta.entries()).sort((a, b) => {
      const ta = a[1] ? a[1].getTime() : 0
      const tb = b[1] ? b[1].getTime() : 0
      return ta - tb || a[0].localeCompare(b[0], "zh-CN")
    }).map(([campId, startDate]) => ({ value: campId, label: `${campId}｜${startDate ? formatDate(startDate) : "未知"}` }))
    const selected = forceAll
      ? options.map((item) => item.value)
      : useDefault
        ? defaultCampIds(options.map((item) => {
          const found = state.model.campSnapshots.find((camp) => camp.campId === item.value)
          return found || { campId: item.value, status: "", endDate: null }
        }), targetFilters)
        : targetFilters.camps.filter((value) => options.some((item) => item.value === value))
    targetFilters.camps = selected.length ? selected : options.map((item) => item.value)
    state.ui.campMS.setOptions(options, targetFilters.camps)
    syncGroupOptions(targetFilters, { useDefault: true, forceAll })
  }

  function syncGroupOptions(targetFilters, { useDefault = false, forceAll = false } = {}) {
    const meta = currentMeta()
    const rows = filteredRowsForOptions(targetFilters, { ignoreGroups: true, ignoreSmallGroups: true })
    const options = uniq(rows.map((row) => String(row[meta.groupField] || "未知大组").trim() || "未知大组")).sort((a, b) => a.localeCompare(b, "zh-CN")).map((groupName) => ({ value: groupName, label: groupName }))
    const selected = targetFilters.groups.filter((value) => options.some((item) => item.value === value))
    targetFilters.groups = forceAll ? options.map((item) => item.value) : (selected.length ? selected : (useDefault ? options.map((item) => item.value) : []))
    state.ui.groupMS.setOptions(options, targetFilters.groups)
    syncSmallGroupOptions(targetFilters, { useDefault, forceAll })
  }

  function syncSmallGroupOptions(targetFilters, { useDefault = false, forceAll = false } = {}) {
    const meta = currentMeta()
    const rows = filteredRowsForOptions(targetFilters, { ignoreSmallGroups: true })
    const options = uniq(rows.map((row) => String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组")).sort((a, b) => a.localeCompare(b, "zh-CN")).map((smallGroupName) => ({ value: smallGroupName, label: smallGroupName }))
    const selected = targetFilters.smallGroups.filter((value) => options.some((item) => item.value === value))
    targetFilters.smallGroups = forceAll ? options.map((item) => item.value) : (selected.length ? selected : (useDefault ? options.map((item) => item.value) : []))
    state.ui.smallGroupMS.setOptions(options, targetFilters.smallGroups)
  }

  function defaultCampIds(camps, targetFilters = state.filters) {
    const sevenDaysAgo = new Date(targetFilters.asOfDate.getFullYear(), targetFilters.asOfDate.getMonth(), targetFilters.asOfDate.getDate() - 6)
    const ids = camps.filter((item) => item.status === "进行中" || (item.endDate && item.endDate >= sevenDaysAgo && item.endDate <= targetFilters.asOfDate)).map((item) => item.campId)
    return ids.length ? uniq(ids) : camps.map((item) => item.campId)
  }

  function applyFilters() {
    if (!state.model) return
    state.filters = cloneFilters({ ...state.draftFilters, asOfDate: state.filters.asOfDate })
    updateFilterApplyState()
    renderAll()
  }

  function createMultiSelect(host, placeholder) {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "ms-btn"
    const label = document.createElement("span")
    label.textContent = placeholder
    const icon = document.createElement("span")
    icon.textContent = "▾"
    button.append(label, icon)

    const menu = document.createElement("div")
    menu.className = "ms-menu hidden"
    const actions = document.createElement("div")
    actions.className = "ms-actions"
    const allBtn = document.createElement("button")
    allBtn.type = "button"
    allBtn.textContent = "全选"
    const noneBtn = document.createElement("button")
    noneBtn.type = "button"
    noneBtn.textContent = "清空"
    actions.append(allBtn, noneBtn)
    const list = document.createElement("div")
    list.className = "ms-list"
    menu.append(actions, list)
    host.innerHTML = ""
    host.append(button, menu)

    let options = []
    let selected = new Set()
    let onChange = () => {}

    function refreshText() {
      if (!options.length) label.textContent = placeholder
      else if (!selected.size) label.textContent = "未选择"
      else if (selected.size === options.length) label.textContent = "已全选"
      else label.textContent = `已选 ${selected.size} 项`
    }

    function render() {
      list.innerHTML = ""
      options.forEach((option) => {
        const row = document.createElement("label")
        row.className = "ms-item"
        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.checked = selected.has(option.value)
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) selected.add(option.value)
          else selected.delete(option.value)
          refreshText()
          onChange(Array.from(selected))
        })
        const text = document.createElement("span")
        text.textContent = option.label
        row.append(checkbox, text)
        list.appendChild(row)
      })
      refreshText()
    }

    button.addEventListener("click", () => menu.classList.toggle("hidden"))
    document.addEventListener("click", (event) => {
      if (!host.contains(event.target)) menu.classList.add("hidden")
    })
    allBtn.addEventListener("click", () => {
      selected = new Set(options.map((option) => option.value))
      render()
      onChange(Array.from(selected))
    })
    noneBtn.addEventListener("click", () => {
      selected = new Set()
      render()
      onChange([])
    })

    return {
      setOptions(newOptions, selectedValues) {
        options = newOptions
        selected = new Set(selectedValues || [])
        render()
      },
      setOnChange(handler) {
        onChange = handler
      }
    }
  }

  function renderAll() {
    const scopedRows = getScopedUnifiedRows(null)
    const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
    const camps = scoped.campSnapshots
    const groups = scoped.groupSnapshots
    const smallGroups = scoped.smallGroupSnapshots
    const classes = scoped.classSnapshots
    dom.asOfText.textContent = `分析日期：${formatDate(state.filters.asOfDate)}`
    renderFilterPanelState()
    const projectCount = uniq(scopedRows.map((row) => normalizeProjectName(row?.[state.model.meta.projectField]))).filter(Boolean).length
    dom.summaryText.textContent = `当前筛选范围内共有 ${projectCount} 个项目、${camps.length} 个营期、${groups.length} 个大组分析对象、${smallGroups.length} 个小组分析对象、${classes.length} 个班级分析对象，建议先看总览识别风险，再下钻到项目对比、营期页、大组页和班级页。`
    renderActiveScopeSummary()
    renderActiveTab({ scopedRows, ...scoped })
    resizeVisiblePlots()
  }

  function renderActiveTab(prebuilt = null) {
    if (!state.model) return
    const useOverviewScope = state.ui.activeTab === "overview"
    const scopedRows = useOverviewScope
      ? getOverviewScopedRows()
      : (prebuilt?.scopedRows || getScopedUnifiedRows(null))
    const scoped = useOverviewScope
      ? buildSnapshotsFromRows(scopedRows, state.model.meta)
      : (prebuilt || buildSnapshotsFromRows(scopedRows, state.model.meta))
    const camps = scoped.campSnapshots
    const groups = scoped.groupSnapshots
    const smallGroups = scoped.smallGroupSnapshots
    const classes = scoped.classSnapshots
    if (dom.asOfText) dom.asOfText.textContent = `分析日期：${formatDate(state.filters.asOfDate)}`
    if (dom.summaryText) {
      const projectCount = uniq(scopedRows.map((row) => normalizeProjectName(row?.[state.model.meta.projectField]))).filter(Boolean).length
      dom.summaryText.textContent = `当前筛选范围内共有 ${projectCount} 个项目、${camps.length} 个营期、${groups.length} 个大组分析对象、${smallGroups.length} 个小组分析对象、${classes.length} 个班级分析对象，建议先看总览识别风险，再下钻到项目对比、营期页、大组页和班级页。`
    }
    if (state.ui.activeTab === "overview") renderOverview(camps, groups, smallGroups, classes)
    else if (state.ui.activeTab === "project-compare") renderProjectCompareSection(camps, scopedRows)
    else if (state.ui.activeTab === "camp") renderCampSection(camps, scopedRows)
    else if (state.ui.activeTab === "group") renderGroupSection(groups, classes)
    else if (state.ui.activeTab === "small-group") renderSmallGroupSection(smallGroups, classes)
    else if (state.ui.activeTab === "class") renderClassSection(classes)
    else if (state.ui.activeTab === "ban-impact") renderBanImpactSection(scopedRows)
    else if (state.ui.activeTab === "quality") renderQuality(scopedRows, camps, groups, smallGroups, classes)
  }

  function renderFilterPanelState() {
    if (!dom.filterPanel || !dom.toggleFiltersBtn) return
    dom.filterPanel.classList.toggle("collapsed", !!state.ui.filterCollapsed)
    dom.toggleFiltersBtn.textContent = state.ui.filterCollapsed ? "展开筛选" : "收起筛选"
  }

  function renderSidebarState() {
    if (!dom.dashboardView) return
    dom.dashboardView.classList.toggle("sidebar-collapsed", !!state.ui.sidebarCollapsed)
    if (dom.toggleSidebarBtn) {
      dom.toggleSidebarBtn.textContent = "📌"
      dom.toggleSidebarBtn.classList.toggle("is-pinned", !state.ui.sidebarCollapsed)
      dom.toggleSidebarBtn.setAttribute("title", state.ui.sidebarCollapsed ? "固定导航" : "取消固定")
      dom.toggleSidebarBtn.setAttribute("aria-label", state.ui.sidebarCollapsed ? "固定导航" : "取消固定")
      dom.toggleSidebarBtn.setAttribute("aria-pressed", String(!state.ui.sidebarCollapsed))
    }
    resizeVisiblePlots()
  }

  function filterScopeText(values, emptyLabel, suffix = "") {
    if (!Array.isArray(values) || !values.length) return emptyLabel
    const shown = values.slice(0, 2).map((value) => `${value}${suffix}`)
    return values.length > 2 ? `${shown.join("、")}等${values.length}项` : shown.join("、")
  }

  function renderActiveScopeSummary() {
    if (!dom.activeScopeSummary) return
    const parts = [
      filterScopeText(state.filters.projects, "全部项目"),
      filterScopeText(state.filters.months, "全部月份", "月"),
      filterScopeText(state.filters.weeks, "全部周"),
      filterScopeText(state.filters.camps, "全部营期"),
      filterScopeText(state.filters.groups, "全部大组"),
      filterScopeText(state.filters.smallGroups, "全部小组")
    ]
    dom.activeScopeSummary.textContent = `当前范围：${parts.join("  /  ")}`
  }

  function resizeVisiblePlots() {
    if (visiblePlotResizeTimer) clearTimeout(visiblePlotResizeTimer)
    const resizeOnce = () => {
      document.querySelectorAll(".tab-panel.active .chart .js-plotly-plot, .tab-panel.active .chart, .chart-modal:not(.hidden) .chart").forEach((el) => {
        const host = el.classList?.contains("chart") ? el : el.closest(".chart")
        const plotEl = el.classList?.contains("js-plotly-plot") ? el : el.querySelector(".js-plotly-plot")
        if (!plotEl || !host) return
        const box = host.getBoundingClientRect()
        if (box.width < 80 || box.height < 80) return
        try {
          Plotly.Plots.resize(plotEl)
        } catch {}
      })
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(resizeOnce)
      visiblePlotResizeTimer = setTimeout(resizeOnce, 180)
    })
  }

  function metricCard(label, value, hint, statusText, statusClass) {
    return `
      <div class="metric-card">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${value}</div>
        <div class="metric-sub">
          <span>${hint}</span>
          <span class="metric-status ${statusClass || ""}">${statusText || "-"}</span>
        </div>
      </div>
    `
  }

  function monthlyStats(items) {
    const grouped = groupBy(items.filter((item) => item.month !== null), (item) => String(item.month))
    const months = Array.from(grouped.keys()).map(Number).sort((a, b) => a - b)
    return months.map((month) => {
      const rows = grouped.get(String(month)) || []
      const revenue = sum(rows.map((item) => item.metrics.revenue))
      const cost = sum(rows.map((item) => item.metrics.cost))
      const adds = sum(rows.map((item) => item.metrics.adds))
      const conv = sum(rows.map((item) => item.metrics.conv))
      const leaderCount = sum(rows.map((item) => parseNumber(item.raw?._班长数)))
      const machineSlots = sum(rows.map((item) => firstMetric(item.raw, item.supplement, ["机器号数"])))
      const upgradeNumerator = sum(rows.map((item) => parseNumber(item.raw?._升班分子)))
      const upgradeDenominator = sum(rows.map((item) => parseNumber(item.raw?._升班分母)))
      const pendingPeople = sum(rows.map((item) => parseNumber(item.raw?._待支付人数)))
      const pendingConvPeople = sum(rows.map((item) => parseNumber(item.raw?._待支付转化人数)))
      const individualRevenue = sum(rows.map((item) => parseNumber(item.raw?._个销流水)))
      return {
        month,
        rows,
        revenue,
        cost,
        adds,
        conv,
        roi: ratio(revenue, cost),
        convRate: ratio(conv, adds),
        leaderCount,
        machineSlots,
        personEfficiency: ratio(adds, leaderCount),
        machineLoad: ratio(adds, machineSlots),
        upgradeRate: ratio(upgradeNumerator, upgradeDenominator),
        aov: ratio(revenue, conv),
        addCost: ratio(cost, adds),
        addRevenue: ratio(revenue, adds),
        individualShare: ratio(individualRevenue, revenue),
        pendingRate: ratio(pendingPeople, adds),
        pendingConvRate: ratio(pendingConvPeople, pendingPeople)
      }
    })
  }

  function compareText(current, previous, lowerIsBetter = false, pct = false) {
    if (!Number.isFinite(current) || !Number.isFinite(previous)) return "缺少基线"
    const diff = current - previous
    if (Math.abs(diff) < 1e-9) return "与上月持平"
    const better = lowerIsBetter ? diff < 0 : diff > 0
    const prefix = better ? "优于上月" : "弱于上月"
    return `${prefix} ${pct ? formatPct(Math.abs(diff)) : formatNum(Math.abs(diff), 2)}`
  }

  function compareClass(current, previous, lowerIsBetter = false) {
    if (!Number.isFinite(current) || !Number.isFinite(previous)) return "warn"
    const better = lowerIsBetter ? current < previous : current > previous
    return better ? "good" : "bad"
  }

  const OUTPUT_PER_LEADER_TARGET = 15000

  function focusOverviewCampAnomalies(campId) {
    if (!campId) return
    state.ui.overviewFocusedCampId = campId
    renderActiveTab()
    dom.yesterdayAnomalyFocus?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function clearOverviewCampAnomalyFocus() {
    if (!state.ui.overviewFocusedCampId) return
    state.ui.overviewFocusedCampId = null
    renderActiveTab()
    dom.yesterdayAnomalyTable?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function applyScopedCampFilters(campId) {
    if (!state.model || !campId) return
    const nextFilters = cloneFilters(state.filters)
    nextFilters.months = []
    nextFilters.weeks = []
    nextFilters.camps = [campId]
    nextFilters.groups = []
    nextFilters.smallGroups = []
    syncMonthOptions(nextFilters, { useDefault: false, forceAll: false })
    state.draftFilters = cloneFilters(nextFilters)
    state.filters = cloneFilters(nextFilters)
    updateFilterApplyState()
  }

  function openCampAnalysisWithCamp(campId) {
    if (!campId) return
    state.ui.overviewFocusedCampId = null
    applyScopedCampFilters(campId)
    renderAll()
    switchAnalysisTab("camp", { scroll: false })
  }

  function openClassByDayWithContext(className, campId) {
    if (!className || !campId) return
    state.ui.overviewFocusedCampId = null
    applyScopedCampFilters(campId)
    state.ui.classByDayLeader = className
    state.ui.classByDayCamp = campId
    state.ui.classCompareByDayCamp = campId
    renderAll()
    switchAnalysisTab("class", { scroll: false })
    document.getElementById("classByDaySection")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function overviewFocusMetric(item, key) {
    if (key === "pendingRate") return item.metrics.pendingRate
    if (key === "pendingConv") return item.metrics.pendingConv
    if (key === "highImmerseRate") return normalizeRateLikeValue(firstMetric(item.raw, item.supplement, ["高沉浸率"]))
    if (key === "highImmerseConvRate") return normalizeRateLikeValue(firstMetric(item.raw, item.supplement, ["高沉浸转率"]))
    return null
  }

  function previousDayProcessAnomalies(activeCamps, smallGroups) {
    const metricSpecs = [
      { key: "到播", label: "到播率", lowerIsBetter: false, formatter: formatPct },
      { key: "留存", label: "留存率", lowerIsBetter: false, formatter: formatPct },
      { key: "回复", label: "班长回复率", lowerIsBetter: false, formatter: formatPct },
      { key: "回复时长", label: "班长回复时长", lowerIsBetter: true, formatter: (value) => `${formatNum(value, 0)}秒` }
    ]
    const anomalies = []
    const campStatus = []
    activeCamps.forEach((camp) => {
      const checkDay = camp.status === "已结营" ? 7 : Math.max(0, (camp.day || 0) - 1)
      const currentStage = camp.status === "已结营" ? "结营次日" : `Day${camp.day || "-"}`
      const peers = smallGroups.filter((item) => item.campId === camp.campId)
      if (checkDay < 1) {
        campStatus.push({ campId: camp.campId, checkDay, status: "waiting", available: 0 })
        return
      }
      let available = 0
      metricSpecs.forEach((spec) => {
        const field = `day${checkDay}${spec.key}`
        const values = peers.map((item) => firstMetric(item.raw, item.supplement, [field])).filter(Number.isFinite)
        if (!values.length) return
        available += 1
        const peerMedian = median(values)
        peers.forEach((item) => {
          const value = firstMetric(item.raw, item.supplement, [field])
          if (!Number.isFinite(value) || !Number.isFinite(peerMedian)) return
          const absoluteGap = spec.lowerIsBetter ? value - peerMedian : peerMedian - value
          const relativeGap = absoluteGap / Math.max(Math.abs(peerMedian), 0.01)
          const abnormal = spec.lowerIsBetter
            ? absoluteGap >= 120 && relativeGap >= 0.5
            : absoluteGap >= 0.08 && relativeGap >= 0.2
          if (!abnormal) return
          anomalies.push({
            campId: camp.campId,
            currentDay: camp.day,
            checkDay,
            groupName: item.groupName,
            smallGroupName: item.smallGroupName,
            metric: spec.label,
            value,
            benchmark: peerMedian,
            gap: absoluteGap,
            formatter: spec.formatter,
            severity: relativeGap >= 0.35 ? "high" : "medium"
          })
        })
      })
      campStatus.push({ campId: camp.campId, checkDay, status: available ? "checked" : "missing", available })
    })
    anomalies.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity) || b.gap - a.gap)
    return { anomalies, campStatus }
  }

  function alertLevelByDeviation(relativeDeviation) {
    if (relativeDeviation >= 0.2) return { key: "red", label: "红色", className: "bad", weight: 3 }
    if (relativeDeviation >= 0.1) return { key: "orange", label: "橙色", className: "orange", weight: 2 }
    if (relativeDeviation >= 0.05) return { key: "yellow", label: "黄色", className: "warn", weight: 1 }
    return null
  }

  function historicalEntityMatches(kind, current, candidate) {
    if (normalizeProjectName(candidate.projectName) !== normalizeProjectName(current.projectName)) return false
    if (kind === "group") return candidate.groupName === current.groupName
    if (kind === "smallGroup") return candidate.groupName === current.groupName && candidate.smallGroupName === current.smallGroupName
    return true
  }

  function hierarchicalYesterdayAnomalies(activeCamps, scopedGroups, scopedSmallGroups, scopedClasses) {
    const metricSpecs = [
      { key: "到播", label: "到播率", inverse: false, formatter: formatPct },
      { key: "留存", label: "留存率", inverse: false, formatter: formatPct },
      { key: "回复", label: "班长回复率", inverse: false, formatter: formatPct },
      { key: "回复时长", label: "班长回复时长", inverse: true, formatter: (value) => `${formatNum(value, 0)}秒` }
    ]
    const definitions = [
      { kind: "project", label: "项目", current: activeCamps, history: state.model.campSnapshots || [] },
      { kind: "group", label: "大组", current: scopedGroups, history: state.model.groupSnapshots || [] },
      { kind: "smallGroup", label: "小组", current: scopedSmallGroups, history: state.model.smallGroupSnapshots || [] },
      { kind: "class", label: "班长", current: scopedClasses, history: state.model.classSnapshots || [] }
    ]
    const records = []
    const campStatus = []
    let insufficientBaselines = 0

    activeCamps.forEach((camp) => {
      const checkDay = camp.status === "已结营" ? 7 : Math.max(0, (camp.day || 0) - 1)
      const currentStage = camp.status === "已结营" ? "结营次日" : `Day${camp.day || "-"}`
      if (checkDay < 1) {
        campStatus.push({ campId: camp.campId, checkDay, status: "waiting", available: 0 })
        return
      }
      let available = 0
      definitions.forEach((definition) => {
        const currentItems = definition.current.filter((item) => item.campId === camp.campId)
        currentItems.forEach((item) => {
          metricSpecs.forEach((spec) => {
            const field = `day${checkDay}${spec.key}`
            const value = firstMetric(item.raw, item.supplement, [field])
            if (!Number.isFinite(value)) return
            available += 1
            let benchmark = null
            let baselineLabel = ""
            let sampleCount = 0

            if (definition.kind === "class") {
              const peers = scopedClasses.filter((peer) => peer.campId === camp.campId && Number.isFinite(firstMetric(peer.raw, peer.supplement, [field])))
              const peerValues = peers.map((peer) => firstMetric(peer.raw, peer.supplement, [field])).filter(Number.isFinite)
              benchmark = avg(peerValues)
              sampleCount = peerValues.length
              baselineLabel = `同营期${sampleCount}位班长均值`
            } else {
              const historyItems = definition.history
                .filter((candidate) => candidate.campId !== camp.campId
                  && candidate.startDate && camp.startDate && candidate.startDate < camp.startDate
                  && historicalEntityMatches(definition.kind, item, candidate)
                  && Number.isFinite(firstMetric(candidate.raw, candidate.supplement, [field])))
                .sort((a, b) => (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0))
                .slice(0, 5)
              sampleCount = historyItems.length
              if (sampleCount) {
                const aggregate = buildSnapshotAggregateItem(historyItems, "历史基准")
                benchmark = firstMetric(aggregate?.raw, aggregate?.supplement, [field])
              }
              baselineLabel = `历史${sampleCount}期同Day基准`
            }

            if (!Number.isFinite(benchmark) || !sampleCount) {
              insufficientBaselines += 1
              return
            }

            let relativeDeviation = spec.inverse
              ? (value - benchmark) / Math.max(Math.abs(benchmark), 0.01)
              : (benchmark - value) / Math.max(Math.abs(benchmark), 0.01)
            let alert = alertLevelByDeviation(relativeDeviation)
            let ruleLabel = baselineLabel

            if (definition.kind === "class" && spec.key === "回复时长") {
              const threshold = checkDay <= 5 ? 1800 : 3600
              if (value <= threshold) return
              relativeDeviation = (value - threshold) / threshold
              alert = alertLevelByDeviation(Math.max(relativeDeviation, 0.05))
              benchmark = threshold
              ruleLabel = checkDay <= 5 ? "固定预警线30分钟" : "固定预警线1小时"
            } else if (definition.kind === "class" && spec.key === "回复") {
              const threshold = checkDay <= 5 ? 0.9 : checkDay === 6 ? 0.7 : 0.6
              if (value >= threshold) return
              relativeDeviation = (threshold - value) / threshold
              alert = alertLevelByDeviation(Math.max(relativeDeviation, 0.05))
              benchmark = threshold
              ruleLabel = `固定预警线${formatPct(threshold, 0)}`
            }

            if (!alert) return
            const objectName = definition.kind === "project"
              ? (item.projectName || "默认项目")
              : definition.kind === "group"
                ? item.groupName
                : definition.kind === "smallGroup"
                  ? `${item.groupName} / ${item.smallGroupName}`
                  : `${item.groupName} / ${item.smallGroupName} / ${item.className}`
            records.push({
              dimension: definition.label,
              kind: definition.kind,
              projectName: item.projectName || "默认项目",
              campId: camp.campId,
              className: item.className || "",
              currentDay: camp.day,
              currentStage,
              checkDay,
              objectName,
              metric: spec.label,
              value,
              benchmark,
              baselineLabel: ruleLabel,
              formatter: spec.formatter,
              alert,
              relativeDeviation
            })
          })
        })
      })
      campStatus.push({ campId: camp.campId, checkDay, status: available ? "checked" : "missing", available })
    })
    records.sort((a, b) => b.alert.weight - a.alert.weight || b.relativeDeviation - a.relativeDeviation)
    return { anomalies: records, campStatus, insufficientBaselines }
  }

  function comparisonInline(current, previous, formatter = formatPct) {
    if (!Number.isFinite(current)) return `<span class="overview-metric-main">—</span>`
    if (!Number.isFinite(previous)) return `<span class="overview-metric-main">${formatter(current)}</span><small>无前期基线</small>`
    const diff = current - previous
    const direction = Math.abs(diff) < 1e-9 ? "持平" : diff > 0 ? "↑" : "↓"
    return `<span class="overview-metric-main">${formatter(current)}</span><small>${direction} ${formatter(Math.abs(diff))}</small>`
  }

  function projectHistoryForDay(camp, field) {
    return (state.model.campSnapshots || [])
      .filter((item) => item.campId !== camp.campId
        && normalizeProjectName(item.projectName) === normalizeProjectName(camp.projectName)
        && item.startDate && camp.startDate && item.startDate < camp.startDate
        && Number.isFinite(firstMetric(item.raw, item.supplement, [field])))
      .sort((a, b) => (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0))
      .slice(0, 5)
  }

  function dayMetricWithBenchmark(camp, checkDay, suffix, stageStart = 1) {
    if (checkDay < stageStart) return { value: null, benchmark: null, status: "暂未进入", alert: null }
    const field = `day${checkDay}${suffix}`
    const value = firstMetric(camp.raw, camp.supplement, [field])
    const history = projectHistoryForDay(camp, field)
    const aggregate = history.length ? buildSnapshotAggregateItem(history, "历史基准") : null
    const benchmark = firstMetric(aggregate?.raw, aggregate?.supplement, [field])
    if (!Number.isFinite(value)) return { value, benchmark, status: "数据未更新", alert: null }
    if (!Number.isFinite(benchmark)) return { value, benchmark, status: "基准不足", alert: null }
    const deviation = (benchmark - value) / Math.max(Math.abs(benchmark), 0.01)
    const alert = alertLevelByDeviation(deviation)
    return { value, benchmark, status: alert ? `${alert.label}预警` : "正常", alert, deviation, sampleCount: history.length }
  }

  function effectiveAttendMetric(camp, checkDay) {
    const attend = dayMetricWithBenchmark(camp, checkDay, "到播")
    const retention = dayMetricWithBenchmark(camp, checkDay, "留存")
    const value = Number.isFinite(attend.value) && Number.isFinite(retention.value) ? attend.value * retention.value : null
    const fieldAttend = `day${checkDay}到播`
    const fieldRetention = `day${checkDay}留存`
    const candidates = (state.model.campSnapshots || [])
      .filter((item) => item.campId !== camp.campId
        && normalizeProjectName(item.projectName) === normalizeProjectName(camp.projectName)
        && item.startDate && camp.startDate && item.startDate < camp.startDate)
      .sort((a, b) => (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0))
      .map((item) => {
        const a = firstMetric(item.raw, item.supplement, [fieldAttend])
        const r = firstMetric(item.raw, item.supplement, [fieldRetention])
        return Number.isFinite(a) && Number.isFinite(r) ? a * r : null
      })
      .filter(Number.isFinite)
      .slice(0, 5)
    const benchmark = avg(candidates)
    if (!Number.isFinite(value)) return { value, benchmark, status: "数据未更新", alert: null, attend, retention }
    if (!Number.isFinite(benchmark)) return { value, benchmark, status: "基准不足", alert: null, attend, retention }
    const deviation = (benchmark - value) / Math.max(Math.abs(benchmark), 0.01)
    const alert = alertLevelByDeviation(deviation)
    return { value, benchmark, status: alert ? `${alert.label}预警` : "正常", alert, deviation, attend, retention }
  }

  function anomalyBusinessJudgement(metric) {
    if (/到播率/.test(metric)) return "用户召回不足，直播间覆盖用户偏少"
    if (/留存率/.test(metric)) return "直播内容承接偏弱，有效听课用户不足"
    if (/回复率/.test(metric)) return "班长触达覆盖不足，可能影响用户承接"
    if (/回复时长/.test(metric)) return "班长响应不及时，需要当天介入"
    return "该指标低于对应基准，需要进一步下钻确认"
  }

  function buildCampBroadcast(camp, process) {
    const checkDay = Math.max(0, (camp.day || 0) - 1)
    if (checkDay < 1) return `【${camp.projectName || "默认项目"}｜${camp.campId}｜Day1播报】\n\n当前为Day1，昨日暂无完整课程数据，明早开始检查Day1表现。`
    const effective = effectiveAttendMetric(camp, checkDay)
    const pending = dayMetricWithBenchmark(camp, checkDay, "待支付率", 3)
    const pendingConv = dayMetricWithBenchmark(camp, checkDay, "待支付转率", 3)
    const conv = dayMetricWithBenchmark(camp, checkDay, "转率", 3)
    const metricAlerts = [effective, pending, pendingConv, conv].map((item) => item.alert).filter(Boolean)
    const campAnomalies = process.anomalies.filter((item) => item.campId === camp.campId)
    const allAlerts = [...metricAlerts, ...campAnomalies.map((item) => item.alert)]
    const counts = {
      red: allAlerts.filter((item) => item.key === "red").length,
      orange: allAlerts.filter((item) => item.key === "orange").length,
      yellow: allAlerts.filter((item) => item.key === "yellow").length
    }
    const overall = counts.red ? "高风险" : counts.orange ? "异常" : counts.yellow ? "需关注" : "正常"
    let blockage = "暂未发现明显阻塞"
    let judgement = "昨日关键链路整体处于正常波动范围，继续观察今日数据。"
    if (effective.attend.alert) {
      blockage = "添加→到播"
      judgement = "用户召回偏弱，可能影响后续直播间有效用户池。"
    } else if (effective.retention.alert || effective.alert) {
      blockage = "到播→有效听课"
      judgement = "用户已经进入直播间，但内容承接和有效听课表现偏弱。"
    } else if (pending.alert) {
      blockage = "有效听课→待支付"
      judgement = "有效听课用户未充分形成购买意向，需要检查直播间转化承接。"
    } else if (pendingConv.alert || conv.alert) {
      blockage = "待支付→成交"
      judgement = "购买意向已经形成，但支付催化和后续收回效率偏弱。"
    }
    const topAnomalies = campAnomalies.filter((item) => item.kind === "smallGroup" || item.kind === "class").slice(0, 3)
    const anomalyLines = [0, 1, 2].map((index) => {
      const item = topAnomalies[index]
      return item
        ? `${index + 1}. ${item.alert.key === "red" ? "🔴" : item.alert.key === "orange" ? "🟠" : "🟡"} ${item.objectName}：${item.metric}${item.formatter(item.value)}，${anomalyBusinessJudgement(item.metric)}`
        : `${index + 1}. 暂无更多重点异常`
    }).join("\n")
    const actions = []
    if (blockage === "添加→到播") actions.push("复盘昨日召回触达情况，优先跟进到播偏低的小组和班长。")
    else if (blockage === "到播→有效听课") actions.push("复盘直播内容承接与课堂节奏，重点检查低留存小组。")
    else if (blockage === "有效听课→待支付") actions.push("检查直播间购买意向引导，复盘待支付率偏低环节。")
    else if (blockage === "待支付→成交") actions.push("盘点待支付用户并加强支付催化和个销跟进。")
    else actions.push("保持当前运营节奏，持续观察今日关键指标。")
    if (campAnomalies.some((item) => item.kind === "class" && /回复/.test(item.metric))) actions.push("当天完成异常班长回复情况核查，并明确整改时点。")
    else actions.push("关注小组和班长执行情况，避免过程指标出现明显下滑。")
    actions.push(`明早复查Day${camp.day}完整数据，确认异常是否恢复。`)

    const metricLine = (label, metric) => {
      if (metric.status === "暂未进入") return `- ${label}：暂未进入`
      if (!Number.isFinite(metric.value)) return `- ${label}：数据未更新`
      return `- ${label}：${formatPct(metric.value)}｜基准${formatPct(metric.benchmark)}｜${metric.status}`
    }
    const coreConclusion = `${blockage === "暂未发现明显阻塞" ? "昨日关键链路整体正常" : `昨日主要卡在“${blockage}”环节`}；${judgement}`
    return `【${camp.projectName || "默认项目"}｜${camp.campId}｜Day${camp.day}播报】

昨日判断：${overall}｜预警 🔴${counts.red} 🟠${counts.orange} 🟡${counts.yellow}

核心结论：
${coreConclusion}

关键指标：
${metricLine("有效到播率", effective)}
  到播${formatPct(effective.attend.value)}，留存${formatPct(effective.retention.value)}
${metricLine("待支付率", pending)}
${metricLine("待支付转率", pendingConv)}
${metricLine("转率", conv)}

主要阻塞：
${blockage}
${judgement}

重点异常：
${anomalyLines}

今日动作：
1. ${actions[0]}
2. ${actions[1]}
3. ${actions[2]}`
  }

  function renderOverview(camps, groups, smallGroups, classes) {
    const activeCamps = camps.filter((item) => item.status === "进行中").sort(compareStart)
    const yesterday = new Date(state.filters.asOfDate.getFullYear(), state.filters.asOfDate.getMonth(), state.filters.asOfDate.getDate() - 1)
    const justClosedCamps = camps.filter((item) => item.status === "已结营" && item.endDate && formatDate(item.endDate) === formatDate(yesterday))
    const monitoredCamps = [...activeCamps, ...justClosedCamps]
    const closedCamps = camps.filter((item) => item.status === "已结营").sort((a, b) => (b.endDate?.getTime() || 0) - (a.endDate?.getTime() || 0)).slice(0, 3)
    const process = hierarchicalYesterdayAnomalies(monitoredCamps, groups, smallGroups, classes)
    const missingCount = process.campStatus.filter((item) => item.status === "missing").length
    const highRiskCount = process.anomalies.filter((item) => item.alert.key === "red").length
    state.ui.campBroadcasts = Object.fromEntries(activeCamps.map((camp) => [String(camp.campId), buildCampBroadcast(camp, process)]))

    dom.overviewPulse.innerHTML = `
      <div>
        <div class="section-kicker">今日运营焦点</div>
        <h3>${process.anomalies.length ? `发现 ${process.anomalies.length} 项昨日分层异常` : "昨日过程暂未发现明显异常"}</h3>
        <p>${activeCamps.length} 个进行中营期，${justClosedCamps.length ? `${justClosedCamps.length} 个结营次日营期，` : ""}${closedCamps.length} 个最近结营营期${missingCount ? `；${missingCount} 个营期昨日数据尚未更新` : ""}。</p>
      </div>
      <div class="overview-pulse-stats">
        <span><strong>${activeCamps.length}</strong>进行中</span>
        <span class="${highRiskCount ? "bad" : ""}"><strong>${highRiskCount}</strong>高风险</span>
        <span class="${missingCount ? "warn" : ""}"><strong>${missingCount}</strong>待更新</span>
      </div>`

    const monitoredCampIds = new Set(monitoredCamps.map((item) => item.campId))
    if (state.ui.overviewFocusedCampId && !monitoredCampIds.has(state.ui.overviewFocusedCampId)) {
      state.ui.overviewFocusedCampId = null
    }

    dom.activeCampCards.innerHTML = activeCamps.length ? activeCamps.map((camp) => {
      const status = process.campStatus.find((item) => item.campId === camp.campId)
      const anomalyCount = process.anomalies.filter((item) => item.campId === camp.campId).length
      const statusText = status?.status === "waiting" ? "Day1运营中，明早开始检查" : status?.status === "missing" ? `Day${status.checkDay}数据尚未更新` : `已检查Day${status?.checkDay || "-"}完整数据`
      const isFocused = state.ui.overviewFocusedCampId === camp.campId
      return `<div class="active-camp-card ${isFocused ? "is-focused" : ""}">
        <div class="active-camp-head"><div class="active-camp-title"><span class="tag neutral">项目｜${camp.projectName || "默认项目"}</span><strong>${camp.campId}营期</strong><span>当前 Day${camp.day || "-"}</span></div><span class="tag ${anomalyCount ? "warn" : "good"}">${anomalyCount ? `${anomalyCount}项异常` : statusText}</span></div>
        <div class="active-camp-check">${statusText}</div>
        <div class="active-camp-metrics">
          <span><small>待支付率</small><strong>${formatPct(overviewFocusMetric(camp, "pendingRate"))}</strong></span>
          <span><small>待支付转率</small><strong>${formatPct(overviewFocusMetric(camp, "pendingConv"))}</strong></span>
          <span><small>高沉浸率</small><strong>${formatPct(overviewFocusMetric(camp, "highImmerseRate"))}</strong></span>
          <span><small>高沉浸转率</small><strong>${formatPct(overviewFocusMetric(camp, "highImmerseConvRate"))}</strong></span>
        </div>
        <div class="active-camp-actions">
          <button class="drill-action" data-action="${anomalyCount ? "focus-overview-camp-anomalies" : "jump-camp-filtered"}" data-camp-id="${camp.campId}" type="button">${anomalyCount ? "查看分层异常" : "查看营期"} →</button>
          <button class="drill-action copy-broadcast-btn" data-action="copy-camp-broadcast" data-camp-id="${camp.campId}" type="button">复制播报</button>
        </div>
      </div>`
    }).join("") : `<div class="stack-item">当前筛选范围内没有进行中的营期。</div>`

    const focusedCampId = state.ui.overviewFocusedCampId
    const focusedCamp = focusedCampId ? monitoredCamps.find((item) => item.campId === focusedCampId) : null
    const visibleAnomalies = focusedCamp ? process.anomalies.filter((item) => item.campId === focusedCampId) : process.anomalies
    if (dom.yesterdayAnomalyFocus) {
      if (focusedCamp) {
        dom.yesterdayAnomalyFocus.classList.remove("hidden")
        dom.yesterdayAnomalyFocus.innerHTML = `
          <span><strong>当前仅展示：</strong>项目｜${focusedCamp.projectName || "默认项目"} · 营期｜${focusedCamp.campId}</span>
          <button class="table-link-btn" data-action="clear-overview-anomaly-focus" type="button">查看全部营期异常</button>
        `
      } else {
        dom.yesterdayAnomalyFocus.classList.add("hidden")
        dom.yesterdayAnomalyFocus.innerHTML = ""
      }
    }

    const anomalyRows = visibleAnomalies.map((item) => [
      `<span class="tag ${item.alert.className}">${item.alert.label}</span>`,
      item.projectName,
      item.campId,
      item.currentStage,
      `Day${item.checkDay}`,
      item.dimension,
      item.objectName,
      item.metric,
      item.formatter(item.value),
      `${item.formatter(item.benchmark)}<small>${item.baselineLabel}</small>`,
      item.kind === "class"
        ? `<button class="table-link-btn" data-action="jump-class-byday" data-class-name="${item.className}" data-camp-id="${item.campId}" type="button">查看班长</button>`
        : `<button class="table-link-btn" data-action="jump-analysis" data-target-tab="${item.kind === "project" ? "camp" : item.kind === "group" ? "group" : "small-group"}" type="button">查看${item.dimension}</button>`
    ])
    if (anomalyRows.length) {
      renderTable(dom.yesterdayAnomalyTable, ["预警", "项目", "营期", "当前阶段", "检查日", "维度", "对象", "异常指标", "当前值", "基准", "操作"], anomalyRows)
    } else {
      const allWaiting = monitoredCamps.length && process.campStatus.every((item) => item.status === "waiting")
      const message = focusedCamp
        ? `项目｜${focusedCamp.projectName || "默认项目"} · 营期｜${focusedCamp.campId} 当前未发现达到预警线的分层异常。`
        : missingCount
        ? "昨日过程数据尚未更新，当前无法完成异常检查。"
        : allWaiting
          ? "当前营期处于Day1，明早开始检查Day1完整数据。"
          : monitoredCamps.length
            ? "昨日过程数据已完成检查，暂未发现达到预警线的异常。"
            : "当前筛选范围内没有进行中的营期。"
      dom.yesterdayAnomalyTable.innerHTML = `<div class="stack-item">${message}</div>`
    }

    const recentRows = closedCamps.map((camp) => ({
      camp,
      roi: camp.metrics.roi,
      outputPerLeader: ratio(camp.metrics.revenue, camp.metrics.leaderCount),
      pendingRate: overviewFocusMetric(camp, "pendingRate"),
      pendingConv: overviewFocusMetric(camp, "pendingConv"),
      highImmerseRate: overviewFocusMetric(camp, "highImmerseRate"),
      highImmerseConvRate: overviewFocusMetric(camp, "highImmerseConvRate")
    }))
    const latest = recentRows[0]
    const latestIssues = latest ? [latest.roi < ROI_TARGET ? "ROI低于0.8" : "", latest.outputPerLeader < OUTPUT_PER_LEADER_TARGET ? "人均产能低于1.5万元" : ""].filter(Boolean) : []
    dom.recentClosedSummary.innerHTML = latest
      ? `<strong>最新结营：${latest.camp.campId}营期</strong><span>${latestIssues.length ? latestIssues.join("，") : "ROI与人均产能均达到目标"}。</span>`
      : `<span>当前筛选范围内暂无已结营数据。</span>`
    renderTable(dom.recentClosedTable, ["营期", "结营时间", "ROI / 目标0.8", "人均产能 / 目标1.5万", "待支付率", "待支付转率", "高沉浸率", "高沉浸转率", "操作"], recentRows.map((item, index) => {
      const previous = recentRows[index + 1]
      return [
        item.camp.campId,
        formatDate(item.camp.endDate),
        `<span class="target-value ${item.roi >= ROI_TARGET ? "good" : "bad"}">${formatNum(item.roi, 2)}</span>`,
        `<span class="target-value ${item.outputPerLeader >= OUTPUT_PER_LEADER_TARGET ? "good" : "bad"}">${formatMoney(item.outputPerLeader)}</span>`,
        comparisonInline(item.pendingRate, previous?.pendingRate),
        comparisonInline(item.pendingConv, previous?.pendingConv),
        comparisonInline(item.highImmerseRate, previous?.highImmerseRate),
        comparisonInline(item.highImmerseConvRate, previous?.highImmerseConvRate),
        `<button class="table-link-btn" data-action="jump-camp-filtered" data-camp-id="${item.camp.campId}" type="button">查看营期</button>`
      ]
    }))
  }

  function anomalyCard(item) {
    return `
      <div class="stack-item">
        <div class="stack-title">
          <span>${item.type === "camp" ? `营期 ${item.campId}` : `${item.groupName}｜营期 ${item.campId}`}</span>
          <span class="tag ${severityClass(item.severity)}">${severityLabel(item.severity)}</span>
        </div>
        <div class="stack-meta">异常指标：${item.metric}｜当前值：${displayMetricValue(item.metric, item.value)}</div>
        <div class="stack-meta">触发原因：${item.reason}</div>
        <div class="stack-meta">建议下钻：${item.drillPath}</div>
        <button class="drill-action" data-action="jump-analysis" data-target-tab="${item.type === "group" ? "group" : "camp"}" type="button">下钻查看 →</button>
      </div>
    `
  }

  function displayMetricValue(metric, value) {
    if (!Number.isFinite(value)) return "-"
    if (/回复时长/.test(metric)) return formatNum(value, 0)
    if (/ROI/.test(metric)) return formatNum(value, 2)
    if (/率|Day3|D6-D7/.test(metric)) return formatPct(value)
    return formatMoney(value)
  }

  function warmDimensionLabel(item, dimension) {
    if (dimension === "group") return item.groupName || "未知大组"
    if (dimension === "smallGroup") return item.smallGroupName || "未知小组"
    return item.className || "未知班长"
  }

  function warmTimeLabel(raw, timeDimension) {
    if (timeDimension === "month") {
      const value = String(raw?.month || "").trim()
      if (!value) return "未知月份"
      return /月$/.test(value) ? value : `${value}月`
    }
    const campId = String(raw?.campId || "").trim()
    return campId ? `营期${campId}` : "未知营期"
  }

  function warmTimeSortValue(raw, timeDimension) {
    if (timeDimension === "month") {
      const num = Number(String(raw?.month || "").replace(/[^\d.-]/g, ""))
      return Number.isFinite(num) ? num : Infinity
    }
    const campId = String(raw?.campId || "").trim()
    if (!campId) return "zzz"
    return campId
  }

  function buildWarmAnalysisRows(scopedRows, dimension = "group", timeDimension = "camp") {
    const meta = currentMeta()
    const timeKeyFn = timeDimension === "month"
      ? (row) => String(row[meta.monthField] || "未知月份").trim() || "未知月份"
      : (row) => String(row[meta.campField] || "未知营期").trim() || "未知营期"
    const keyFn = dimension === "group"
      ? (row) => String(row[meta.groupField] || "未知大组").trim() || "未知大组"
      : dimension === "smallGroup"
        ? (row) => `${String(row[meta.groupField] || "未知大组").trim() || "未知大组"}__${String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组"}`
        : (row) => `${String(row[meta.groupField] || "未知大组").trim() || "未知大组"}__${String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组"}__${String(row[meta.classField] || "未知班长").trim() || "未知班长"}`
    return Array.from(groupBy(scopedRows, (row) => `${timeKeyFn(row)}__${keyFn(row)}`).entries()).map(([, bucket]) => {
      const base = bucket[0] || {}
      const groupName = String(base[meta.groupField] || "未知大组").trim() || "未知大组"
      const smallGroupName = String(base[meta.smallGroupField] || "未知小组").trim() || "未知小组"
      const className = String(base[meta.classField] || "未知班长").trim() || "未知班长"
      const timeBucket = timeKeyFn(base)
      const timeLabel = warmTimeLabel({
        month: base[meta.monthField],
        campId: base[meta.campField]
      }, timeDimension)
      const item = buildDrillSnapshot(bucket, { groupName, smallGroupName, className }, { type: "group", campId: "汇总" })
      return {
        label: `${timeLabel}｜${warmDimensionLabel({ groupName, smallGroupName, className }, dimension)}`,
        timeBucket,
        timeLabel,
        timeSortValue: warmTimeSortValue({
          month: base[meta.monthField],
          campId: base[meta.campField]
        }, timeDimension),
        groupName,
        smallGroupName,
        className,
        roi: item.metrics.roi,
        warmGroupIn: normalizeRateLikeValue(firstMetric(item.raw, item.supplement, ["保温进群"])),
        warmAttend: normalizeRateLikeValue(firstMetric(item.raw, item.supplement, ["保温到播"])),
        warmBlacklist: normalizeRateLikeValue(firstMetric(item.raw, item.supplement, ["保温拉黑"])),
        day0Speak: normalizeRateLikeValue(firstMetric(item.raw, item.supplement, ["day0发言"])),
        highImmerseRate: normalizeRateLikeValue(firstMetric(item.raw, item.supplement, ["高沉浸率"])),
        highImmerseConvRate: normalizeRateLikeValue(firstMetric(item.raw, item.supplement, ["高沉浸转率"]))
      }
    }).sort((a, b) => {
      if (timeDimension === "month") {
        if (a.timeSortValue !== b.timeSortValue) return (a.timeSortValue || Infinity) - (b.timeSortValue || Infinity)
      } else if (String(a.timeSortValue || "") !== String(b.timeSortValue || "")) {
        return String(a.timeSortValue || "").localeCompare(String(b.timeSortValue || ""), "zh-CN", { numeric: true })
      }
      return (b.roi || -Infinity) - (a.roi || -Infinity) || a.label.localeCompare(b.label, "zh-CN")
    })
  }

  function insightEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]))
  }

  function insightPeriodBuckets(rows, dimension) {
    const meta = currentMeta()
    return Array.from(groupBy(rows, (row) => campViewBucketFromRow(row, meta, dimension).key).entries())
      .map(([key, bucket]) => ({ key, rows: bucket, info: campViewBucketFromRow(bucket[0], meta, dimension) }))
      .sort((a, b) => compareOverviewBucket(a.info, b.info))
  }

  function insightMetricData(rows, dimension, label) {
    const info = buildCampNodeMetricData(rows, dimension, "dimension", label, {})
    return {
      roi: info.snapshot.metrics.roi,
      addCost: info.snapshot.metrics.addCost,
      addRevenue: info.snapshot.metrics.addRevenue,
      output: info.avgOutputPerLeader,
      convRate: info.snapshot.metrics.convRate,
      pendingRate: info.snapshot.metrics.pendingRate,
      pendingConv: info.snapshot.metrics.pendingConv,
      individualShare: info.snapshot.metrics.individualShare,
      aov: info.snapshot.metrics.aov,
      personEfficiency: info.snapshot.metrics.personEfficiency,
      highImmerseRate: info.highImmerseRate,
      highImmerseConv: info.highImmerseConvRate,
      cost: info.snapshot.metrics.cost,
      revenue: info.snapshot.metrics.revenue,
      adds: info.snapshot.metrics.adds
    }
  }

  function insightDelta(current, previous) {
    return Number.isFinite(current) && Number.isFinite(previous) ? current - previous : null
  }

  function insightMetricStatus(delta, format = "rate") {
    if (!Number.isFinite(delta)) return "数据不足"
    const threshold = format === "roi" ? 0.01 : format === "money" ? 0.05 : 0.005
    if (Math.abs(delta) < threshold) return "基本持平"
    return delta > 0 ? "改善" : "下降"
  }

  function insightCompareRows(current, previous) {
    return [
      { key: "roi", label: "ROI", formatter: (v) => formatNum(v, 2), deltaFormatter: (v) => `${v >= 0 ? "+" : ""}${formatNum(v, 2)}`, format: "roi", better: "high" },
      { key: "addCost", label: "添加成本", formatter: formatMoney, deltaFormatter: (v, p) => Number.isFinite(p) && p ? `${v >= 0 ? "+" : ""}${formatPct(v / p)}` : "-", format: "money", better: "low" },
      { key: "addRevenue", label: "添加产值", formatter: formatMoney, deltaFormatter: (v, p) => Number.isFinite(p) && p ? `${v >= 0 ? "+" : ""}${formatPct(v / p)}` : "-", format: "money", better: "high" },
      { key: "output", label: "人均产能", formatter: formatMoney, deltaFormatter: (v, p) => Number.isFinite(p) && p ? `${v >= 0 ? "+" : ""}${formatPct(v / p)}` : "-", format: "money", better: "high" },
      { key: "convRate", label: "转率", formatter: formatPct, deltaFormatter: (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}pp`, better: "high" },
      { key: "pendingRate", label: "待支付率", formatter: formatPct, deltaFormatter: (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}pp`, better: "high" },
      { key: "pendingConv", label: "待支付转率", formatter: formatPct, deltaFormatter: (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}pp`, better: "high" },
      { key: "highImmerseRate", label: "高沉浸率", formatter: formatPct, deltaFormatter: (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}pp`, better: "high" },
      { key: "highImmerseConv", label: "高沉浸转率", formatter: formatPct, deltaFormatter: (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}pp`, better: "high" }
    ].map((spec) => {
      const delta = insightDelta(current[spec.key], previous[spec.key])
      const directionDelta = spec.better === "low" && Number.isFinite(delta) ? -delta : delta
      return { ...spec, current: current[spec.key], previous: previous[spec.key], delta, status: insightMetricStatus(directionDelta, spec.format) }
    })
  }

  function insightEntityImpacts(currentRows, previousRows, field, fallback) {
    const currentTotalRevenue = sum(currentRows.map(rowRevenue))
    const currentTotalCost = sum(currentRows.map(rowCost))
    const overallRoi = ratio(currentTotalRevenue, currentTotalCost)
    const previousMap = new Map(Array.from(groupBy(previousRows, (row) => String(row[field] || fallback).trim() || fallback).entries()).map(([name, rows]) => [name, ratio(sum(rows.map(rowRevenue)), sum(rows.map(rowCost)))]))
    return Array.from(groupBy(currentRows, (row) => String(row[field] || fallback).trim() || fallback).entries()).map(([name, rows]) => {
      const revenue = sum(rows.map(rowRevenue))
      const cost = sum(rows.map(rowCost))
      const adds = sum(rows.map(rowAdds))
      const roi = ratio(revenue, cost)
      const withoutRoi = ratio(currentTotalRevenue - revenue, currentTotalCost - cost)
      return {
        name, roi, adds, cost,
        previousRoi: previousMap.get(name),
        roiDelta: insightDelta(roi, previousMap.get(name)),
        liftWithout: insightDelta(withoutRoi, overallRoi),
        costShare: ratio(cost, currentTotalCost)
      }
    }).filter((item) => Number.isFinite(item.roi))
  }

  function buildCampInsight(rows, dimension) {
    const buckets = insightPeriodBuckets(rows, dimension)
    if (buckets.length < 2) return { html: `<div class="insight-empty">当前筛选范围至少需要两个可比周期，才能生成周期洞察。</div>`, text: "当前筛选范围至少需要两个可比周期，才能生成周期洞察。", title: "周期经营洞察" }
    const currentBucket = buckets[buckets.length - 1]
    const baselineBuckets = dimension === "camp" ? buckets.slice(Math.max(0, buckets.length - 6), -1) : [buckets[buckets.length - 2]]
    const previousRows = baselineBuckets.flatMap((item) => item.rows)
    const current = insightMetricData(currentBucket.rows, dimension, currentBucket.info.label)
    const previous = insightMetricData(previousRows, dimension, baselineBuckets.map((item) => item.info.label).join("、"))
    const comparisons = insightCompareRows(current, previous)
    const baselineLabel = dimension === "camp" ? `历史${baselineBuckets.length}期基准` : baselineBuckets[0].info.label
    const roiDelta = insightDelta(current.roi, previous.roi)
    const roiTrend = !Number.isFinite(roiDelta) ? "暂无完整对比" : Math.abs(roiDelta) < 0.01 ? "基本持平" : roiDelta > 0 ? "有所改善" : "明显下降"
    const goalText = Number.isFinite(current.roi) ? (current.roi >= ROI_TARGET ? "已达到0.8目标" : "未达到0.8目标") : "ROI数据不足"
    const outputText = Number.isFinite(current.output) ? (current.output >= 60000 ? "人均产能已达到6万元目标" : "人均产能低于6万元目标") : "人均产能数据不足"
    const factorRows = comparisons.filter((item) => ["addCost", "addRevenue", "convRate", "pendingRate", "pendingConv", "highImmerseRate", "highImmerseConv"].includes(item.key) && Number.isFinite(item.delta))
      .map((item) => ({ ...item, score: Math.abs(item.delta / Math.max(Math.abs(item.previous), item.format === "roi" ? 0.01 : 0.005)), adverse: item.better === "low" ? item.delta > 0 : item.delta < 0 }))
      .filter((item) => item.adverse).sort((a, b) => b.score - a.score).slice(0, 3)
    const factorText = factorRows.length ? factorRows.map((item) => `${item.label}${item.deltaFormatter(item.delta, item.previous)}`).join("、") : "关键指标未出现明显负向变化"
    const meta = currentMeta()
    const smallGroups = insightEntityImpacts(currentBucket.rows, previousRows, meta.smallGroupField, "未知小组")
      .filter((item) => (item.costShare || 0) >= 0.03).sort((a, b) => (b.liftWithout || -Infinity) - (a.liftWithout || -Infinity))
    const leaders = insightEntityImpacts(currentBucket.rows, previousRows, meta.leaderField || meta.classField, "未知班长")
      .filter((item) => item.adds >= 10 && (item.costShare || 0) >= 0.005).sort((a, b) => (b.liftWithout || -Infinity) - (a.liftWithout || -Infinity))
    const dragGroups = smallGroups.filter((item) => (item.liftWithout || 0) > 0.005).slice(0, 3)
    const weakLeaders = leaders.filter((item) => (item.liftWithout || 0) > 0.002).slice(0, 3)
    const bestGroup = smallGroups.filter((item) => Number.isFinite(item.roiDelta)).sort((a, b) => b.roiDelta - a.roiDelta)[0]
    const orgLine = dragGroups[0]
      ? `${dragGroups[0].name}是当前最主要的组织拖累，剔除模拟后整体ROI约提升${formatNum(dragGroups[0].liftWithout, 2)}。`
      : "未发现对整体ROI形成明显拖累的高体量小组。"
    const actionLines = []
    if (factorRows[0]) actionLines.push(`优先复盘${factorRows[0].label}的环比变化及对应运营动作。`)
    if (dragGroups[0]) actionLines.push(`下钻${dragGroups[0].name}，核查其成本、转率和支付收回环节。`)
    if (weakLeaders[0]) actionLines.push(`重点跟进${weakLeaders.slice(0, 2).map((item) => item.name).join("、")}等高体量低表现班长。`)
    if (actionLines.length < 3 && bestGroup) actionLines.push(`复盘${bestGroup.name}的改善动作，判断是否可向其他小组复制。`)
    while (actionLines.length < 3) actionLines.push("继续观察下一周期关键指标，确认变化是否持续。")
    const title = `${currentBucket.info.label}经营洞察`
    const groupItems = dragGroups.length ? dragGroups.map((item) => `<li><strong>${insightEscape(item.name)}</strong><span>ROI ${formatNum(item.roi, 2)}，较基准${Number.isFinite(item.roiDelta) ? `${item.roiDelta >= 0 ? "+" : ""}${formatNum(item.roiDelta, 2)}` : "无可比数据"}；剔除模拟影响 ${formatNum(item.liftWithout, 2)}</span></li>`).join("") : `<li><strong>暂无明显拖累小组</strong><span>高体量小组整体处于正常波动范围。</span></li>`
    const leaderItems = weakLeaders.length ? weakLeaders.map((item) => `<li><strong>${insightEscape(item.name)}</strong><span>ROI ${formatNum(item.roi, 2)}，添加人数 ${formatNum(item.adds, 0)}；剔除模拟影响 ${formatNum(item.liftWithout, 2)}</span></li>`).join("") : `<li><strong>暂无高体量极低班长</strong><span>已排除添加人数不足10人的小样本。</span></li>`
    const tableRows = comparisons.map((item) => `<tr><td>${item.label}</td><td>${item.formatter(item.current)}</td><td>${item.formatter(item.previous)}</td><td class="${item.status === "下降" ? "td-bad" : item.status === "改善" ? "td-good" : ""}">${Number.isFinite(item.delta) ? item.deltaFormatter(item.delta, item.previous) : "-"}</td><td>${item.status}</td></tr>`).join("")
    const summary = `${currentBucket.info.label} ROI为${formatNum(current.roi, 2)}，较${baselineLabel}${Number.isFinite(roiDelta) ? `${roiDelta >= 0 ? "提升" : "下降"}${formatNum(Math.abs(roiDelta), 2)}` : "暂无可比结果"}，${roiTrend}且${goalText}；${outputText}。`
    const html = `
      <section class="insight-hero"><span class="metric-pill ${current.roi >= ROI_TARGET ? "td-good" : "td-bad"}">${goalText}</span><h3>${insightEscape(summary)}</h3><p>对比口径：${insightEscape(currentBucket.info.label)} vs ${insightEscape(baselineLabel)}。${dimension === "camp" ? "营期使用历史最多5期基准。" : "周/月使用筛选后最后两个周期环比。"}</p></section>
      <section class="insight-section"><h4>ROI影响判断</h4><p>${insightEscape(`主要负向变化：${factorText}。${orgLine}`)}</p><div class="insight-factor-list">${factorRows.length ? factorRows.map((item, index) => `<span><b>${index + 1}</b>${item.label} ${item.deltaFormatter(item.delta, item.previous)}</span>`).join("") : `<span><b>✓</b>暂无明显负向因素</span>`}</div></section>
      <section class="insight-section"><h4>关键指标对比</h4><div class="table-wrap"><table><thead><tr><th>指标</th><th>本周期</th><th>对比周期</th><th>变化</th><th>判断</th></tr></thead><tbody>${tableRows}</tbody></table></div></section>
      <div class="insight-two-col"><section class="insight-section"><h4>重点小组</h4><ol class="insight-rank-list">${groupItems}</ol></section><section class="insight-section"><h4>重点班长</h4><ol class="insight-rank-list">${leaderItems}</ol></section></div>
      <section class="insight-section"><h4>建议动作</h4><ol class="insight-action-list">${actionLines.slice(0, 3).map((item) => `<li>${insightEscape(item)}</li>`).join("")}</ol><p class="insight-note">组织影响采用剔除模拟，用于定位可能拖累项，不代表严格因果关系。</p></section>`
    const text = `【${title}】\n\n总体判断：\n${summary}\n\nROI影响判断：\n主要负向变化：${factorText}。${orgLine}\n\n关键指标对比：\n${comparisons.map((item) => `- ${item.label}：${item.formatter(item.current)}｜对比${item.formatter(item.previous)}｜${Number.isFinite(item.delta) ? item.deltaFormatter(item.delta, item.previous) : "-"}｜${item.status}`).join("\n")}\n\n重点小组：\n${dragGroups.length ? dragGroups.map((item, i) => `${i + 1}. ${item.name}：ROI ${formatNum(item.roi, 2)}，剔除模拟后整体ROI约提升${formatNum(item.liftWithout, 2)}`).join("\n") : "暂无明显拖累小组"}\n\n重点班长：\n${weakLeaders.length ? weakLeaders.map((item, i) => `${i + 1}. ${item.name}：ROI ${formatNum(item.roi, 2)}，添加人数${formatNum(item.adds, 0)}`).join("\n") : "暂无高体量极低班长"}\n\n建议动作：\n${actionLines.slice(0, 3).map((item, i) => `${i + 1}. ${item}`).join("\n")}`
    return { html, text, title }
  }

  function openCampInsight() {
    if (!dom.campInsightModal || !dom.campInsightBody) return
    const result = buildCampInsight(getScopedUnifiedRows(null), state.ui.campViewDimension || "camp")
    state.ui.campInsightText = result.text
    dom.campInsightTitle.textContent = result.title
    dom.campInsightBody.innerHTML = result.html
    dom.campInsightModal.classList.remove("hidden")
  }

  function closeCampInsight() {
    dom.campInsightModal?.classList.add("hidden")
  }

  async function copyCampInsight() {
    const text = state.ui.campInsightText || ""
    if (!text) return
    let copied = false
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      copied = document.execCommand("copy")
      textarea.remove()
    }
    if (!dom.campInsightCopyBtn) return
    dom.campInsightCopyBtn.textContent = copied ? "已复制洞察" : "复制失败"
    setTimeout(() => { dom.campInsightCopyBtn.textContent = "一键复制" }, 1800)
  }

  async function copyBanInsight() {
    const text = state.ui.banInsightCopyText || ""
    if (!text) return
    let copied = false
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      copied = document.execCommand("copy")
      textarea.remove()
    }
    if (!dom.banInsightCopyBtn) return
    dom.banInsightCopyBtn.textContent = copied ? "已复制封号洞察" : "复制失败"
    setTimeout(() => { dom.banInsightCopyBtn.textContent = "复制封号洞察" }, 1800)
  }

  function renderCampSection(camps, scopedRows) {
    const dimension = state.ui.campViewDimension || "camp"
    renderQuickSwitch(dom.campViewDimensionSwitch, [
      { label: "月", value: "month" },
      { label: "周", value: "week" },
      { label: "营期", value: "camp" }
    ], dimension, { action: "camp-view-dimension" })
    const dimensionItems = buildCampRhythmItems(camps, dimension)
    renderCampOverviewTreeTable(dom.campOverviewTable, buildCampOverviewFlatRows(scopedRows, dimension, state.ui.campOverviewExpanded), dimension, false)
    renderCampOverviewTreeTable(dom.campWarmOverviewTable, buildCampOverviewFlatRows(scopedRows, dimension, state.ui.campWarmOverviewExpanded), dimension, true)
    const campTrendTraces = withValueLabels([
      { type: "bar", name: "添加成本", x: dimensionItems.map((item) => item.dimensionLabel), y: dimensionItems.map((item) => item.metrics.addCost), marker: { color: PLOT_COST } },
      { type: "bar", name: "添加产值", x: dimensionItems.map((item) => item.dimensionLabel), y: dimensionItems.map((item) => item.metrics.addRevenue), marker: { color: PLOT_REVENUE } },
      { type: "scatter", mode: "lines+markers", name: "ROI", x: dimensionItems.map((item) => item.dimensionLabel), y: dimensionItems.map((item) => item.metrics.roi), yaxis: "y2", line: { color: PLOT_ROI, width: 2 } }
    ])
    const roiTrace = campTrendTraces.find((trace) => trace.name === "ROI")
    if (roiTrace) {
      roiTrace.text = roiTrace.y.map((value) => formatNum(value, 2))
      roiTrace.textposition = "top center"
    }
    Plotly.newPlot("campTrendCombo", campTrendTraces, baseLayout({
      barmode: "group",
      xaxis: fullCategoryAxis(dimensionItems.map((item) => item.dimensionLabel)),
      yaxis: { title: "添加成本 / 添加产值", color: PLOT_MUTED, gridcolor: PLOT_GRID },
      yaxis2: { title: "ROI", overlaying: "y", side: "right", color: PLOT_MUTED },
      shapes: [{ type: "line", xref: "paper", x0: 0, x1: 1, yref: "y2", y0: ROI_TARGET, y1: ROI_TARGET, line: { color: "rgba(15,23,42,0.25)", dash: "dot" } }]
    }), plotConfig)
    renderDimensionRhythmCharts("camp", dimensionItems)

    const axisLabels = dimensionItems.map((item) => item.dimensionLabel)
    const day3Pending = dimensionItems.map((item) => firstMetric(item.raw, item.supplement, ["day3待支付率", "待支付率"]))
    const day3Conv = dimensionItems.map((item) => firstMetric(item.raw, item.supplement, ["day3转率"]))
    const day3OrderShare = dimensionItems.map((item) => orderShare(item, 3))
    const d67Conv = dimensionItems.map((item) => sum([6, 7].map((day) => firstMetric(item.raw, item.supplement, [`day${day}转率`]))))
    const d67OrderShare = dimensionItems.map((item) => sum([6, 7].map((day) => orderShare(item, day))))

    Plotly.newPlot("trendDay3Pending", withValueLabels([{
      type: "scatter",
      mode: "lines+markers",
      name: "Day3 待支付率",
      x: axisLabels,
      y: day3Pending,
      line: { color: "#2563eb", width: 2 }
    }], formatChartPercent), baseLayout({
      margin: { l: 50, r: 14, t: 24, b: 56 },
      showlegend: false,
      xaxis: fullCategoryAxis(axisLabels),
      yaxis: { title: "待支付率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID }
    }), plotConfig)

    Plotly.newPlot("trendDay3ConvChase", withValueLabels([
      {
        type: "bar",
        name: "Day3 出单占比",
        x: axisLabels,
        y: day3OrderShare,
        yaxis: "y2",
        marker: { color: "rgba(245,158,11,0.55)" }
      },
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Day3 转率",
        x: axisLabels,
        y: day3Conv,
        line: { color: "#059669", width: 2 }
      }
    ], formatChartPercent), baseLayout({
      margin: { l: 50, r: 42, t: 24, b: 56 },
      barmode: "group",
      xaxis: fullCategoryAxis(axisLabels),
      yaxis: { title: "Day3 转率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID },
      yaxis2: { title: "出单占比", tickformat: ".1%", overlaying: "y", side: "right", color: PLOT_MUTED }
    }), plotConfig)

    Plotly.newPlot("trendD6D7ConvChase", withValueLabels([
      {
        type: "bar",
        name: "D6-D7 出单占比合计",
        x: axisLabels,
        y: d67OrderShare,
        yaxis: "y2",
        marker: { color: "rgba(249,115,22,0.50)" }
      },
      {
        type: "scatter",
        mode: "lines+markers",
        name: "D6-D7 转率合计",
        x: axisLabels,
        y: d67Conv,
        line: { color: "#dc2626", width: 2 }
      }
    ], formatChartPercent), baseLayout({
      margin: { l: 50, r: 42, t: 24, b: 56 },
      barmode: "group",
      xaxis: fullCategoryAxis(axisLabels),
      yaxis: { title: "D6-D7 转率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID },
      yaxis2: { title: "出单占比", tickformat: ".1%", overlaying: "y", side: "right", color: PLOT_MUTED }
    }), plotConfig)

    renderByDayCharts(dom.campProcessCharts, dimensionItems, PROCESS_SPECS, false)
    renderByDayCharts(dom.campConversionCharts, dimensionItems, CONVERSION_SPECS, false)
    renderDecayCharts(dom.campDecayCharts, dimensionItems, DECAY_SPECS, false)
  }

  function banUniqueRows(rows) {
    const meta = currentMeta()
    const seen = new Set()
    return rows.filter((row, index) => {
      const classKey = row._封号匹配班级 || row._原始班级 || row._标准班级 || row[meta.classNameField] || row[meta.classField] || index
      const key = `${row[meta.projectField] || ""}__${row[meta.campField] || ""}__${classKey}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  function banAggregate(rows) {
    const raw = aggregateUnifiedRows(rows)
    return {
      raw,
      count: banUniqueRows(rows).length,
      adds: sum(rows.map(rowAdds)),
      conv: sum(rows.map(rowConv)),
      cost: sum(rows.map(rowCost)),
      revenue: sum(rows.map(rowRevenue)),
      roi: ratio(sum(rows.map(rowRevenue)), sum(rows.map(rowCost))),
      convRate: ratio(sum(rows.map(rowConv)), sum(rows.map(rowAdds)))
    }
  }

  function banDayNumber(day) {
    if (day === "day负2") return -2
    if (day === "day负1") return -1
    const match = String(day || "").match(/day(\d+)/)
    return match ? Number(match[1]) : null
  }

  function banMetricValue(aggregate, field) {
    return normalizeRateLikeValue(firstMetric(aggregate.raw, null, [field]))
  }

  function banComparisonSeries(cohortAgg, controlAgg, fields) {
    return fields.map((field) => ({ cohort: banMetricValue(cohortAgg, field), control: banMetricValue(controlAgg, field) }))
  }

  function banStatusLabel(row) {
    if (row._封号情况 === "封号") return "限制"
    if (row._封号情况 === "未封号") return "未限制"
    return "未知"
  }

  function banStatusPill(row) {
    const label = banStatusLabel(row)
    const cls = label === "限制" ? "danger" : label === "未限制" ? "success" : "neutral"
    return `<span class="ban-pill ${cls}">${label}</span>`
  }

  function banDayPill(day) {
    const text = day || "未知"
    const order = { day1: "early", day2: "early", day3: "mid", day4: "mid", day5: "mid", day6: "late", day7: "late", day0: "warn", day负1: "warn", day负2: "warn" }
    return `<span class="ban-pill ${order[text] || "neutral"}">${text}</span>`
  }

  function banLimitCountCell(value) {
    const number = parseNumber(value)
    if (!Number.isFinite(number)) return `<span class="ban-limit-count empty">-</span>`
    return `<span class="ban-limit-count ${number > 0 ? "active" : "zero"}">${formatNum(number, 0)}</span>`
  }

  function banClassDisplay(row, meta) {
    return row._原始班级 || row._标准班级 || row[meta.classNameField] || row[meta.classField] || "未知班级"
  }

  function banRateHeatCell(value) {
    const rate = normalizeRateLikeValue(value)
    if (!Number.isFinite(rate)) return `<span class="ban-rate-heat empty">-</span>`
    const clamped = Math.max(0, Math.min(1, rate / 0.2))
    const hue = 8 + clamped * 134
    const bg = `hsla(${hue}, 72%, 88%, 0.95)`
    const border = `hsla(${hue}, 64%, 48%, 0.26)`
    return `<span class="ban-rate-heat" style="background:${bg};border-color:${border};">${formatPct(rate)}</span>`
  }

  function renderBanImpactSection(scopedRows) {
    const limitMeta = state.model?.limitMeta
    const hasData = !!limitMeta?.supplied
    dom.banImpactEmpty?.classList.toggle("hidden", hasData)
    dom.banImpactContent?.classList.toggle("hidden", !hasData)
    if (!hasData) {
      dom.banImpactEmpty.innerHTML = `<div class="ban-empty-icon">限</div><h3>上传班级限制表后查看封号影响</h3><p>返回导入页补充限制表，即可分析封号时间分布、By-day转化影响、小组与班级明细。</p>`
      return
    }
    const matched = scopedRows.filter((row) => row._限制匹配)
    const limitedAll = matched.filter((row) => row._封号情况 === "封号")
    const controls = matched.filter((row) => row._封号情况 === "未封号")
    const dayOptions = ["全部", ...BAN_DAY_KEYS.filter((day) => limitedAll.some((row) => row._首次封号日 === day))]
    if (!dayOptions.includes(state.ui.banDay)) state.ui.banDay = "全部"
    renderQuickSwitch(dom.banDaySwitch, dayOptions.map((day) => ({ label: day === "全部" ? "全部封号" : day.replace("day", "Day"), value: day })), state.ui.banDay, { action: "ban-day" })
    const cohort = state.ui.banDay === "全部" ? limitedAll : limitedAll.filter((row) => row._首次封号日 === state.ui.banDay)
    const limitedAgg = banAggregate(cohort)
    const controlAgg = banAggregate(controls)
    const allAgg = banAggregate(matched)
    const roiGap = insightDelta(limitedAgg.roi, controlAgg.roi)
    const convGap = insightDelta(limitedAgg.convRate, controlAgg.convRate)
    const expectedConv = Number.isFinite(controlAgg.convRate) ? limitedAgg.adds * controlAgg.convRate : null
    const lostConv = Number.isFinite(expectedConv) ? Math.max(0, expectedConv - limitedAgg.conv) : null
    const controlAov = ratio(controlAgg.revenue, controlAgg.conv)
    const estimatedLoss = Number.isFinite(lostConv) && Number.isFinite(controlAov) ? lostConv * controlAov : null
    const coverage = limitMeta.coverageRate || 0
    dom.banCoverageHint.textContent = `限制表匹配 ${limitMeta.matchedRows}/${scopedRows.length} 条当前明细，覆盖率 ${formatPct(coverage)}；对照组为当前筛选范围内已匹配的未封号班级。`
    const metrics = [
      ["封号班级", limitedAgg.count, "个"],
      ["班级封号率", ratio(banUniqueRows(limitedAll).length, banUniqueRows(matched).length), "pct"],
      ["受影响添加", limitedAgg.adds, "人"],
      ["封号班级ROI", limitedAgg.roi, "roi"],
      ["对照班级ROI", controlAgg.roi, "roi"],
      ["ROI差值", roiGap, "signedRoi"],
      ["转率差值", convGap, "pp"],
      ["估算流水缺口", estimatedLoss, "money"]
    ]
    dom.banImpactMetrics.innerHTML = metrics.map(([label, value, type]) => `<div class="metric-card"><span>${label}</span><strong class="${Number.isFinite(value) && value < 0 ? "td-bad" : ""}">${type === "pct" ? formatPct(value) : type === "roi" ? formatNum(value, 2) : type === "signedRoi" ? `${value >= 0 ? "+" : ""}${formatNum(value, 2)}` : type === "pp" ? `${value >= 0 ? "+" : ""}${Number.isFinite(value) ? (value * 100).toFixed(1) : "-"}pp` : type === "money" ? formatMoney(value) : `${formatNum(value, 0)}${type}`}</strong></div>`).join("")

    const distribution = BAN_DAY_KEYS.map((day) => ({ day, count: banUniqueRows(limitedAll.filter((row) => row._首次封号日 === day)).length, limits: sum(limitedAll.map((row) => row[`_${day}限制数`])) }))
    Plotly.newPlot(dom.banDayDistribution, [{ type: "bar", name: "封号班级数", x: distribution.map((item) => item.day.replace("day", "Day")), y: distribution.map((item) => item.count), marker: { color: distribution.map((item) => state.ui.banDay === item.day ? "#dc2626" : "rgba(245,158,11,.65)") }, text: distribution.map((item) => item.count || ""), textposition: "outside" }], baseLayout({ margin: { l: 45, r: 20, t: 24, b: 55 }, showlegend: false, yaxis: { title: "班级数", rangemode: "tozero", gridcolor: PLOT_GRID }, xaxis: fullCategoryAxis(distribution.map((item) => item.day.replace("day", "Day"))) }), plotConfig)

    const conversionFields = [3, 4, 5, 6, 7].map((day) => `day${day}转率`)
    const conversion = banComparisonSeries(limitedAgg, controlAgg, conversionFields)
    const dayLabels = ["Day3", "Day4", "Day5", "Day6", "Day7"]
    const eventDay = state.ui.banDay === "全部" ? null : banDayNumber(state.ui.banDay)
    dom.banCompareHint.textContent = `${state.ui.banDay === "全部" ? "全部封号班级" : `${state.ui.banDay.replace("day", "Day")}封号班级`} vs 当前筛选范围未封号班级；虚线标记封号发生日。`
    const eventShape = Number.isFinite(eventDay) && eventDay >= 3 ? [{ type: "line", x0: `Day${eventDay}`, x1: `Day${eventDay}`, yref: "paper", y0: 0, y1: 1, line: { color: "#dc2626", dash: "dash", width: 2 } }] : []
    Plotly.newPlot(dom.banConversionTrend, withValueLabels([
      { type: "scatter", mode: "lines+markers", name: "封号班级", x: dayLabels, y: conversion.map((item) => item.cohort), line: { color: "#dc2626", width: 3 } },
      { type: "scatter", mode: "lines+markers", name: "未封号对照", x: dayLabels, y: conversion.map((item) => item.control), line: { color: "#2563eb", width: 2 } }
    ], formatChartPercent2), baseLayout({ xaxis: fullCategoryAxis(dayLabels), yaxis: { tickformat: ".2%", gridcolor: PLOT_GRID }, shapes: eventShape }), plotConfig)
    const gaps = conversion.map((item) => insightDelta(item.cohort, item.control))
    Plotly.newPlot(dom.banConversionGap, withValueLabels([{ type: "bar", name: "转率差值", x: dayLabels, y: gaps, marker: { color: gaps.map((value) => value < 0 ? "#ef4444" : "#22c55e") } }], (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}pp`), baseLayout({ showlegend: false, xaxis: fullCategoryAxis(dayLabels), yaxis: { tickformat: ".2%", zeroline: true, zerolinecolor: "#475569", gridcolor: PLOT_GRID }, shapes: eventShape }), plotConfig)

    const pendingFields = [3, 4, 5, 6, 7].map((day) => `day${day}待支付率`)
    const pending = banComparisonSeries(limitedAgg, controlAgg, pendingFields)
    Plotly.newPlot(dom.banPendingTrend, withValueLabels([
      { type: "scatter", mode: "lines+markers", name: "封号班级", x: dayLabels, y: pending.map((item) => item.cohort), line: { color: "#dc2626", width: 3 } },
      { type: "scatter", mode: "lines+markers", name: "未封号对照", x: dayLabels, y: pending.map((item) => item.control), line: { color: "#2563eb", width: 2 } }
    ], formatChartPercent), baseLayout({ xaxis: fullCategoryAxis(dayLabels), yaxis: { tickformat: ".1%", gridcolor: PLOT_GRID }, shapes: eventShape }), plotConfig)
    const pendingGaps = pending.map((item) => insightDelta(item.cohort, item.control))
    Plotly.newPlot(dom.banPendingGap, withValueLabels([{ type: "bar", name: "待支付率差值", x: dayLabels, y: pendingGaps, marker: { color: pendingGaps.map((value) => value > 0 ? "#ef4444" : "#22c55e") } }], (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}pp`), baseLayout({ showlegend: false, xaxis: fullCategoryAxis(dayLabels), yaxis: { tickformat: ".1%", zeroline: true, zerolinecolor: "#475569", gridcolor: PLOT_GRID }, shapes: eventShape }), plotConfig)

    const postStart = Number.isFinite(eventDay) ? Math.max(3, eventDay + 1) : 3
    const postIndexes = [3, 4, 5, 6, 7].map((day, index) => ({ day, index })).filter((item) => item.day >= postStart)
    const postGap = sum(postIndexes.map((item) => gaps[item.index]))
    dom.banPostImpact.innerHTML = `<div><span>封号后观察窗口</span><strong>${postStart > 7 ? "暂无后续Day" : `Day${postStart}-Day7`}</strong></div><div><span>后续转率差值合计</span><strong class="${postGap < 0 ? "td-bad" : "td-good"}">${Number.isFinite(postGap) ? `${postGap >= 0 ? "+" : ""}${(postGap * 100).toFixed(2)}pp` : "-"}</strong></div><div><span>估算少转化</span><strong>${Number.isFinite(lostConv) ? `${formatNum(lostConv, 1)}人` : "-"}</strong></div><div><span>估算流水缺口</span><strong>${formatMoney(estimatedLoss)}</strong></div>`

    const processSpecs = [
      { title: "到播率", suffix: "到播", start: 1, end: 5, lowerBad: true },
      { title: "留存率", suffix: "留存", start: 1, end: 5, lowerBad: true },
      { title: "班长回复率", suffix: "回复", start: 1, end: 7, lowerBad: true }
    ]
    dom.banProcessCharts.innerHTML = processSpecs.map((spec, index) => `<div class="chart-card"><div class="chart-card-title">${spec.title}</div><div id="banProcessChart${index}" class="chart"></div></div>`).join("")
    processSpecs.forEach((spec, index) => {
      const labels = Array.from({ length: spec.end - spec.start + 1 }, (_, i) => `Day${spec.start + i}`)
      const fields = labels.map((_, i) => `day${spec.start + i}${spec.suffix}`)
      const series = banComparisonSeries(limitedAgg, controlAgg, fields)
      Plotly.newPlot(`banProcessChart${index}`, [
        { type: "scatter", mode: "lines+markers", name: "封号班级", x: labels, y: series.map((item) => item.cohort), line: { color: "#dc2626", width: 2 } },
        { type: "scatter", mode: "lines+markers", name: "未封号对照", x: labels, y: series.map((item) => item.control), line: { color: "#2563eb", width: 2 } }
      ], baseLayout({ margin: { l: 48, r: 15, t: 20, b: 58 }, xaxis: fullCategoryAxis(labels), yaxis: { tickformat: ".1%", gridcolor: PLOT_GRID } }), plotConfig)
    })

    const meta = currentMeta()
    const groupRows = Array.from(groupBy(cohort, (row) => String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组").entries()).map(([name, rows]) => {
      const comparisonRows = controls.filter((row) => String(row[meta.smallGroupField] || "未知小组").trim() === name)
      const a = banAggregate(rows)
      const b = banAggregate(comparisonRows.length ? comparisonRows : controls)
      return { name, count: a.count, adds: a.adds, roi: a.roi, roiGap: insightDelta(a.roi, b.roi), convGap: insightDelta(a.convRate, b.convRate), estimatedLoss: Number.isFinite(b.convRate) ? Math.max(0, a.adds * b.convRate - a.conv) * (ratio(b.revenue, b.conv) || 0) : null }
    }).sort((a, b) => (b.estimatedLoss || 0) - (a.estimatedLoss || 0))
    renderTable(dom.banGroupTable, ["小组", "封号班级", "受影响添加", "封号ROI", "ROI差值", "转率差值", "估算流水缺口"], groupRows.map((item) => [item.name, item.count, formatNum(item.adds, 0), formatNum(item.roi, 2), Number.isFinite(item.roiGap) ? `${item.roiGap >= 0 ? "+" : ""}${formatNum(item.roiGap, 2)}` : "-", Number.isFinite(item.convGap) ? `${item.convGap >= 0 ? "+" : ""}${(item.convGap * 100).toFixed(1)}pp` : "-", formatMoney(item.estimatedLoss)]))
    const detailSource = state.ui.banDay === "全部" ? matched : [...cohort, ...controls]
    const detailRows = banUniqueRows(detailSource).sort((a, b) => {
      const statusOrder = banStatusLabel(b).localeCompare(banStatusLabel(a), "zh-Hans-CN")
      if (statusOrder) return statusOrder
      const dayOrder = (banDayNumber(a._首次封号日) ?? 99) - (banDayNumber(b._首次封号日) ?? 99)
      if (dayOrder) return dayOrder
      return (rowAdds(b) || 0) - (rowAdds(a) || 0)
    }).slice(0, 160)
    const limitDayColumns = [0, 1, 2, 3, 4, 5, 6, 7].map((day) => `day${day}限制数`)
    renderTable(
      dom.banDetailTable,
      ["班级", "班长姓名", "项目", "营期", "限制情况", "限制日", ...limitDayColumns.map((col) => col.replace("限制数", "限制")), "添加人数", "转化人数", "ROI", "转率", "day3转率", "day4转率", "day5转率", "day6转率", "day7转率"],
      detailRows.map((row) => [
        banClassDisplay(row, meta),
        row._标准班长 || row[meta.leaderField] || "",
        normalizeProjectName(row[meta.projectField]),
        row[meta.campField],
        banStatusPill(row),
        banDayPill(row._首次封号日 || "未知"),
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((day) => banLimitCountCell(row[`_day${day}限制数`])),
        formatNum(rowAdds(row), 0),
        formatNum(rowConv(row), 0),
        formatNum(ratio(rowRevenue(row), rowCost(row)), 2),
        formatPct(ratio(rowConv(row), rowAdds(row))),
        ...[3, 4, 5, 6, 7].map((day) => banRateHeatCell(firstMetric(row, null, [`day${day}转率`])))
      ])
    )

    const preFields = Number.isFinite(eventDay) && eventDay > 1 ? Array.from({ length: Math.min(eventDay - 1, 5) }, (_, i) => `day${i + 1}到播`) : []
    const preGap = avg(preFields.map((field) => insightDelta(banMetricValue(limitedAgg, field), banMetricValue(controlAgg, field))).filter(Number.isFinite))
    const timingText = Number.isFinite(preGap) && preGap < -0.03 ? "封号前到播表现已经偏低，最终差异不能全部归因于封号" : "封号前暂未发现明显的到播劣势，封号后的转化变化更值得关注"
    const topGroup = groupRows[0]
    const insight = `${state.ui.banDay === "全部" ? "当前封号班级" : `${state.ui.banDay.replace("day", "Day")}封号班级`}共${limitedAgg.count}个，覆盖添加人数${formatNum(limitedAgg.adds, 0)}人；ROI为${formatNum(limitedAgg.roi, 2)}，较未封号对照${Number.isFinite(roiGap) ? `${roiGap >= 0 ? "高" : "低"}${formatNum(Math.abs(roiGap), 2)}` : "暂无有效差值"}。${timingText}。${topGroup ? `${topGroup.name}估算流水缺口最大，约${formatMoney(topGroup.estimatedLoss)}。` : "当前暂无可定位的小组影响。"}`
    dom.banInsightText.innerHTML = `<strong>策略洞察</strong><p>${insightEscape(insight)}</p><small>差异与缺口均基于当前筛选范围内已匹配的未封号班级估算，不代表严格因果关系。</small>`
    state.ui.banInsightCopyText = `【封号影响分析｜${state.ui.banDay === "全部" ? "全部封号日" : state.ui.banDay.replace("day", "Day")}】\n\n${insight}\n\n关键指标：\n- 封号班级：${limitedAgg.count}个\n- 受影响添加：${formatNum(limitedAgg.adds, 0)}人\n- 封号班级ROI：${formatNum(limitedAgg.roi, 2)}\n- 对照班级ROI：${formatNum(controlAgg.roi, 2)}\n- 转率差值：${Number.isFinite(convGap) ? `${(convGap * 100).toFixed(1)}pp` : "-"}\n- 估算流水缺口：${formatMoney(estimatedLoss)}\n\n重点小组：\n${groupRows.slice(0, 3).map((item, i) => `${i + 1}. ${item.name}：估算缺口${formatMoney(item.estimatedLoss)}`).join("\n") || "暂无"}\n\n说明：基于可比未封号班级估算，不代表严格因果关系。`
  }

  function renderProjectCompareSection(camps, scopedRows) {
    const dimension = "project"
    const dimensionItems = buildCampRhythmItems(camps, dimension)
    renderCampOverviewTreeTable(
      dom.projectCompareOverviewTable,
      buildCampOverviewFlatRows(scopedRows, dimension, state.ui.projectCompareOverviewExpanded),
      dimension,
      false
    )
    renderCampOverviewTreeTable(
      dom.projectCompareWarmOverviewTable,
      buildCampOverviewFlatRows(scopedRows, dimension, state.ui.projectCompareWarmOverviewExpanded),
      dimension,
      true
    )
    renderDimensionRhythmCharts("projectCompare", dimensionItems)
    renderByDayCharts(dom.projectCompareProcessCharts, dimensionItems, PROCESS_SPECS, false)
    renderByDayCharts(dom.projectCompareConversionCharts, dimensionItems, CONVERSION_SPECS, false)
    renderDecayCharts(dom.projectCompareDecayCharts, dimensionItems, DECAY_SPECS, false)
  }

  function renderDimensionRhythmCharts(prefix, dimensionItems) {
    Plotly.newPlot(`${prefix}CumConv`, withValueLabels(dimensionItems.map((item) => {
      let cumulative = 0
      const xs = []
      const ys = []
      for (let day = 3; day <= 7; day += 1) {
        const value = firstMetric(item.raw, item.supplement, [`day${day}转率`])
        if (value === null) continue
        cumulative += value
        xs.push(`day${day}`)
        ys.push(cumulative)
      }
      return { type: "scatter", mode: "lines+markers", name: item.dimensionLabel, x: xs, y: ys }
    }).filter((trace) => trace.y.length), formatChartPercent), baseLayout({
      yaxis: { title: "累计转率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID }
    }), plotConfig)
    renderHeatmap(`${prefix}HmOrder`, dimensionItems, (item, day) => orderShare(item, day), (value) => formatPct(value), false)
    renderHeatmap(`${prefix}HmConv`, dimensionItems, (item, day) => firstMetric(item.raw, item.supplement, [`day${day}转率`]), (value) => formatPct(value, 2), false)
    renderHeatmap(`${prefix}HmPending`, dimensionItems, (item, day) => firstMetric(item.raw, item.supplement, [`day${day}待支付率`, "待支付率"]), (value) => formatPct(value, 2), false, true)
    renderHeatmap(`${prefix}HmPendingConv`, dimensionItems, (item, day) => firstMetric(item.raw, item.supplement, [`day${day}待支付转率`]), (value) => formatPct(value, 2), false)
    if (prefix === "camp") {
      renderHeatmap("campHmAttendConv", dimensionItems, (item, day) => firstMetric(item.raw, item.supplement, [`day${day}到播转率`]), (value) => formatPct(value, 2), false)
      renderHeatmap("campHmIndividualConv", dimensionItems, (item, day) => firstMetric(item.raw, item.supplement, [`day${day}个销转率`]), (value) => formatPct(value, 2), false)
    }
  }

  function drillPathItems(drill) {
    if (!drill) return []
    const items = []
    if (drill.month !== null && drill.month !== undefined) items.push(`${drill.month}月`)
    if (drill.campId) items.push(`营期 ${drill.campId}`)
    if (drill.groupName) items.push(`大组 ${drill.groupName}`)
    if (drill.smallGroupName) items.push(`小组 ${drill.smallGroupName}`)
    return items
  }

  function previousCampDrill(drill) {
    if (!drill) return null
    if (drill.level === "month" || drill.level === "camp") return null
    if (drill.level === "group") {
      return drill.campId ? { level: "camp", campId: drill.campId } : { level: "month", month: drill.month }
    }
    if (drill.level === "smallGroup") {
      return {
        level: "group",
        month: drill.month ?? null,
        campId: drill.campId || null,
        groupName: drill.groupName
      }
    }
    return null
  }

  function parseDrillState(button) {
    return {
      level: button.dataset.level,
      month: button.dataset.month ? Number(button.dataset.month) : null,
      campId: button.dataset.camp || null,
      groupName: button.dataset.group || null,
      smallGroupName: button.dataset.smallgroup || null
    }
  }

  function openCampDrill(kind, next) {
    state.ui.activeTab = "camp"
    if (kind === "month") {
      state.ui.monthDrill = next
      if (!state.ui.monthDrillMode) state.ui.monthDrillMode = "path"
    } else {
      state.ui.campEntityDrill = next
      if (!state.ui.campEntityDrillMode) state.ui.campEntityDrillMode = "path"
    }
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "camp"))
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === "camp"))
    renderMonthDrilldown()
    renderCampEntityDrilldown()
    resizeVisiblePlots()
  }

  function renderDrillPanel(drill, refs, metrics, includeScopeColumns) {
    if (!drill) {
      refs.panel.classList.add("hidden")
      return
    }
    const config = campDrillConfig(drill)
    const rows = buildCampDrillRows(drill).sort((a, b) => (b.metrics.roi || 0) - (a.metrics.roi || 0))
    refs.panel.classList.remove("hidden")
    refs.title.textContent = config.title
    refs.hint.textContent = config.hint
    refs.path.innerHTML = drillPathItems(drill).map((item) => `<span class="drill-crumb">${item}</span>`).join("")
    refs.backBtn.disabled = !previousCampDrill(drill)
    const headers = includeScopeColumns
      ? [config.nameLabel, "覆盖营期", "底表记录数", ...metrics.map((item) => item.label)]
      : [config.nameLabel, ...metrics.map((item) => item.label)]
    const tableRows = rows.map((item) => {
      const label = config.clickKey
        ? makeDrillButton(item[config.clickKey], {
          action: refs.action,
          level: config.nextLevel,
          month: drill.month ?? "",
          camp: drill.campId || "",
          group: item.groupName || drill.groupName || "",
          smallgroup: item.smallGroupName || ""
        })
        : (item.className || "-")
      const cells = includeScopeColumns ? [String(item.coveredCampCount || 0), String(item.rowCount || 0)] : []
      return [label, ...cells, ...metrics.map((spec) => metricCell(spec.value(item), spec, rows))]
    })
    renderTable(refs.table, headers, tableRows)
  }

  function renderQuickSwitch(host, options, activeValue, dataset = {}) {
    if (!host) return
    host.innerHTML = options.map((item) => {
      const attrs = Object.entries({ ...dataset, value: item.value }).map(([key, value]) => `data-${key}="${String(value).replace(/"/g, "&quot;")}"`).join(" ")
      return `<button class="quick-switch-btn ${item.value === activeValue ? "active" : ""}" type="button" ${attrs}>${item.label}</button>`
    }).join("")
  }

  function renderMultiQuickSwitch(host, options, activeValues, dataset = {}) {
    if (!host) return
    const activeSet = new Set(activeValues || [])
    host.innerHTML = options.map((item) => {
      const attrs = Object.entries({ ...dataset, value: item.value }).map(([key, value]) => `data-${key}="${String(value).replace(/"/g, "&quot;")}"`).join(" ")
      return `<button class="quick-switch-btn ${activeSet.has(item.value) ? "active" : ""}" type="button" ${attrs}>${item.label}</button>`
    }).join("")
  }

  function toggleMultiSelection(currentValues, value, validKeys = []) {
    const validSet = new Set(validKeys)
    const current = Array.isArray(currentValues) ? currentValues.filter((key) => validSet.has(key)) : []
    const next = current.includes(value)
      ? current.filter((key) => key !== value)
      : [...current, value]
    return next.length ? next : [value]
  }

  function renderExpandedDrillView(kind, drill, metrics) {
    const modeRefs = drillModeRefs(kind)
    const root = drillRootScope(drill)
    if (!root) return
    const selectedGroup = drill.groupName || ""
    const selectedSmallGroup = drill.smallGroupName || ""
    const groupRows = buildCampDrillRowsByLevel(root, "group")
    const groupOptions = [{ label: "全部大组", value: "" }, ...groupRows.map((item) => ({ label: item.groupName, value: item.groupName }))]
    const smallGroupScope = selectedGroup ? { ...root, groupName: selectedGroup } : root
    const smallGroupRows = buildCampDrillRowsByLevel(smallGroupScope, "smallGroup")
    const smallGroupOptions = [{ label: "全部小组", value: "" }, ...smallGroupRows.map((item) => ({ label: item.smallGroupName, value: item.smallGroupName }))]
    const classScope = {
      ...root,
      groupName: selectedGroup || null,
      smallGroupName: selectedSmallGroup || null
    }
    const classRows = buildCampDrillRowsByLevel(classScope, "class")

    renderQuickSwitch(modeRefs.groupFilter, groupOptions, selectedGroup, { action: `${kind}-expand-group` })
    renderQuickSwitch(modeRefs.smallGroupFilter, smallGroupOptions, selectedSmallGroup, { action: `${kind}-expand-smallgroup` })

    renderTable(modeRefs.groupTable, ["大组", ...(kind === "month" ? ["覆盖营期", "底表记录数"] : []), ...metrics.map((item) => item.label)], groupRows.map((item) => [
      makeDrillButton(item.groupName, { action: `${kind}-expand-group-row`, group: item.groupName }),
      ...(kind === "month" ? [String(item.coveredCampCount || 0), String(item.rowCount || 0)] : []),
      ...metrics.map((spec) => metricCell(spec.value(item), spec, groupRows))
    ]))
    renderTable(modeRefs.smallGroupTable, [
      ...(selectedGroup ? [] : ["大组"]),
      "小组",
      ...(kind === "month" ? ["覆盖营期", "底表记录数"] : []),
      ...metrics.map((item) => item.label)
    ], smallGroupRows.map((item) => [
      ...(selectedGroup ? [] : [item.groupName]),
      makeDrillButton(item.smallGroupName, { action: `${kind}-expand-smallgroup-row`, group: item.groupName, smallgroup: item.smallGroupName }),
      ...(kind === "month" ? [String(item.coveredCampCount || 0), String(item.rowCount || 0)] : []),
      ...metrics.map((spec) => metricCell(spec.value(item), spec, smallGroupRows))
    ]))
    renderTable(modeRefs.classTable, [
      ...(selectedGroup ? [] : ["大组"]),
      ...(selectedSmallGroup ? [] : ["小组"]),
      "班长",
      ...(kind === "month" ? ["覆盖营期", "底表记录数"] : []),
      ...metrics.map((item) => item.label)
    ], classRows.map((item) => [
      ...(selectedGroup ? [] : [item.groupName]),
      ...(selectedSmallGroup ? [] : [item.smallGroupName]),
      item.className || "-",
      ...(kind === "month" ? [String(item.coveredCampCount || 0), String(item.rowCount || 0)] : []),
      ...metrics.map((spec) => metricCell(spec.value(item), spec, classRows))
    ]))
  }

  function updateExpandedDrill(kind, updater) {
    const stateKey = kind === "month" ? "monthDrill" : "campEntityDrill"
    const current = state.ui[stateKey]
    if (!current) return
    const root = drillRootScope(current)
    state.ui[stateKey] = updater(current, root)
    if (kind === "month") renderMonthDrilldown()
    else renderCampEntityDrilldown()
  }

  function renderMonthDrilldown() {
    renderDrillPanel(state.ui.monthDrill, {
      panel: dom.monthDrillPanel,
      title: dom.monthDrillTitle,
      hint: dom.monthDrillHint,
      path: dom.monthDrillPath,
      table: dom.monthDrillTable,
      backBtn: dom.monthDrillBackBtn,
      action: "month-drill"
    }, MONTH_DRILL_METRICS, true)
    setDrillMode("month", state.ui.monthDrillMode || "path")
    if (state.ui.monthDrill) renderExpandedDrillView("month", state.ui.monthDrill, MONTH_DRILL_METRICS)
  }

  function renderCampEntityDrilldown() {
    renderDrillPanel(state.ui.campEntityDrill, {
      panel: dom.campEntityDrillPanel,
      title: dom.campEntityDrillTitle,
      hint: dom.campEntityDrillHint,
      path: dom.campEntityDrillPath,
      table: dom.campEntityDrillTable,
      backBtn: dom.campEntityDrillBackBtn,
      action: "camp-entity-drill"
    }, CAMP_ENTITY_DRILL_METRICS, false)
    setDrillMode("entity", state.ui.campEntityDrillMode || "path")
    if (state.ui.campEntityDrill) renderExpandedDrillView("entity", state.ui.campEntityDrill, CAMP_ENTITY_DRILL_METRICS)
  }

  function aggregateGroupMetrics(items) {
    const revenue = sum(items.map((item) => item.metrics.revenue))
    const cost = sum(items.map((item) => item.metrics.cost))
    const adds = sum(items.map((item) => item.metrics.adds))
    const conv = sum(items.map((item) => item.metrics.conv))
    const leaderCount = sum(items.map((item) => parseNumber(item.raw?._班长数)))
    const pendingPeople = sum(items.map((item) => parseNumber(item.raw?._待支付人数)))
    const pendingConvPeople = sum(items.map((item) => parseNumber(item.raw?._待支付转化人数)))
    const individualRevenue = sum(items.map((item) => parseNumber(item.raw?._个销流水)))
    return {
      revenue,
      cost,
      adds,
      conv,
      leaderCount,
      roi: ratio(revenue, cost),
      personEfficiency: ratio(adds, leaderCount),
      convRate: ratio(conv, adds),
      addRevenue: ratio(revenue, adds),
      aov: ratio(revenue, conv),
      individualShare: ratio(individualRevenue, revenue),
      pendingRate: ratio(pendingPeople, adds),
      pendingConv: ratio(pendingConvPeople, pendingPeople)
    }
  }

  function entityKey(kind, item) {
    if (kind === "smallGroup") return `${String(item.groupName || "未知大组").trim() || "未知大组"}__${String(item.smallGroupName || "未知小组").trim() || "未知小组"}`
    return String(item.groupName || "未知大组").trim() || "未知大组"
  }

  function entityDisplay(kind, item) {
    if (kind === "smallGroup") return String(item.smallGroupName || "未知小组").trim() || "未知小组"
    return String(item.groupName || "未知大组").trim() || "未知大组"
  }

  function buildEntityComparisonRows(items, kind, classItems = []) {
    const classBuckets = groupBy(classItems, (item) => entityKey(kind, item))
    return Array.from(groupBy(items, (item) => entityKey(kind, item)).entries()).map(([key, bucket]) => {
      const base = bucket[0] || {}
      const classRois = (classBuckets.get(key) || []).map((item) => item.metrics.roi)
      const leaderRows = aggregateLeaderRows(classBuckets.get(key) || [])
      const leaderRois = leaderRows.map((item) => item.roi)
      const roiStd = stdDev(classRois)
      const roiMean = avg(leaderRois)
      const roiRange = valueRange(classRois)
      const addsTotal = sum(bucket.map((item) => item.metrics.adds))
      const convTotal = sum(bucket.map((item) => item.metrics.conv))
      const aggregate = buildSnapshotAggregateItem(bucket, base.smallGroupName || base.groupName || "")
      const tailLeaderTimes = (classBuckets.get(key) || []).filter((item) => Number.isFinite(item.metrics.roi) && item.metrics.roi < 0.5).length
      const totalLeaderTimes = (classBuckets.get(key) || []).length
      return {
        key,
        entityName: entityDisplay(kind, base),
        groupName: base.groupName || "未知大组",
        smallGroupName: base.smallGroupName || "未知小组",
        campCount: uniq(bucket.map((item) => item.campId)).length,
        weekCount: uniq(bucket.map((item) => item.weekKey).filter(Boolean)).length,
        roiStd,
        roiCv: Number.isFinite(roiStd) && Number.isFinite(roiMean) && roiMean !== 0 ? Math.abs(roiStd / roiMean) : null,
        roiRange,
        highImmerseRate: normalizeRateLikeValue(firstMetric(aggregate?.raw, aggregate?.supplement, ["高沉浸率"])),
        tailLeaderShare: ratio(tailLeaderTimes, totalLeaderTimes),
        day3OrderShare: ratio(sum(bucket.map((item) => {
          const conv = item.metrics.conv
          const share = orderShare(item, 3)
          return Number.isFinite(conv) && Number.isFinite(share) ? conv * share : null
        })), convTotal),
        day4OrderShare: ratio(sum(bucket.map((item) => {
          const conv = item.metrics.conv
          const share = orderShare(item, 4)
          return Number.isFinite(conv) && Number.isFinite(share) ? conv * share : null
        })), convTotal),
        day5OrderShare: ratio(sum(bucket.map((item) => {
          const conv = item.metrics.conv
          const share = orderShare(item, 5)
          return Number.isFinite(conv) && Number.isFinite(share) ? conv * share : null
        })), convTotal),
        day6OrderShare: ratio(sum(bucket.map((item) => {
          const conv = item.metrics.conv
          const share = orderShare(item, 6)
          return Number.isFinite(conv) && Number.isFinite(share) ? conv * share : null
        })), convTotal),
        day7OrderShare: ratio(sum(bucket.map((item) => {
          const conv = item.metrics.conv
          const share = orderShare(item, 7)
          return Number.isFinite(conv) && Number.isFinite(share) ? conv * share : null
        })), convTotal),
        day3ConvRate: ratio(sum(bucket.map((item) => {
          const adds = item.metrics.adds
          const rate = firstMetric(item.raw, item.supplement, ["day3转率"])
          return Number.isFinite(adds) && Number.isFinite(rate) ? adds * rate : null
        })), addsTotal),
        day4ConvRate: ratio(sum(bucket.map((item) => {
          const adds = item.metrics.adds
          const rate = firstMetric(item.raw, item.supplement, ["day4转率"])
          return Number.isFinite(adds) && Number.isFinite(rate) ? adds * rate : null
        })), addsTotal),
        day5ConvRate: ratio(sum(bucket.map((item) => {
          const adds = item.metrics.adds
          const rate = firstMetric(item.raw, item.supplement, ["day5转率"])
          return Number.isFinite(adds) && Number.isFinite(rate) ? adds * rate : null
        })), addsTotal),
        day6ConvRate: ratio(sum(bucket.map((item) => {
          const adds = item.metrics.adds
          const rate = firstMetric(item.raw, item.supplement, ["day6转率"])
          return Number.isFinite(adds) && Number.isFinite(rate) ? adds * rate : null
        })), addsTotal),
        day7ConvRate: ratio(sum(bucket.map((item) => {
          const adds = item.metrics.adds
          const rate = firstMetric(item.raw, item.supplement, ["day7转率"])
          return Number.isFinite(adds) && Number.isFinite(rate) ? adds * rate : null
        })), addsTotal),
        ...aggregateGroupMetrics(bucket)
      }
    }).sort((a, b) => (b.roi || 0) - (a.roi || 0))
  }

  function buildEntityTrendRows(items, kind, dimension = "camp") {
    const isWeek = dimension === "week"
    const validItems = items.filter((item) => isWeek ? item.weekKey : String(item.campId || "").trim())
    const periodKeyOf = (item) => isWeek ? item.weekKey : String(item.campId || "").trim()
    return Array.from(groupBy(validItems, (item) => `${periodKeyOf(item)}__${entityKey(kind, item)}`).entries()).map(([key, bucket]) => {
      const splitIndex = key.indexOf("__")
      const periodKey = splitIndex >= 0 ? key.slice(0, splitIndex) : key
      const entityCompositeKey = splitIndex >= 0 ? key.slice(splitIndex + 2) : key
      const base = bucket[0]
      return {
        key: entityCompositeKey,
        periodKey,
        periodLabel: isWeek ? (base?.weekShortLabel || base?.weekLabel || periodKey) : String(base?.campId || periodKey),
        periodFullLabel: isWeek ? (base?.weekLabel || periodKey) : String(base?.campId || periodKey),
        periodStartDate: isWeek ? (base?.weekStartDate || null) : (base?.startDate || null),
        entityName: entityDisplay(kind, base || {}),
        groupName: base?.groupName || "未知大组",
        smallGroupName: base?.smallGroupName || "未知小组",
        campCount: uniq(bucket.map((item) => item.campId)).length,
        ...aggregateGroupMetrics(bucket)
      }
    }).sort((a, b) => {
      const timeA = a.periodStartDate?.getTime()
      const timeB = b.periodStartDate?.getTime()
      if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) return timeA - timeB
      if (Number.isFinite(timeA) !== Number.isFinite(timeB)) return Number.isFinite(timeA) ? -1 : 1
      const periodCompare = String(a.periodKey || "").localeCompare(String(b.periodKey || ""), "zh-CN", { numeric: true })
      return periodCompare || a.entityName.localeCompare(b.entityName, "zh-CN")
    })
  }

  function pickBestMetricRow(rows, spec) {
    const valid = rows.filter((item) => Number.isFinite(spec.value(item)))
    if (!valid.length) return null
    return valid.reduce((best, item) => {
      if (!best) return item
      const bestValue = spec.value(best)
      const currentValue = spec.value(item)
      return spec.better === "low"
        ? (currentValue < bestValue ? item : best)
        : (currentValue > bestValue ? item : best)
    }, null)
  }

  function comparisonScore(rows, spec, value) {
    const values = rows.map((item) => spec.value(item)).filter((item) => Number.isFinite(item))
    if (!Number.isFinite(value) || !values.length) return null
    const sorted = values.slice().sort((a, b) => spec.better === "low" ? a - b : b - a)
    if (sorted.length === 1) return 1
    const index = sorted.findIndex((item) => item === value)
    return index < 0 ? null : (1 - index / (sorted.length - 1))
  }

  function renderEntityComparisonHeatmap(rows, heatmapId) {
    const specs = ENTITY_HEATMAP_METRICS
    Plotly.newPlot(heatmapId, [{
      type: "heatmap",
      x: specs.map((item) => item.label),
      y: rows.map((item) => item.entityName),
      z: rows.map((item) => specs.map((spec) => comparisonScore(rows, spec, spec.value(item)))),
      text: rows.map((item) => specs.map((spec) => /率|占比/.test(spec.label) ? formatChartPercent(spec.value(item)) : spec.formatter(spec.value(item)))),
      texttemplate: "%{text}",
      hovertemplate: "%{y}<br>%{x}: %{text}<extra></extra>",
      colorscale: [[0, "#fee2e2"], [0.5, "#fef3c7"], [1, "#dcfce7"]],
      showscale: false
    }], baseLayout({
      margin: { l: 90, r: 18, t: 20, b: 60 }
    }), plotConfig)
  }

  function renderEntityOrderRhythmHeatmap(rows, heatmapId, metricType = "orderShare") {
    const days = [3, 4, 5, 6, 7]
    const suffix = metricType === "convRate" ? "ConvRate" : "OrderShare"
    const title = metricType === "convRate" ? "转率" : "出单占比"
    Plotly.newPlot(heatmapId, [{
      type: "heatmap",
      x: days.map((day) => `day${day}`),
      y: rows.map((item) => item.entityName),
      z: rows.map((item) => days.map((day) => item[`day${day}${suffix}`])),
      text: rows.map((item) => days.map((day) => formatChartPercent(item[`day${day}${suffix}`]))),
      texttemplate: "%{text}",
      hovertemplate: `%{y}<br>%{x} ${title}: %{text}<extra></extra>`,
      colorscale: [[0, "#f8fafc"], [0.35, "#bfdbfe"], [0.7, "#86efac"], [1, "#fde68a"]],
      showscale: false
    }], baseLayout({
      margin: { l: 90, r: 18, t: 20, b: 46 }
    }), plotConfig)
  }

  function roiTier(roi) {
    if (!Number.isFinite(roi)) return "未分层"
    if (roi >= 0.8) return "头部"
    if (roi < 0.5) return "尾部"
    return "中部"
  }

  function classTier(item) {
    return roiTier(item.metrics?.roi)
  }

  function leaderLookupKeyByProjectAndName(projectName, className) {
    return `${normalizeProjectName(projectName)}__${String(className || "未知班长").trim() || "未知班长"}`
  }

  function leaderLookupKey(item) {
    return leaderLookupKeyByProjectAndName(item?.projectName, item?.className)
  }

  function leaderTypeByCampCount(campCount) {
    return campCount > 4 ? "老人" : "新人"
  }

  const LEADER_TIER_SPECS = [
    { name: "尾部", countKey: "尾部数", ratioKey: "尾部占比", color: "#ef4444" },
    { name: "中部", countKey: "中部数", ratioKey: "中部占比", color: "#f59e0b" },
    { name: "头部", countKey: "头部数", ratioKey: "头部占比", color: "#2563eb" }
  ]

  const LEADER_TYPE_SPECS = [
    { name: "新人", countKey: "新人数", ratioKey: "新人占比", color: "#22c55e" },
    { name: "老人", countKey: "老人数", ratioKey: "老人占比", color: "#8b5cf6" }
  ]

  const CLASS_FORMAT_SPECS = [
    { name: "小班", countKey: "小班数", ratioKey: "小班占比", color: "#38bdf8" },
    { name: "中班", countKey: "中班数", ratioKey: "中班占比", color: "#f59e0b" },
    { name: "大班", countKey: "大班数", ratioKey: "大班占比", color: "#8b5cf6" }
  ]

  function buildLeaderExperienceLookup(classes) {
    return Array.from(groupBy(classes, leaderLookupKey).entries()).reduce((lookup, [key, bucket]) => {
      lookup.set(key, {
        campCount: uniq(bucket.map((item) => item.campId).filter(Boolean)).length
      })
      return lookup
    }, new Map())
  }

  function buildLeaderExperienceLookupFromRows(rows, meta) {
    return Array.from(groupBy(rows, (row) => leaderLookupKeyByProjectAndName(row[meta.projectField], row[meta.classField])).entries()).reduce((lookup, [key, bucket]) => {
      const campCount = uniq(bucket.map((row) => String(row[meta.campField] || "").trim()).filter(Boolean)).length
      lookup.set(key, {
        campCount,
        leaderType: leaderTypeByCampCount(campCount)
      })
      return lookup
    }, new Map())
  }

  function buildScopedLeaderRecords(classes, experienceLookup = null) {
    return Array.from(groupBy(classes, leaderLookupKey).entries()).map(([key, bucket]) => {
      const base = bucket[0] || {}
      const scopedCampCount = uniq(bucket.map((item) => item.campId).filter(Boolean)).length
      const precomputedCampCount = parseNumber(base?.raw?._班长营期数)
      const precomputedType = String(base?.raw?._班长类型 || "").trim()
      const allCampCount = Number.isFinite(precomputedCampCount) ? precomputedCampCount : (experienceLookup?.get(key)?.campCount || scopedCampCount)
      return {
        key,
        className: base.className || "未知班长",
        groupName: base.groupName || "未知大组",
        smallGroupName: base.smallGroupName || "未知小组",
        projectName: normalizeProjectName(base.projectName),
        campCount: allCampCount,
        scopedCampCount,
        leaderType: precomputedType || leaderTypeByCampCount(allCampCount),
        ...aggregateGroupMetrics(bucket)
      }
    })
  }

  function buildLeaderSegmentRowsFromRecords(leaderRecords, dimension, specs, resolveSegment) {
    const labelFn = dimension === "group"
      ? (item) => item.groupName || "未知大组"
      : dimension === "smallGroup"
        ? (item) => item.smallGroupName || "未知小组"
        : () => "项目"
    const keyFn = dimension === "group"
      ? (item) => item.groupName || "未知大组"
      : dimension === "smallGroup"
        ? (item) => `${item.groupName || "未知大组"} / ${item.smallGroupName || "未知小组"}`
        : () => "项目"
    return Array.from(groupBy(leaderRecords, keyFn).entries()).map(([key, items]) => {
      const base = items[0] || {}
      const counts = Object.fromEntries(specs.map((item) => [item.countKey, 0]))
      items.forEach((item) => {
        const segment = resolveSegment(item)
        const spec = specs.find((candidate) => candidate.name === segment)
        if (spec) counts[spec.countKey] += 1
      })
      const total = specs.reduce((acc, item) => acc + counts[item.countKey], 0)
      return {
        key,
        label: labelFn(base),
        total,
        leaderCount: items.length,
        ...counts,
        ...Object.fromEntries(specs.map((item) => [item.ratioKey, ratio(counts[item.countKey], total)]))
      }
    }).sort((a, b) => (b.total || 0) - (a.total || 0) || a.label.localeCompare(b.label, "zh-CN"))
  }

  function dayOrderShareFromBucket(items, day) {
    const convTotal = sum(items.map((item) => item.metrics.conv))
    return ratio(sum(items.map((item) => {
      const conv = item.metrics.conv
      const share = orderShare(item, day)
      return Number.isFinite(conv) && Number.isFinite(share) ? conv * share : null
    })), convTotal)
  }

  function aggregateLeaderRows(items) {
    return Array.from(groupBy(items, (item) => item.className || "未知班长").entries()).map(([className, bucket]) => {
      const base = bucket[0] || {}
      return {
        className,
        groupName: base.groupName || "未知大组",
        smallGroupName: base.smallGroupName || "未知小组",
        campCount: uniq(bucket.map((item) => item.campId)).length,
        ...aggregateGroupMetrics(bucket)
      }
    })
  }

  function normalizeClassFormat(value) {
    if (/小班/.test(String(value || ""))) return "小班"
    if (/中班/.test(String(value || ""))) return "中班"
    if (/大班/.test(String(value || ""))) return "大班"
    return ""
  }

  function classFormatOfItem(item) {
    return normalizeClassFormat(item?.classType || rowClassType(item?.raw || {}) || "")
  }

  function splitBatchSearchKeywords(value) {
    return uniq(String(value || "")
      .toLowerCase()
      .split(/[\s,，、;；|]+/)
      .map((item) => item.trim())
      .filter(Boolean))
  }

  function classTableSearchMatch(item, keywords) {
    const keywordList = Array.isArray(keywords) ? keywords : splitBatchSearchKeywords(keywords)
    if (!keywordList.length) return true
    const haystack = [
      item.className,
      item.smallGroupName,
      item.groupName,
      item.campId
    ].map((value) => String(value || "").toLowerCase()).join(" ")
    return keywordList.some((keyword) => haystack.includes(keyword))
  }

  function buildClassDetailRows(classes) {
    const campBenchmarks = new Map()
    const campRevenueRankMap = new Map()
    groupBy(classes, (item) => item.campId || "").forEach((bucket, campId) => {
      if (!campId) return
      campBenchmarks.set(campId, avg(bucket.map((item) => item.metrics.addRevenue)))
      const sorted = bucket.slice().sort((a, b) => (b.metrics.addRevenue ?? -Infinity) - (a.metrics.addRevenue ?? -Infinity) || String(a.className || "").localeCompare(String(b.className || ""), "zh-CN"))
      const rankMap = new Map()
      sorted.forEach((item, index) => {
        rankMap.set(item.className || `__${index}`, { rank: index + 1, total: sorted.length })
      })
      campRevenueRankMap.set(campId, rankMap)
    })
    return classes.map((item) => {
      const campAvgAddRevenue = campBenchmarks.get(item.campId) ?? null
      const rankInfo = campRevenueRankMap.get(item.campId)?.get(item.className || "")
      const day67Share = sum([orderShare(item, 6), orderShare(item, 7)])
      return {
        className: item.className,
        tier: classTier(item),
        smallGroupName: item.smallGroupName || "未知小组",
        groupName: item.groupName || "未知大组",
        campId: item.campId,
        roi: item.metrics.roi,
        personEfficiency: item.metrics.personEfficiency,
        addRevenue: item.metrics.addRevenue,
        campAvgAddRevenue,
        highBenchmark: Number.isFinite(item.metrics.addRevenue) && Number.isFinite(campAvgAddRevenue) ? item.metrics.addRevenue >= campAvgAddRevenue : null,
        addRevenueRank: rankInfo?.rank || null,
        addRevenueRankTotal: rankInfo?.total || null,
        convRate: item.metrics.convRate,
        pendingRate: item.metrics.pendingRate,
        pendingConv: item.metrics.pendingConv,
        individualShare: item.metrics.individualShare,
        day3OrderShare: orderShare(item, 3),
        day67OrderShare: Number.isFinite(day67Share) ? day67Share : null
      }
    })
  }

  function sortClassDetailRows(rows, sortKey) {
    const list = rows.slice()
    const compareText = (a, b) => String(a || "").localeCompare(String(b || ""), "zh-CN", { numeric: true })
    const compareNumber = (a, b, desc = true) => {
      const av = Number.isFinite(a) ? a : (desc ? -Infinity : Infinity)
      const bv = Number.isFinite(b) ? b : (desc ? -Infinity : Infinity)
      return desc ? bv - av : av - bv
    }
    if (sortKey === "campAsc") return list.sort((a, b) => compareText(a.campId, b.campId) || compareText(a.className, b.className))
    if (sortKey === "campDesc") return list.sort((a, b) => compareText(b.campId, a.campId) || compareText(a.className, b.className))
    if (sortKey === "roiAsc") return list.sort((a, b) => compareNumber(a.roi, b.roi, false) || compareText(a.className, b.className))
    if (sortKey === "roiDesc") return list.sort((a, b) => compareNumber(a.roi, b.roi, true) || compareText(a.className, b.className))
    if (sortKey === "convAsc") return list.sort((a, b) => compareNumber(a.convRate, b.convRate, false) || compareText(a.className, b.className))
    if (sortKey === "convDesc") return list.sort((a, b) => compareNumber(a.convRate, b.convRate, true) || compareText(a.className, b.className))
    return list.sort((a, b) => compareNumber(a.roi, b.roi, true) || compareText(a.className, b.className))
  }

  function classRoiTagClass(value) {
    if (!Number.isFinite(value)) return ""
    if (value >= 0.8) return "td-good"
    if (value < 0.5) return "td-bad"
    return "td-warn"
  }

  function classBooleanTag(value) {
    if (value === null) return "-"
    const cls = value ? "td-good" : "td-bad"
    return `<span class="${cls}">${value ? "是" : "否"}</span>`
  }

  function sortIndicator(sortKey, activeSort) {
    if (activeSort === `${sortKey}Asc`) return "↑"
    if (activeSort === `${sortKey}Desc`) return "↓"
    return ""
  }

  function renderClassDetailTable(rows, activeSort) {
    const headers = [
      { label: "班级" },
      { label: "能力分层" },
      { label: "小组" },
      { label: "大组" },
      { label: "营期", sortKey: "camp" },
      { label: "ROI", sortKey: "roi" },
      { label: "人效" },
      { label: "添加产值" },
      { label: "大盘产值" },
      { label: "高大盘" },
      { label: "排位" },
      { label: "转率", sortKey: "conv" },
      { label: "待支付率" },
      { label: "待支付转率" },
      { label: "个销占比" },
      { label: "Day3出单占比" },
      { label: "D6-7追单占比" }
    ]
    if (!rows.length) {
      dom.classTable.innerHTML = `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
      return
    }
    dom.classTable.innerHTML = `
      <table class="class-detail-table">
        <thead>
          <tr>${headers.map((header) => {
            if (!header.sortKey) return `<th>${header.label}</th>`
            const nextSort = activeSort === `${header.sortKey}Desc` ? `${header.sortKey}Asc` : `${header.sortKey}Desc`
            return `<th><button class="table-sort-btn" type="button" data-action="class-table-sort-header" data-sort="${nextSort}">${header.label}<span>${sortIndicator(header.sortKey, activeSort)}</span></button></th>`
          }).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((item) => `
            <tr>
              <td>${item.className || "-"}</td>
              <td>${item.tier || "-"}</td>
              <td>${item.smallGroupName || "-"}</td>
              <td>${item.groupName || "-"}</td>
              <td>${item.campId || "-"}</td>
              <td><span class="${classRoiTagClass(item.roi)}">${formatNum(item.roi, 2)}</span></td>
              <td>${Number.isFinite(item.personEfficiency) ? String(Math.round(item.personEfficiency)) : "-"}</td>
              <td>${formatMoney(item.addRevenue)}</td>
              <td>${formatMoney(item.campAvgAddRevenue)}</td>
              <td>${classBooleanTag(item.highBenchmark)}</td>
              <td>${Number.isFinite(item.addRevenueRank) && Number.isFinite(item.addRevenueRankTotal) ? `${item.addRevenueRank}/${item.addRevenueRankTotal}` : "-"}</td>
              <td>${formatPct(item.convRate)}</td>
              <td>${formatPct(item.pendingRate)}</td>
              <td>${formatPct(item.pendingConv)}</td>
              <td>${formatPct(item.individualShare)}</td>
              <td>${formatPct(item.day3OrderShare)}</td>
              <td>${formatPct(item.day67OrderShare)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `
  }

  function setSelectOptions(select, options, selectedValue) {
    if (!select) return
    select.innerHTML = options.map((item) => `<option value="${String(item.value).replace(/"/g, "&quot;")}">${item.label}</option>`).join("")
    select.value = options.some((item) => item.value === selectedValue) ? selectedValue : (options[0]?.value || "")
  }

  function buildClassByDayBenchmarkItem(items, campId) {
    const raw = {}
    ;[...PROCESS_SPECS, ...CONVERSION_SPECS].forEach((spec) => {
      const maxDay = spec.field ? 7 : spec.dayEnd
      for (let day = spec.dayStart; day <= maxDay; day += 1) {
        const field = spec.field ? spec.field(day) : spec.resolver(day)[0]
        const value = avg(items.map((item) => firstMetric(item.raw, item.supplement, [field])))
        if (Number.isFinite(value)) raw[field] = value
      }
    })
    return {
      campId,
      raw,
      supplement: raw,
      seriesName: "营期均值"
    }
  }

  function buildSnapshotAggregateItem(items, seriesName = "", campId = "") {
    if (!items.length) return null
    const raw = aggregateUnifiedRows(items.map((item) => item.raw))
    return {
      ...snapshotBase({
        type: "class-tier",
        campId: campId || (items[0]?.campId || ""),
        projectName: items[0]?.projectName || "",
        groupName: null,
        month: null,
        raw,
        supplement: raw,
        startDate: null,
        status: { endDate: null, status: "", day: null }
      }),
      raw,
      supplement: raw,
      seriesName
    }
  }

  function buildClassTierCompareRows(classes) {
    const leaderRows = buildScopedLeaderRecords(classes)
    const leaderTierMap = new Map(leaderRows.map((item) => [item.key, roiTier(item.roi)]))
    const leaderBuckets = groupBy(classes, leaderLookupKey)
    const tierOrder = ["头部", "中部", "尾部"]
    return tierOrder.map((tier) => {
      const bucket = classes.filter((item) => leaderTierMap.get(leaderLookupKey(item)) === tier)
      const aggregate = buildSnapshotAggregateItem(bucket, tier)
      const leaders = leaderRows
        .filter((item) => leaderTierMap.get(item.key) === tier)
        .map((item) => {
          const leaderBucket = leaderBuckets.get(item.key) || []
          const leaderAggregate = buildSnapshotAggregateItem(leaderBucket, item.className, item.className)
          return {
            key: item.key,
            className: item.className,
            groupName: item.groupName || "未知大组",
            smallGroupName: item.smallGroupName || "未知小组",
            campCount: item.campCount,
            item: leaderAggregate,
            metrics: leaderAggregate?.metrics || {},
            day3OrderShare: dayOrderShareFromBucket(leaderBucket, 3),
            day4OrderShare: dayOrderShareFromBucket(leaderBucket, 4),
            day5OrderShare: dayOrderShareFromBucket(leaderBucket, 5),
            day6OrderShare: dayOrderShareFromBucket(leaderBucket, 6),
            day7OrderShare: dayOrderShareFromBucket(leaderBucket, 7)
          }
        })
        .filter((item) => item.item)
        .sort((a, b) => (b.metrics.roi || -Infinity) - (a.metrics.roi || -Infinity) || a.className.localeCompare(b.className, "zh-CN"))
      return {
        key: `leader-tier__${tier}`,
        tier,
        item: aggregate,
        metrics: aggregate?.metrics || {},
        day3OrderShare: dayOrderShareFromBucket(bucket, 3),
        day4OrderShare: dayOrderShareFromBucket(bucket, 4),
        day5OrderShare: dayOrderShareFromBucket(bucket, 5),
        day6OrderShare: dayOrderShareFromBucket(bucket, 6),
        day7OrderShare: dayOrderShareFromBucket(bucket, 7),
        leaders
      }
    })
  }

  function classTierCompareMetricCells(row, isLeader = false) {
    const metrics = row.metrics || {}
    return [
      isLeader ? "1" : (Number.isFinite(metrics.leaderCount) ? String(Math.round(metrics.leaderCount)) : "-"),
      Number.isFinite(metrics.machineSlots) ? String(Math.round(metrics.machineSlots)) : "-",
      Number.isFinite(metrics.personEfficiency) ? String(Math.round(metrics.personEfficiency)) : "-",
      formatPct(metrics.upgradeRate),
      formatMoney(metrics.aov),
      Number.isFinite(metrics.adds) ? String(Math.round(metrics.adds)) : "-",
      Number.isFinite(metrics.conv) ? String(Math.round(metrics.conv)) : "-",
      formatPct(row.day3OrderShare),
      formatPct(row.day4OrderShare),
      formatPct(row.day5OrderShare),
      formatPct(row.day6OrderShare),
      formatPct(row.day7OrderShare),
      formatMoney(metrics.addCost),
      formatMoney(metrics.addRevenue),
      formatNum(metrics.roi, 2),
      formatPct(metrics.convRate),
      formatPct(metrics.individualShare),
      formatPct(metrics.pendingRate),
      formatPct(metrics.pendingConv),
      formatNum(metrics.replyTime, 0)
    ]
  }

  function buildClassTierCompareFlatRows(rows, expandedKeys) {
    const expanded = new Set(expandedKeys || [])
    const flattened = []
    rows.filter((row) => row.item).forEach((row) => {
      flattened.push({
        kind: "tier",
        key: row.key,
        expanded: expanded.has(row.key),
        ...row
      })
      if (expanded.has(row.key)) {
        ;(row.leaders || []).forEach((leader) => {
          flattened.push({
            kind: "leader",
            parentKey: row.key,
            ...leader
          })
        })
      }
    })
    return flattened
  }

  function renderClassTierCompareTable(rows) {
    if (!dom.classTierCompareTable) return
    const visibleRows = buildClassTierCompareFlatRows(rows, state.ui.classTierCompareExpanded)
    const headers = [
      "能力分层", "班长数", "机器号数", "人效", "升班率", "客单价", "添加人数", "转化人数",
      "Day3占比", "Day4占比", "Day5占比", "Day6占比", "Day7占比",
      "添加成本", "添加产值", "ROI", "转率", "个销占比", "待支付率", "待支付转率", "回复时长"
    ]
    if (!visibleRows.length) {
      dom.classTierCompareTable.innerHTML = `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
      return
    }
    dom.classTierCompareTable.innerHTML = `
      <table class="tree-table class-type-compare-table">
        <thead>
          <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${visibleRows.map((row) => {
            const firstCell = row.kind === "tier"
              ? `
                <button class="tree-toggle-btn level-dimension" type="button" data-action="class-tier-compare-toggle" data-key="${row.key}">
                  <span class="tree-toggle-icon">${row.expanded ? "▾" : "▸"}</span>
                  <span class="tree-label-text">${row.tier}</span>
                </button>
              `
              : `
                <div class="tree-toggle-btn level-class leaf">
                  <span class="tree-toggle-icon">•</span>
                  <span class="tree-depth" style="width:10px"></span>
                  <span class="tree-label-text">${row.className || "-"}</span>
                </div>
                <div class="type-compare-subtext">${row.smallGroupName || "-"}｜${row.groupName || "-"}｜覆盖${Number.isFinite(row.campCount) ? Math.round(row.campCount) : "-"}期</div>
              `
            const cells = classTierCompareMetricCells(row, row.kind === "leader")
            return `<tr class="tree-row level-${row.kind === "tier" ? "dimension" : "class"}"><td>${firstCell}</td>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
          }).join("")}
        </tbody>
      </table>
    `
  }

  function renderClassTierCompareSection(classes) {
    if (!dom.classTierCompareBody || !dom.classTierCompareToggleBtn) return
    dom.classTierCompareBody.classList.toggle("hidden", !!state.ui.classTierCompareCollapsed)
    dom.classTierCompareToggleBtn.textContent = state.ui.classTierCompareCollapsed ? "展开" : "收起"
    if (state.ui.classTierCompareCollapsed) return

    const tierRows = buildClassTierCompareRows(classes)
    renderClassTierCompareTable(tierRows)
    const tierSeries = tierRows.map((row) => row.item ? { ...row.item, seriesName: row.tier } : null).filter(Boolean)
    const benchmark = buildClassByDayBenchmarkItem(classes, "current")
    const plotItems = [...tierSeries, benchmark].filter(Boolean)
    renderByDayCharts(dom.classTierProcessCharts, plotItems, PROCESS_SPECS, false)
    renderByDayCharts(dom.classTierConversionCharts, plotItems, CONVERSION_SPECS, false)
    renderDecayCharts(dom.classTierDecayCharts, plotItems, DECAY_SPECS, false)
  }

  function buildClassTypeCompareRows(classes) {
    const experienceLookup = buildLeaderExperienceLookup(state.model?.classSnapshots || classes)
    const leaderRecords = buildScopedLeaderRecords(classes, experienceLookup)
    const leaderTypeMap = new Map(leaderRecords.map((item) => [item.key, item.leaderType]))
    const leaderBuckets = groupBy(classes, leaderLookupKey)
    const typeOrder = ["新人", "老人"]
    return typeOrder.map((type) => {
      const bucket = classes.filter((item) => leaderTypeMap.get(leaderLookupKey(item)) === type)
      const aggregate = buildSnapshotAggregateItem(bucket, type)
      const leaders = leaderRecords
        .filter((item) => item.leaderType === type)
        .map((item) => {
          const leaderBucket = leaderBuckets.get(item.key) || []
          const leaderAggregate = buildSnapshotAggregateItem(leaderBucket, item.className, item.className)
          return {
            key: item.key,
            className: item.className,
            groupName: item.groupName || "未知大组",
            smallGroupName: item.smallGroupName || "未知小组",
            campCount: item.campCount,
            item: leaderAggregate,
            metrics: leaderAggregate?.metrics || {},
            day3OrderShare: dayOrderShareFromBucket(leaderBucket, 3),
            day4OrderShare: dayOrderShareFromBucket(leaderBucket, 4),
            day5OrderShare: dayOrderShareFromBucket(leaderBucket, 5),
            day6OrderShare: dayOrderShareFromBucket(leaderBucket, 6),
            day7OrderShare: dayOrderShareFromBucket(leaderBucket, 7)
          }
        })
        .filter((item) => item.item)
        .sort((a, b) => (b.metrics.roi || -Infinity) - (a.metrics.roi || -Infinity) || a.className.localeCompare(b.className, "zh-CN"))
      return {
        key: `leader-type__${type}`,
        leaderType: type,
        item: aggregate,
        metrics: aggregate?.metrics || {},
        day3OrderShare: dayOrderShareFromBucket(bucket, 3),
        day4OrderShare: dayOrderShareFromBucket(bucket, 4),
        day5OrderShare: dayOrderShareFromBucket(bucket, 5),
        day6OrderShare: dayOrderShareFromBucket(bucket, 6),
        day7OrderShare: dayOrderShareFromBucket(bucket, 7),
        leaders
      }
    })
  }

  function classTypeCompareMetricCells(row, isLeader = false) {
    const metrics = row.metrics || {}
    return [
      isLeader ? "1" : (Number.isFinite(metrics.leaderCount) ? String(Math.round(metrics.leaderCount)) : "-"),
      Number.isFinite(metrics.machineSlots) ? String(Math.round(metrics.machineSlots)) : "-",
      Number.isFinite(metrics.personEfficiency) ? String(Math.round(metrics.personEfficiency)) : "-",
      formatPct(metrics.upgradeRate),
      formatMoney(metrics.aov),
      Number.isFinite(metrics.adds) ? String(Math.round(metrics.adds)) : "-",
      Number.isFinite(metrics.conv) ? String(Math.round(metrics.conv)) : "-",
      formatPct(row.day3OrderShare),
      formatPct(row.day4OrderShare),
      formatPct(row.day5OrderShare),
      formatPct(row.day6OrderShare),
      formatPct(row.day7OrderShare),
      formatMoney(metrics.addCost),
      formatMoney(metrics.addRevenue),
      formatNum(metrics.roi, 2),
      formatPct(metrics.convRate),
      formatPct(metrics.individualShare),
      formatPct(metrics.pendingRate),
      formatPct(metrics.pendingConv),
      formatNum(metrics.replyTime, 0)
    ]
  }

  function buildClassTypeCompareFlatRows(rows, expandedKeys) {
    const expanded = new Set(expandedKeys || [])
    const flattened = []
    rows.filter((row) => row.item).forEach((row) => {
      flattened.push({
        kind: "type",
        key: row.key,
        expanded: expanded.has(row.key),
        ...row
      })
      if (expanded.has(row.key)) {
        ;(row.leaders || []).forEach((leader) => {
          flattened.push({
            kind: "leader",
            parentKey: row.key,
            ...leader
          })
        })
      }
    })
    return flattened
  }

  function renderClassTypeCompareTable(rows) {
    if (!dom.classTypeCompareTable) return
    const visibleRows = buildClassTypeCompareFlatRows(rows, state.ui.classTypeCompareExpanded)
    const headers = [
      "班长类型", "班长数", "机器号数", "人效", "升班率", "客单价", "添加人数", "转化人数",
      "Day3占比", "Day4占比", "Day5占比", "Day6占比", "Day7占比",
      "添加成本", "添加产值", "ROI", "转率", "个销占比", "待支付率", "待支付转率", "回复时长"
    ]
    if (!visibleRows.length) {
      dom.classTypeCompareTable.innerHTML = `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
      return
    }
    dom.classTypeCompareTable.innerHTML = `
      <table class="tree-table class-type-compare-table">
        <thead>
          <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${visibleRows.map((row) => {
            const firstCell = row.kind === "type"
              ? `
                <button class="tree-toggle-btn level-dimension" type="button" data-action="class-type-compare-toggle" data-key="${row.key}">
                  <span class="tree-toggle-icon">${row.expanded ? "▾" : "▸"}</span>
                  <span class="tree-label-text">${row.leaderType}</span>
                </button>
              `
              : `
                <div class="tree-toggle-btn level-class leaf">
                  <span class="tree-toggle-icon">•</span>
                  <span class="tree-depth" style="width:10px"></span>
                  <span class="tree-label-text">${row.className || "-"}</span>
                </div>
                <div class="type-compare-subtext">${row.smallGroupName || "-"}｜${row.groupName || "-"}｜覆盖${Number.isFinite(row.campCount) ? Math.round(row.campCount) : "-"}期</div>
              `
            const cells = classTypeCompareMetricCells(row, row.kind === "leader")
            return `<tr class="tree-row level-${row.kind === "type" ? "dimension" : "class"}"><td>${firstCell}</td>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
          }).join("")}
        </tbody>
      </table>
    `
  }

  function renderClassTypeCompareSection(classes) {
    if (!dom.classTypeCompareBody || !dom.classTypeCompareToggleBtn) return
    dom.classTypeCompareBody.classList.toggle("hidden", !!state.ui.classTypeCompareCollapsed)
    dom.classTypeCompareToggleBtn.textContent = state.ui.classTypeCompareCollapsed ? "展开" : "收起"
    if (state.ui.classTypeCompareCollapsed) return

    const typeRows = buildClassTypeCompareRows(classes)
    renderClassTypeCompareTable(typeRows)
    const typeSeries = typeRows.map((row) => row.item ? { ...row.item, seriesName: row.leaderType } : null).filter(Boolean)
    const benchmark = buildClassByDayBenchmarkItem(classes, "current")
    const plotItems = [...typeSeries, benchmark].filter(Boolean)
    renderByDayCharts(dom.classTypeProcessCharts, plotItems, PROCESS_SPECS, false)
    renderByDayCharts(dom.classTypeConversionCharts, plotItems, CONVERSION_SPECS, false)
    renderDecayCharts(dom.classTypeDecayCharts, plotItems, DECAY_SPECS, false)
  }

  function buildClassFormatDistributionRows(classes, dimension) {
    const labelFn = dimension === "group"
      ? (item) => item.groupName || "未知大组"
      : dimension === "smallGroup"
        ? (item) => item.smallGroupName || "未知小组"
        : () => "项目"
    const keyFn = dimension === "group"
      ? (item) => item.groupName || "未知大组"
      : dimension === "smallGroup"
        ? (item) => `${item.groupName || "未知大组"} / ${item.smallGroupName || "未知小组"}`
        : () => "项目"
    return Array.from(groupBy(classes.filter((item) => classFormatOfItem(item)), keyFn).entries()).map(([key, items]) => {
      const base = items[0] || {}
      const counts = Object.fromEntries(CLASS_FORMAT_SPECS.map((item) => [item.countKey, 0]))
      items.forEach((item) => {
        const format = classFormatOfItem(item)
        const spec = CLASS_FORMAT_SPECS.find((candidate) => candidate.name === format)
        if (spec) counts[spec.countKey] += 1
      })
      const total = CLASS_FORMAT_SPECS.reduce((acc, item) => acc + counts[item.countKey], 0)
      return {
        key,
        label: labelFn(base),
        classCount: total,
        ...counts,
        ...Object.fromEntries(CLASS_FORMAT_SPECS.map((item) => [item.ratioKey, ratio(counts[item.countKey], total)]))
      }
    }).sort((a, b) => (b.classCount || 0) - (a.classCount || 0) || a.label.localeCompare(b.label, "zh-CN"))
  }

  function renderClassFormatDonut(classes) {
    if (!dom.classFormatDonut) return
    const row = buildClassFormatDistributionRows(classes, "project")[0] || { classCount: 0, 小班数: 0, 中班数: 0, 大班数: 0 }
    Plotly.newPlot(dom.classFormatDonut, [{
      type: "pie",
      hole: 0.62,
      sort: false,
      direction: "clockwise",
      labels: CLASS_FORMAT_SPECS.map((item) => item.name),
      values: CLASS_FORMAT_SPECS.map((item) => row[item.countKey] || 0),
      marker: { colors: CLASS_FORMAT_SPECS.map((item) => item.color) },
      text: CLASS_FORMAT_SPECS.map((item) => row[item.countKey] || 0).map((value, index) => {
        const rate = ratio(value, row.classCount)
        const label = CLASS_FORMAT_SPECS[index]?.name || ""
        return value > 0 ? `${label}<br>${formatChartPercent(rate)}<br>${Math.round(value)}班` : ""
      }),
      texttemplate: "%{text}",
      textposition: "inside",
      textfont: { size: 11, color: "#f8fafc" },
      hovertemplate: "%{label}<br>占比: %{percent}<br>班级数: %{value}<extra></extra>"
    }], baseLayout({
      margin: { l: 16, r: 16, t: 20, b: 20 },
      showlegend: true,
      legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.08, font: { color: PLOT_TEXT } },
      annotations: [{
        text: `班级总数<br>${Math.round(row.classCount || 0)}班`,
        showarrow: false,
        x: 0.5,
        y: 0.5,
        font: { size: 13, color: PLOT_TEXT }
      }]
    }), plotConfig)
  }

  function renderClassFormatStackedChart(host, rows) {
    if (!host) return
    Plotly.newPlot(host, CLASS_FORMAT_SPECS.map((spec) => ({
      type: "bar",
      name: spec.name,
      x: rows.map((row) => row.label),
      y: rows.map((row) => row[spec.ratioKey] || 0),
      marker: { color: spec.color },
      text: rows.map((row) => formatChartPercent(row[spec.ratioKey] || 0)),
      textposition: "inside",
      customdata: rows.map((row) => [row[spec.countKey] || 0, row.classCount || 0]),
      hovertemplate: `${spec.name}<br>%{x}<br>占比: %{y:.1%}<br>班级数: %{customdata[0]} / %{customdata[1]}<extra></extra>`
    })), baseLayout({
      barmode: "stack",
      margin: { l: 54, r: 16, t: 20, b: 100 },
      xaxis: { tickangle: -30, automargin: true, color: PLOT_MUTED, gridcolor: PLOT_GRID_LIGHT, zerolinecolor: PLOT_GRID_LIGHT },
      yaxis: { title: "班级占比", tickformat: ".0%", range: [0, 1], color: PLOT_MUTED, gridcolor: PLOT_GRID, rangemode: "tozero" }
    }), plotConfig)
  }

  function renderClassFormatCharts(classes) {
    renderClassFormatDonut(classes)
    renderClassFormatStackedChart(dom.classFormatGroupChart, buildClassFormatDistributionRows(classes, "group"))
    renderClassFormatStackedChart(dom.classFormatSmallGroupChart, buildClassFormatDistributionRows(classes, "smallGroup"))
  }

  function buildClassFormatCompareRows(classes) {
    return CLASS_FORMAT_SPECS.map((spec) => spec.name).map((classFormat) => {
      const bucket = classes.filter((item) => classFormatOfItem(item) === classFormat)
      const aggregate = buildSnapshotAggregateItem(bucket, classFormat)
      return {
        classFormat,
        classCount: bucket.length,
        item: aggregate,
        metrics: aggregate?.metrics || {},
        day3OrderShare: dayOrderShareFromBucket(bucket, 3),
        day4OrderShare: dayOrderShareFromBucket(bucket, 4),
        day5OrderShare: dayOrderShareFromBucket(bucket, 5),
        day6OrderShare: dayOrderShareFromBucket(bucket, 6),
        day7OrderShare: dayOrderShareFromBucket(bucket, 7)
      }
    }).filter((row) => row.item)
  }

  function renderClassFormatCompareTable(rows) {
    if (!dom.classFormatCompareTable) return
    renderTable(dom.classFormatCompareTable, [
      "班型", "班级数", "机器号数", "人效", "客单价", "添加人数", "转化人数",
      "Day3占比", "Day4占比", "Day5占比", "Day6占比", "Day7占比",
      "添加成本", "添加产值", "ROI", "转率", "个销占比", "待支付率", "待支付转率", "回复时长"
    ], rows.map((row) => {
      const metrics = row.metrics || {}
      return [
        row.classFormat,
        Number.isFinite(row.classCount) ? String(Math.round(row.classCount)) : "-",
        Number.isFinite(metrics.machineSlots) ? String(Math.round(metrics.machineSlots)) : "-",
        Number.isFinite(metrics.personEfficiency) ? String(Math.round(metrics.personEfficiency)) : "-",
        formatMoney(metrics.aov),
        Number.isFinite(metrics.adds) ? String(Math.round(metrics.adds)) : "-",
        Number.isFinite(metrics.conv) ? String(Math.round(metrics.conv)) : "-",
        formatPct(row.day3OrderShare),
        formatPct(row.day4OrderShare),
        formatPct(row.day5OrderShare),
        formatPct(row.day6OrderShare),
        formatPct(row.day7OrderShare),
        formatMoney(metrics.addCost),
        formatMoney(metrics.addRevenue),
        formatNum(metrics.roi, 2),
        formatPct(metrics.convRate),
        formatPct(metrics.individualShare),
        formatPct(metrics.pendingRate),
        formatPct(metrics.pendingConv),
        formatNum(metrics.replyTime, 0)
      ]
    }))
  }

  function renderClassFormatCompareSection(classes) {
    if (!dom.classFormatCompareBody || !dom.classFormatCompareToggleBtn) return
    dom.classFormatCompareBody.classList.toggle("hidden", !!state.ui.classFormatCompareCollapsed)
    dom.classFormatCompareToggleBtn.textContent = state.ui.classFormatCompareCollapsed ? "展开" : "收起"
    if (state.ui.classFormatCompareCollapsed) return

    const formatRows = buildClassFormatCompareRows(classes)
    renderClassFormatCompareTable(formatRows)
    const formatSeries = formatRows.map((row) => row.item ? { ...row.item, seriesName: row.classFormat } : null).filter(Boolean)
    const benchmark = buildClassByDayBenchmarkItem(classes, "current")
    const plotItems = [...formatSeries, benchmark].filter(Boolean)
    renderByDayCharts(dom.classFormatProcessCharts, plotItems, PROCESS_SPECS, false)
    renderByDayCharts(dom.classFormatConversionCharts, plotItems, CONVERSION_SPECS, false)
    renderDecayCharts(dom.classFormatDecayCharts, plotItems, DECAY_SPECS, false)
  }

  function renderClassByDaySection(classes) {
    const leaders = uniq(classes.map((item) => item.className).filter(Boolean)).sort((a, b) => String(a).localeCompare(String(b), "zh-CN"))
    if (!leaders.length) {
      if (dom.classByDayHint) dom.classByDayHint.textContent = "当前筛选范围内暂无可用于 By-day 对比的班长数据。"
      renderTable(dom.classByDayProcessCharts, [], [])
      renderTable(dom.classByDayConversionCharts, [], [])
      renderTable(dom.classByDayDecayCharts, [], [])
      if (dom.classByDayLeaderSelect) dom.classByDayLeaderSelect.innerHTML = ""
      if (dom.classByDayCampSelect) dom.classByDayCampSelect.innerHTML = ""
      return
    }

    const selectedLeader = leaders.includes(state.ui.classByDayLeader) ? state.ui.classByDayLeader : (classes[0]?.className || leaders[0])
    state.ui.classByDayLeader = selectedLeader
    const leaderItems = classes.filter((item) => item.className === selectedLeader)
    const campMeta = new Map()
    leaderItems.forEach((item) => {
      if (!item.campId || campMeta.has(item.campId)) return
      campMeta.set(item.campId, item.startDate || null)
    })
    const campOptions = Array.from(campMeta.entries()).sort((a, b) => {
      const ta = a[1] && Number.isFinite(a[1].getTime()) ? a[1].getTime() : -Infinity
      const tb = b[1] && Number.isFinite(b[1].getTime()) ? b[1].getTime() : -Infinity
      return tb - ta || String(a[0]).localeCompare(String(b[0]), "zh-CN", { numeric: true })
    }).map(([campId]) => ({ value: campId, label: campId }))
    const selectedCamp = campOptions.some((item) => item.value === state.ui.classByDayCamp) ? state.ui.classByDayCamp : (campOptions[0]?.value || "")
    state.ui.classByDayCamp = selectedCamp

    setSelectOptions(dom.classByDayLeaderSelect, leaders.map((item) => ({ value: item, label: item })), selectedLeader)
    setSelectOptions(dom.classByDayCampSelect, campOptions, selectedCamp)

    const leaderSnapshot = leaderItems.find((item) => item.campId === selectedCamp) || null
    const campItems = classes.filter((item) => item.campId === selectedCamp)
    const benchmarkSnapshot = campItems.length ? buildClassByDayBenchmarkItem(campItems, selectedCamp) : null
    const plotItems = [
      leaderSnapshot ? { ...leaderSnapshot, seriesName: selectedLeader } : null,
      benchmarkSnapshot
    ].filter(Boolean)

    if (dom.classByDayHint) {
      dom.classByDayHint.textContent = leaderSnapshot
        ? `当前查看 ${selectedLeader}｜${selectedCamp}，对比同营期全部班长的均值表现。`
        : "当前班长在所选营期下暂无可对比的 By-day 数据。"
    }

    if (!plotItems.length || !leaderSnapshot) {
      renderTable(dom.classByDayProcessCharts, [], [])
      renderTable(dom.classByDayConversionCharts, [], [])
      renderTable(dom.classByDayDecayCharts, [], [])
      return
    }

    renderByDayCharts(dom.classByDayProcessCharts, plotItems, PROCESS_SPECS, false)
    renderByDayCharts(dom.classByDayConversionCharts, plotItems, CONVERSION_SPECS, false)
    renderDecayCharts(dom.classByDayDecayCharts, plotItems, DECAY_SPECS, false)
  }

  function renderClassCompareByDaySection(classes) {
    const campMeta = new Map()
    classes.forEach((item) => {
      if (!item.campId || campMeta.has(item.campId)) return
      campMeta.set(item.campId, item.startDate || null)
    })
    const campOptions = Array.from(campMeta.entries()).sort((a, b) => {
      const ta = a[1] && Number.isFinite(a[1].getTime()) ? a[1].getTime() : -Infinity
      const tb = b[1] && Number.isFinite(b[1].getTime()) ? b[1].getTime() : -Infinity
      return tb - ta || String(a[0]).localeCompare(String(b[0]), "zh-CN", { numeric: true })
    }).map(([campId]) => ({ value: campId, label: campId }))
    const selectedCamp = campOptions.some((item) => item.value === state.ui.classCompareByDayCamp)
      ? state.ui.classCompareByDayCamp
      : (campOptions[0]?.value || "")
    state.ui.classCompareByDayCamp = selectedCamp
    setSelectOptions(dom.classCompareByDayCampSelect, campOptions, selectedCamp)
    if (dom.classCompareByDaySearchInput && dom.classCompareByDaySearchInput.value !== state.ui.classCompareByDaySearch) {
      dom.classCompareByDaySearchInput.value = state.ui.classCompareByDaySearch
    }
    if (!selectedCamp) {
      if (dom.classCompareByDayHint) dom.classCompareByDayHint.textContent = "当前筛选范围内暂无可用于同营期班长对比的数据。"
      if (dom.classCompareByDayCampSelect) dom.classCompareByDayCampSelect.innerHTML = ""
      dom.classCompareByDayProcessCharts.innerHTML = `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
      dom.classCompareByDayConversionCharts.innerHTML = `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
      dom.classCompareByDayDecayCharts.innerHTML = `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
      return
    }

    const keywords = splitBatchSearchKeywords(state.ui.classCompareByDaySearch)
    const compareItems = classes
      .filter((item) => item.campId === selectedCamp)
      .filter((item) => classTableSearchMatch(item, keywords))
      .slice()
      .sort((a, b) => (b.metrics.addRevenue ?? -Infinity) - (a.metrics.addRevenue ?? -Infinity) || String(a.className || "").localeCompare(String(b.className || ""), "zh-CN"))
    const leaderNameCounts = compareItems.reduce((map, item) => {
      const key = String(item.className || "未知班长").trim() || "未知班长"
      map.set(key, (map.get(key) || 0) + 1)
      return map
    }, new Map())
    const plotItems = compareItems.map((item) => {
      const leaderName = String(item.className || "未知班长").trim() || "未知班长"
      const needsSuffix = (leaderNameCounts.get(leaderName) || 0) > 1
      return {
        ...item,
        seriesName: needsSuffix ? `${leaderName}（${item.smallGroupName || "未知小组"}）` : leaderName
      }
    })

    if (dom.classCompareByDayHint) {
      dom.classCompareByDayHint.textContent = keywords.length
        ? `当前查看 ${selectedCamp} 同营期班长横向对比，已命中 ${plotItems.length} 位班长。`
        : `当前查看 ${selectedCamp} 同营期全部 ${plotItems.length} 位班长的横向对比。`
    }

    if (!plotItems.length) {
      dom.classCompareByDayProcessCharts.innerHTML = `<div class="stack-item">当前营期下暂无命中的班长数据。</div>`
      dom.classCompareByDayConversionCharts.innerHTML = `<div class="stack-item">当前营期下暂无命中的班长数据。</div>`
      dom.classCompareByDayDecayCharts.innerHTML = `<div class="stack-item">当前营期下暂无命中的班长数据。</div>`
      return
    }

    renderByDayCharts(dom.classCompareByDayProcessCharts, plotItems, PROCESS_SPECS, false)
    renderByDayCharts(dom.classCompareByDayConversionCharts, plotItems, CONVERSION_SPECS, false)
    renderDecayCharts(dom.classCompareByDayDecayCharts, plotItems, DECAY_SPECS, false)
  }

  function buildLeaderTierRows(classes, dimension = "project") {
    const labelFn = dimension === "group"
      ? (item) => item.groupName || "未知大组"
      : dimension === "smallGroup"
        ? (item) => item.smallGroupName || "未知小组"
        : () => "项目"
    const keyFn = dimension === "group"
      ? (item) => item.groupName || "未知大组"
      : dimension === "smallGroup"
        ? (item) => `${item.groupName || "未知大组"} / ${item.smallGroupName || "未知小组"}`
        : () => "项目"
    return Array.from(groupBy(classes, keyFn).entries()).map(([key, items]) => {
      const leaderRows = aggregateLeaderRows(items)
      const label = labelFn(items[0] || {})
      const tiers = { 头部: 0, 中部: 0, 尾部: 0 }
      leaderRows.forEach((item) => {
        const tier = roiTier(item.roi)
        if (tiers[tier] !== undefined) tiers[tier] += 1
      })
      const total = tiers.头部 + tiers.中部 + tiers.尾部
      return {
        key,
        label,
        total,
        leaderCount: leaderRows.length,
        头部数: tiers.头部,
        中部数: tiers.中部,
        尾部数: tiers.尾部,
        头部占比: ratio(tiers.头部, total),
        中部占比: ratio(tiers.中部, total),
        尾部占比: ratio(tiers.尾部, total)
      }
    }).sort((a, b) => (b.total || 0) - (a.total || 0) || a.label.localeCompare(b.label, "zh-CN"))
  }

  function buildLeaderTypeRows(classes, dimension = "project") {
    const experienceLookup = buildLeaderExperienceLookup(state.model?.classSnapshots || classes)
    const leaderRecords = buildScopedLeaderRecords(classes, experienceLookup)
    return buildLeaderSegmentRowsFromRecords(leaderRecords, dimension, LEADER_TYPE_SPECS, (item) => item.leaderType)
  }

  function renderLeaderSegmentStackedChart(host, rows, specs, hoverLabel = "分类") {
    Plotly.newPlot(host, specs.map((spec) => ({
      type: "bar",
      name: spec.name,
      x: rows.map((item) => item.label),
      y: rows.map((item) => item[spec.ratioKey]),
      marker: { color: spec.color },
      customdata: rows.map((item) => [item[spec.countKey], item.leaderCount]),
      text: rows.map((item) => {
        const ratioValue = item[spec.ratioKey]
        const countValue = item[spec.countKey]
        if (!Number.isFinite(ratioValue) || !Number.isFinite(countValue) || ratioValue <= 0) return ""
        return `${formatChartPercent(ratioValue)}<br>${Math.round(countValue)}人`
      }),
      texttemplate: "%{text}",
      textposition: "inside",
      insidetextanchor: "middle",
      textfont: { size: 11, color: "#f8fafc" },
      cliponaxis: false,
      hovertemplate: `${spec.name}<br>%{x}<br>占比: %{y:.1%}<br>${hoverLabel}班长数: %{customdata[0]} / %{customdata[1]}<extra></extra>`
    })), baseLayout({
      barmode: "stack",
      margin: { l: 54, r: 16, t: 20, b: 100 },
      xaxis: { tickangle: -30, automargin: true, color: PLOT_MUTED, gridcolor: PLOT_GRID_LIGHT, zerolinecolor: PLOT_GRID_LIGHT },
      yaxis: { title: "班长占比", tickformat: ".0%", range: [0, 1], color: PLOT_MUTED, gridcolor: PLOT_GRID, rangemode: "tozero" }
    }), plotConfig)
  }

  function renderLeaderSegmentDonut(host, row, specs) {
    Plotly.newPlot(host, [{
      type: "pie",
      hole: 0.62,
      sort: false,
      direction: "clockwise",
      labels: specs.map((item) => item.name),
      values: specs.map((item) => row[item.countKey] || 0),
      marker: { colors: specs.map((item) => item.color) },
      text: specs.map((item) => row[item.countKey] || 0).map((value, index) => {
        const rate = ratio(value, row.leaderCount)
        const label = specs[index]?.name || ""
        return value > 0 ? `${label}<br>${formatChartPercent(rate)}<br>${Math.round(value)}人` : ""
      }),
      texttemplate: "%{text}",
      textposition: "inside",
      textfont: { size: 11, color: "#f8fafc" },
      hovertemplate: "%{label}<br>占比: %{percent}<br>班长数: %{value}<extra></extra>"
    }], baseLayout({
      margin: { l: 16, r: 16, t: 20, b: 56 },
      showlegend: true,
      legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.02, font: { color: PLOT_TEXT } },
      annotations: [{
        text: `班长总数<br>${Math.round(row.leaderCount || 0)}人`,
        showarrow: false,
        x: 0.5,
        y: 0.5,
        font: { size: 13, color: PLOT_TEXT }
      }]
    }), plotConfig)
  }

  function renderLeaderTierStackedChart(host, rows) {
    renderLeaderSegmentStackedChart(host, rows, LEADER_TIER_SPECS, "分层")
  }

  function renderLeaderTypeStackedChart(host, rows) {
    renderLeaderSegmentStackedChart(host, rows, LEADER_TYPE_SPECS, "类型")
  }

  function renderClassTierDonut(classes) {
    const row = buildLeaderTierRows(classes, "project")[0] || { leaderCount: 0, 头部数: 0, 中部数: 0, 尾部数: 0 }
    renderLeaderSegmentDonut(dom.classTierDonut, row, LEADER_TIER_SPECS.slice().reverse())
  }

  function renderClassTypeDonut(classes) {
    const row = buildLeaderTypeRows(classes, "project")[0] || { leaderCount: 0, 新人数: 0, 老人数: 0 }
    renderLeaderSegmentDonut(dom.classTypeDonut, row, LEADER_TYPE_SPECS)
  }

  function buildLeaderWeeklyHeatmapRows(classes) {
    const campBenchmarks = new Map()
    groupBy(classes, (item) => item.campId || "").forEach((bucket, campId) => {
      if (!campId) return
      const benchmark = avg(bucket.map((item) => item.metrics.addRevenue).filter((value) => Number.isFinite(value)))
      if (Number.isFinite(benchmark)) campBenchmarks.set(campId, benchmark)
    })
    return Array.from(groupBy(classes.filter((item) => item.weekKey), (item) => `${item.weekKey}__${item.groupName || "未知大组"}__${item.smallGroupName || "未知小组"}__${item.className || "未知班长"}`).entries()).map(([key, bucket]) => {
      const parts = key.split("__")
      const weekKey = parts[0] || ""
      const groupName = parts[1] || "未知大组"
      const smallGroupName = parts[2] || "未知小组"
      const className = parts.slice(3).join("__") || "未知班长"
      const base = bucket[0] || {}
      const metrics = aggregateGroupMetrics(bucket)
      const benchmarkRows = Array.from(groupBy(bucket, (item) => item.campId || "").entries()).map(([campId, campBucket]) => ({
        benchmark: campBenchmarks.get(campId),
        weight: sum(campBucket.map((item) => item.metrics.adds))
      })).filter((item) => Number.isFinite(item.benchmark))
      const weightedBenchmarkDenominator = sum(benchmarkRows.map((item) => item.weight))
      const addRevenueBenchmark = weightedBenchmarkDenominator > 0
        ? ratio(sum(benchmarkRows.map((item) => item.benchmark * item.weight)), weightedBenchmarkDenominator)
        : avg(benchmarkRows.map((item) => item.benchmark))
      return {
        weekKey,
        weekLabel: base.weekLabel || weekKey,
        weekShortLabel: base.weekShortLabel || weekKey,
        weekStartDate: base.weekStartDate || parseStartDate(weekKey),
        groupName,
        smallGroupName,
        className,
        pathLabel: `${groupName} / ${smallGroupName} / ${className}`,
        ...metrics,
        addRevenueBenchmark,
        addRevenueDiff: Number.isFinite(metrics.addRevenue) && Number.isFinite(addRevenueBenchmark) ? metrics.addRevenue - addRevenueBenchmark : null
      }
    }).sort((a, b) =>
      (a.weekStartDate?.getTime() || 0) - (b.weekStartDate?.getTime() || 0)
      || a.groupName.localeCompare(b.groupName, "zh-CN")
      || a.smallGroupName.localeCompare(b.smallGroupName, "zh-CN")
      || a.className.localeCompare(b.className, "zh-CN"))
  }

  function formatSignedMoney(value) {
    if (!Number.isFinite(value)) return "-"
    return `${value >= 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`
  }

  function renderClassWeeklyRoiHeatmap(classes) {
    const filterOptions = [{ label: "全部小组", value: "" }, ...uniq(classes.map((item) => item.smallGroupName || "未知小组"))
      .sort((a, b) => a.localeCompare(b, "zh-CN"))
      .map((smallGroupName) => ({ label: smallGroupName, value: smallGroupName }))]
    const activeSmallGroup = filterOptions.some((item) => item.value === state.ui.classHeatmapSmallGroup)
      ? state.ui.classHeatmapSmallGroup
      : ""
    state.ui.classHeatmapSmallGroup = activeSmallGroup
    renderQuickSwitch(dom.classHeatmapSmallGroupSwitch, filterOptions, activeSmallGroup, { action: "class-heatmap-smallgroup" })
    renderQuickSwitch(dom.classAddRevenueSmallGroupSwitch, filterOptions, activeSmallGroup, { action: "class-heatmap-smallgroup" })
    if (dom.classHeatmapSearchInput && dom.classHeatmapSearchInput.value !== state.ui.classHeatmapSearch) {
      dom.classHeatmapSearchInput.value = state.ui.classHeatmapSearch
    }
    const keywords = splitBatchSearchKeywords(state.ui.classHeatmapSearch)
    const rows = buildLeaderWeeklyHeatmapRows(classes).filter((item) => {
      if (activeSmallGroup && item.smallGroupName !== activeSmallGroup) return false
      return classTableSearchMatch(item, keywords)
    })
    const weekRows = Array.from(groupBy(rows, (item) => item.weekKey).values()).map((bucket) => bucket[0]).sort((a, b) => (a.weekStartDate?.getTime() || 0) - (b.weekStartDate?.getTime() || 0))
    if (!rows.length || !weekRows.length) {
      Plotly.newPlot(dom.classWeeklyRoiHeatmap, [], baseLayout({
        margin: { l: 80, r: 18, t: 20, b: 40 },
        annotations: [{
          text: "当前筛选范围内暂无热力图数据",
          showarrow: false,
          x: 0.5,
          y: 0.5,
          xref: "paper",
          yref: "paper",
          font: { size: 14, color: PLOT_MUTED }
        }]
      }), plotConfig)
      return
    }
    const x = weekRows.map((item) => item.weekShortLabel || item.weekLabel)
    const weekOrder = weekRows.map((item) => item.weekKey)
    const recentWeekKeys = weekOrder.slice(Math.max(0, weekOrder.length - 4))
    const yRows = Array.from(groupBy(rows, (item) => item.pathLabel).entries()).map(([pathLabel, bucket]) => {
      const base = bucket[0] || {}
      const valueMap = new Map(bucket.map((item) => [item.weekKey, item.roi]))
      const recentRows = bucket.filter((item) => recentWeekKeys.includes(item.weekKey))
      const recent4WeekAvg = ratio(sum(recentRows.map((item) => item.revenue)), sum(recentRows.map((item) => item.cost)))
      return {
        pathLabel,
        groupName: base.groupName || "未知大组",
        smallGroupName: base.smallGroupName || "未知小组",
        className: base.className || "未知班长",
        values: weekOrder.map((weekKey) => valueMap.get(weekKey) ?? null),
        recent4WeekAvg
      }
    }).sort((a, b) =>
      (b.recent4WeekAvg ?? -Infinity) - (a.recent4WeekAvg ?? -Infinity)
      || a.groupName.localeCompare(b.groupName, "zh-CN")
      || a.smallGroupName.localeCompare(b.smallGroupName, "zh-CN")
      || a.className.localeCompare(b.className, "zh-CN"))
    const maxValue = Math.max(ROI_TARGET, 1, ...yRows.flatMap((item) => item.values.filter((value) => Number.isFinite(value))), ...yRows.map((item) => item.recent4WeekAvg).filter((value) => Number.isFinite(value)))
    const lowBreak = Math.min(1, 0.5 / maxValue)
    const goodBreak = Math.min(1, 0.8 / maxValue)
    const heatmapHeight = Math.max(360, 120 + yRows.length * 26)
    Plotly.newPlot(dom.classWeeklyRoiHeatmap, [{
      type: "heatmap",
      x: [...x, "近4期ROI"],
      y: yRows.map((item) => item.pathLabel),
      z: yRows.map((item) => [...item.values, item.recent4WeekAvg]),
      text: yRows.map((item) => [...item.values, item.recent4WeekAvg].map((value) => Number.isFinite(value) ? formatNum(value, 2) : "")),
      texttemplate: "%{text}",
      hovertemplate: "%{y}<br>%{x}<br>ROI: %{text}<extra></extra>",
      colorscale: [
        [0, "#fecaca"],
        [lowBreak, "#fecaca"],
        [lowBreak, "#fde68a"],
        [goodBreak, "#fde68a"],
        [goodBreak, "#86efac"],
        [1, "#86efac"]
      ],
      zmid: ROI_TARGET,
      zmin: 0,
      zmax: maxValue,
      showscale: false,
      xgap: 2,
      ygap: 2
    }], baseLayout({
      margin: { l: 200, r: 18, t: 20, b: 56 },
      height: heatmapHeight,
      xaxis: { side: "top", tickangle: 0, color: PLOT_MUTED, gridcolor: PLOT_GRID_LIGHT, zerolinecolor: PLOT_GRID_LIGHT },
      yaxis: { autorange: "reversed", automargin: true, tickfont: { size: 12 }, color: PLOT_MUTED, gridcolor: PLOT_GRID_LIGHT, zerolinecolor: PLOT_GRID_LIGHT }
    }), plotConfig)
  }

  function renderClassWeeklyAddRevenueTable(classes) {
    if (!dom.classWeeklyAddRevenueTable) return
    const keywords = splitBatchSearchKeywords(state.ui.classHeatmapSearch)
    const activeSmallGroup = state.ui.classHeatmapSmallGroup || ""
    const campBenchmarks = new Map()
    groupBy(classes, (item) => item.campId || "").forEach((bucket, campId) => {
      if (!campId) return
      const benchmark = avg(bucket.map((item) => item.metrics.addRevenue).filter((value) => Number.isFinite(value)))
      if (Number.isFinite(benchmark)) campBenchmarks.set(campId, benchmark)
    })
    const rows = buildLeaderWeeklyHeatmapRows(classes).filter((item) => {
      if (activeSmallGroup && item.smallGroupName !== activeSmallGroup) return false
      return classTableSearchMatch(item, keywords)
    })
    const weekRows = Array.from(groupBy(rows, (item) => item.weekKey).values())
      .map((bucket) => bucket[0])
      .sort((a, b) => (a.weekStartDate?.getTime() || 0) - (b.weekStartDate?.getTime() || 0))
    if (!rows.length || !weekRows.length) {
      dom.classWeeklyAddRevenueTable.innerHTML = `<div class="stack-item">当前筛选范围内暂无添加产值对比数据。</div>`
      return
    }
    const weekOrder = weekRows.map((item) => item.weekKey)
    const leaderRateMap = new Map(Array.from(groupBy(classes.filter((item) => {
      if (activeSmallGroup && item.smallGroupName !== activeSmallGroup) return false
      return classTableSearchMatch(item, keywords)
    }), (item) => `${item.groupName || "未知大组"} / ${item.smallGroupName || "未知小组"} / ${item.className || "未知班长"}`).entries()).map(([pathLabel, bucket]) => {
      const highCount = bucket.filter((item) => {
        const benchmark = campBenchmarks.get(item.campId || "")
        return Number.isFinite(item.metrics.addRevenue) && Number.isFinite(benchmark) && item.metrics.addRevenue >= benchmark
      }).length
      return [pathLabel, ratio(highCount, bucket.length)]
    }))
    const yRows = Array.from(groupBy(rows, (item) => item.pathLabel).entries()).map(([pathLabel, bucket]) => {
      const base = bucket[0] || {}
      const valueMap = new Map(bucket.map((item) => [item.weekKey, {
        addRevenue: item.addRevenue,
        benchmark: item.addRevenueBenchmark,
        diff: item.addRevenueDiff
      }]))
      const recentRows = bucket.filter((item) => weekOrder.slice(Math.max(0, weekOrder.length - 4)).includes(item.weekKey))
      return {
        pathLabel,
        groupName: base.groupName || "未知大组",
        smallGroupName: base.smallGroupName || "未知小组",
        className: base.className || "未知班长",
        cells: weekOrder.map((weekKey) => valueMap.get(weekKey) || null),
        highBenchmarkRate: leaderRateMap.get(pathLabel) ?? null,
        recent4WeekAvgAddRevenue: ratio(sum(recentRows.map((item) => item.revenue)), sum(recentRows.map((item) => item.adds)))
      }
    }).sort((a, b) =>
      (b.highBenchmarkRate ?? -Infinity) - (a.highBenchmarkRate ?? -Infinity)
      || (b.recent4WeekAvgAddRevenue ?? -Infinity) - (a.recent4WeekAvgAddRevenue ?? -Infinity)
      || a.groupName.localeCompare(b.groupName, "zh-CN")
      || a.smallGroupName.localeCompare(b.smallGroupName, "zh-CN")
      || a.className.localeCompare(b.className, "zh-CN"))
    dom.classWeeklyAddRevenueTable.innerHTML = `
      <table class="leader-week-matrix">
        <colgroup>
          <col class="col-leader" />
          <col class="col-rate" />
          ${weekRows.map(() => `<col class="col-week" />`).join("")}
        </colgroup>
        <thead>
          <tr>
            <th>班长</th>
            <th>高大盘率</th>
            ${weekRows.map((item) => `<th>${item.weekShortLabel || item.weekLabel}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${yRows.map((row) => `
            <tr>
              <td title="${`${row.className}｜${row.smallGroupName}｜${row.groupName}`.replace(/"/g, "&quot;")}">
                <div class="leader-week-row-label">${row.className}</div>
              </td>
              <td class="${Number.isFinite(row.highBenchmarkRate) && row.highBenchmarkRate >= 0.5 ? "td-good" : "td-bad"}">${formatPct(row.highBenchmarkRate)}</td>
              ${row.cells.map((cell) => {
                if (!cell || !Number.isFinite(cell.addRevenue)) {
                  return `<td class="leader-week-matrix-empty">-</td>`
                }
                const tone = Number.isFinite(cell.benchmark)
                  ? (cell.addRevenue >= cell.benchmark ? "good" : "bad")
                  : "neutral"
                return `
                  <td>
                    <div class="leader-week-card ${tone}">
                      <div class="leader-week-value">${formatMoney(cell.addRevenue)}</div>
                      <div class="leader-week-delta">${formatSignedMoney(cell.diff)}</div>
                    </div>
                  </td>
                `
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `
  }

  function renderClassRoiScatter(classes) {
    const grouped = Array.from(groupBy(classes, (item) => item.smallGroupName || "未知小组").entries()).sort((a, b) => a[0].localeCompare(b[0], "zh-CN"))
    const traces = grouped.map(([smallGroupName, items]) => {
      const ordered = items.slice().sort((a, b) => (b.metrics.roi || 0) - (a.metrics.roi || 0))
      return {
        type: "scatter",
        mode: "markers",
        name: smallGroupName,
        x: ordered.map((item) => item.className || "未知班级"),
        y: ordered.map((item) => item.metrics.roi),
        marker: { size: 9, opacity: 0.88 },
        customdata: ordered.map((item) => [item.groupName, item.smallGroupName, item.campId, classTier(item)]),
        hovertemplate: "班级: %{x}<br>ROI: %{y:.2f}<br>大组: %{customdata[0]}<br>小组: %{customdata[1]}<br>营期: %{customdata[2]}<br>分层: %{customdata[3]}<extra></extra>"
      }
    }).filter((trace) => trace.y.some((value) => Number.isFinite(value)))
    Plotly.newPlot(dom.classRoiScatter, traces, baseLayout({
      margin: { l: 54, r: 16, t: 20, b: 120 },
      xaxis: { tickangle: -45, automargin: true, color: PLOT_MUTED, gridcolor: PLOT_GRID_LIGHT, zerolinecolor: PLOT_GRID_LIGHT },
      yaxis: { title: "ROI", color: PLOT_MUTED, gridcolor: PLOT_GRID, rangemode: "tozero" }
    }), plotConfig)
  }

  function renderClassTierCharts(classes) {
    renderClassTierDonut(classes)
    renderLeaderTierStackedChart(dom.classTierGroupChart, buildLeaderTierRows(classes, "group"))
    renderLeaderTierStackedChart(dom.classTierSmallGroupChart, buildLeaderTierRows(classes, "smallGroup"))
  }

  function renderClassTypeCharts(classes) {
    renderClassTypeDonut(classes)
    renderLeaderTypeStackedChart(dom.classTypeGroupChart, buildLeaderTypeRows(classes, "group"))
    renderLeaderTypeStackedChart(dom.classTypeSmallGroupChart, buildLeaderTypeRows(classes, "smallGroup"))
  }

  function renderEntityTrendChart(rows, spec) {
    const grouped = Array.from(groupBy(rows, (item) => item.entityName).entries()).sort((a, b) => a[0].localeCompare(b[0], "zh-CN"))
    const traces = grouped.map(([groupName, items]) => {
      const ordered = items.slice().sort((a, b) => {
        const timeA = a.periodStartDate?.getTime()
        const timeB = b.periodStartDate?.getTime()
        if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) return timeA - timeB
        if (Number.isFinite(timeA) !== Number.isFinite(timeB)) return Number.isFinite(timeA) ? -1 : 1
        return String(a.periodKey || "").localeCompare(String(b.periodKey || ""), "zh-CN", { numeric: true })
      })
      return {
        type: "scatter",
        mode: "lines+markers",
        name: groupName,
        x: ordered.map((item) => item.periodLabel),
        y: ordered.map((item) => spec.value(item))
      }
    }).filter((trace) => trace.y.some((item) => Number.isFinite(item)))
    Plotly.newPlot(spec.chartId, withValueLabels(traces, spec.tickformat ? formatChartPercent : formatChartNumber), baseLayout({
      margin: { l: 46, r: 16, t: 24, b: 56 },
      xaxis: fullCategoryAxis(rows.map((item) => item.periodLabel)),
      yaxis: { title: spec.label, tickformat: spec.tickformat || undefined, color: PLOT_MUTED, gridcolor: PLOT_GRID, rangemode: "tozero" }
    }), plotConfig)
  }

  function ensureEntityFocus(compareRows, focusStateKey) {
    const entityKeys = compareRows.map((item) => item.key)
    if (!entityKeys.length) {
      state.ui[focusStateKey] = null
      return null
    }
    if (!entityKeys.includes(state.ui[focusStateKey])) state.ui[focusStateKey] = entityKeys[0]
    return state.ui[focusStateKey]
  }

  function ensureMultiEntityFocus(compareRows, stateKey, fallbackKey = null) {
    const entityKeys = compareRows.map((item) => item.key)
    if (!entityKeys.length) {
      state.ui[stateKey] = []
      return []
    }
    const current = Array.isArray(state.ui[stateKey]) ? state.ui[stateKey].filter((key) => entityKeys.includes(key)) : []
    if (!current.length) {
      state.ui[stateKey] = [fallbackKey && entityKeys.includes(fallbackKey) ? fallbackKey : entityKeys[0]]
    } else {
      state.ui[stateKey] = current
    }
    return state.ui[stateKey]
  }

  function ensureMultiCampSelection(items, stateKey) {
    const campIds = uniq(items.map((item) => String(item.campId || "").trim()).filter(Boolean))
      .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }))
    if (!campIds.length) {
      state.ui[stateKey] = []
      return []
    }
    if (state.ui[`${stateKey}ManuallyCleared`]) {
      state.ui[stateKey] = []
      return []
    }
    const current = Array.isArray(state.ui[stateKey]) ? state.ui[stateKey].filter((id) => campIds.includes(id)) : []
    state.ui[stateKey] = current.length ? current : campIds.slice()
    return state.ui[stateKey]
  }

  function buildEntityByDayCompareItems(items, compareRows, kind, selectedCampIds) {
    const selectedSet = new Set(selectedCampIds || [])
    return compareRows.map((row) => {
      const bucket = items.filter((item) => entityKey(kind, item) === row.key && (!selectedSet.size || selectedSet.has(String(item.campId || "").trim())))
      if (!bucket.length) return null
      return buildSnapshotAggregateItem(bucket, row.entityName, row.key)
    }).filter(Boolean)
  }

  function buildCampRhythmItems(camps, dimension = "camp") {
    if (dimension === "project") {
      return Array.from(groupBy(camps, (item) => normalizeProjectName(item.projectName) || "默认项目").entries())
        .map(([projectName, bucket]) => {
          const aggregate = buildSnapshotAggregateItem(bucket, projectName, projectName)
          return aggregate ? {
            ...aggregate,
            projectName,
            dimensionKey: `project__${projectName}`,
            dimensionLabel: projectName,
            seriesName: projectName
          } : null
        })
        .filter(Boolean)
        .sort((a, b) => String(a.projectName || "").localeCompare(String(b.projectName || ""), "zh-CN"))
    }
    if (dimension === "month") {
      return Array.from(groupBy(camps, (item) => item.month || "未知月份").entries())
        .map(([month, bucket]) => {
          const aggregate = buildSnapshotAggregateItem(bucket, month, month)
          const monthLabel = /月$/.test(String(month || "")) ? String(month) : `${month}月`
          return aggregate ? {
            ...aggregate,
            month,
            dimensionKey: `month__${month}`,
            dimensionLabel: monthLabel,
            seriesName: monthLabel
          } : null
        })
        .filter(Boolean)
        .sort((a, b) => String(a.month || "").localeCompare(String(b.month || ""), "zh-CN", { numeric: true }))
    }
    if (dimension === "week") {
      return Array.from(groupBy(camps, (item) => item.weekKey || "未知周").entries())
        .map(([weekKey, bucket]) => {
          const aggregate = buildSnapshotAggregateItem(bucket, weekKey, weekKey)
          const base = bucket[0] || {}
          const weekLabel = base.weekShortLabel || base.weekLabel || weekKey
          return aggregate ? {
            ...aggregate,
            weekKey,
            weekLabel: base.weekLabel || weekKey,
            weekShortLabel: weekLabel,
            weekStartDate: base.weekStartDate || null,
            dimensionKey: `week__${weekKey}`,
            dimensionLabel: weekLabel,
            seriesName: weekLabel
          } : null
        })
        .filter(Boolean)
        .sort((a, b) => (a.weekStartDate?.getTime() || 0) - (b.weekStartDate?.getTime() || 0))
    }
    return camps.slice().sort(compareStart).map((item) => ({
      ...item,
      dimensionKey: `camp__${String(item.campId || "")}`,
      dimensionLabel: String(item.campId || ""),
      seriesName: String(item.campId || "")
    }))
  }

  function campViewDimensionText(dimension) {
    if (dimension === "project") return "项目"
    if (dimension === "month") return "月"
    if (dimension === "week") return "周"
    return "营期"
  }

  function campViewBucketFromRow(row, meta, dimension) {
    if (dimension === "project") {
      const projectName = normalizeProjectName(row[meta.projectField]) || "默认项目"
      return {
        key: `project__${projectName}`,
        label: projectName,
        sortValue: projectName
      }
    }
    if (dimension === "month") {
      const month = normalizeMonth(row[meta.monthFieldClass], row._营期月份)
      return {
        key: `month__${month ?? "unknown"}`,
        label: month === null || month === undefined ? "未知月份" : `${month}月`,
        sortValue: Number.isFinite(month) ? month : Infinity
      }
    }
    if (dimension === "week") {
      const weekKey = rowWeekKey(row, meta) || "unknown"
      const week = weekInfo(parseStartDate(row?.[meta.startField]))
      return {
        key: `week__${weekKey}`,
        label: rowWeekLabel(row, meta) || weekKey,
        sortValue: week?.startDate?.getTime() || Infinity
      }
    }
    const campId = String(row[meta.campField] || "").trim() || "未知营期"
    const startDate = parseStartDate(row[meta.startField])
    return {
      key: `camp__${campId}`,
      label: campId,
      sortValue: startDate?.getTime() || Infinity
    }
  }

  function buildCampNodeMetricData(rows, dimension, level, label, labels = {}) {
    const meta = currentMeta()
    const bucketInfo = rows.length ? campViewBucketFromRow(rows[0], meta, dimension) : { key: "", label, sortValue: Infinity }
    const snapshot = buildDrillSnapshot(rows, labels, {
      type: level === "dimension" ? "camp" : level,
      campId: level === "dimension" && dimension === "camp" ? label : (labels.campId || label),
      projectName: level === "dimension" && dimension === "project"
        ? normalizeProjectName(rows[0]?.[meta.projectField])
        : (labels.projectName || null),
      month: level === "dimension" && dimension === "month"
        ? normalizeMonth(rows[0]?.[meta.monthFieldClass], rows[0]?._营期月份)
        : null
    })
    const orderCounts = [3, 4, 5, 6, 7].map((day) => firstMetric(snapshot.raw, snapshot.supplement, [`day${day}单数`]) ?? 0)
    return {
      snapshot,
      bucketInfo,
      orderCounts,
      warmGroupIn: normalizeRateLikeValue(firstMetric(snapshot.raw, snapshot.supplement, ["保温进群"])),
      warmAttend: normalizeRateLikeValue(firstMetric(snapshot.raw, snapshot.supplement, ["保温到播"])),
      warmBlacklist: normalizeRateLikeValue(firstMetric(snapshot.raw, snapshot.supplement, ["保温拉黑"])),
      day0Speak: normalizeRateLikeValue(firstMetric(snapshot.raw, snapshot.supplement, ["day0发言"])),
      highImmerseRate: normalizeRateLikeValue(firstMetric(snapshot.raw, snapshot.supplement, ["高沉浸率"])),
      highImmerseConvRate: normalizeRateLikeValue(firstMetric(snapshot.raw, snapshot.supplement, ["高沉浸转率"])),
      avgOutputPerLeader: ratio(snapshot.metrics.revenue, snapshot.metrics.leaderCount)
    }
  }

  function campOverviewLeaderName(row, meta = currentMeta()) {
    return String(row?.[meta.leaderField] || row?.[meta.classField] || row?._标准班长 || "未知班长").trim() || "未知班长"
  }

  function campOverviewClassName(row, meta = currentMeta()) {
    return String(row?._原始班级 || row?.[meta.classNameField] || row?._标准班级 || row?.[meta.classField] || "未知班级").trim() || "未知班级"
  }

  function campOverviewNodeCanExpand(node) {
    if (node.level === "dimension" || node.level === "group" || node.level === "smallGroup") return true
    if (node.level !== "class") return false
    const meta = currentMeta()
    const classNames = uniq(node.rows.map((row) => campOverviewClassName(row, meta)).filter(Boolean))
    return classNames.length >= 2
  }

  function buildCampOverviewChildren(node, dimension) {
    const meta = currentMeta()
    if (node.level === "dimension") {
      return Array.from(groupBy(node.rows, (row) => String(row[meta.groupField] || "未知大组").trim() || "未知大组").entries())
        .map(([groupName, bucket]) => {
          const info = buildCampNodeMetricData(bucket, dimension, "group", groupName, { groupName })
          return {
            key: `${node.key}__group__${groupName}`,
            parentKey: node.key,
            level: "group",
            label: groupName,
            rows: bucket,
            groupName,
            depth: 1,
            ...info
          }
        })
        .sort((a, b) => (b.snapshot.metrics.roi || -Infinity) - (a.snapshot.metrics.roi || -Infinity) || a.label.localeCompare(b.label, "zh-CN"))
    }
    if (node.level === "group") {
      return Array.from(groupBy(node.rows, (row) => String(row[meta.smallGroupField] || "未知小组").trim() || "未知小组").entries())
        .map(([smallGroupName, bucket]) => {
          const info = buildCampNodeMetricData(bucket, dimension, "smallGroup", smallGroupName, { groupName: node.groupName, smallGroupName })
          return {
            key: `${node.key}__small__${smallGroupName}`,
            parentKey: node.key,
            level: "smallGroup",
            label: smallGroupName,
            rows: bucket,
            groupName: node.groupName,
            smallGroupName,
            depth: 2,
            ...info
          }
        })
        .sort((a, b) => (b.snapshot.metrics.roi || -Infinity) - (a.snapshot.metrics.roi || -Infinity) || a.label.localeCompare(b.label, "zh-CN"))
    }
    if (node.level === "smallGroup") {
      return Array.from(groupBy(node.rows, (row) => campOverviewLeaderName(row, meta)).entries())
        .map(([leaderName, bucket]) => {
          const info = buildCampNodeMetricData(bucket, dimension, "class", leaderName, { groupName: node.groupName, smallGroupName: node.smallGroupName, className: leaderName })
          return {
            key: `${node.key}__class__${leaderName}`,
            parentKey: node.key,
            level: "class",
            label: leaderName,
            rows: bucket,
            groupName: node.groupName,
            smallGroupName: node.smallGroupName,
            className: leaderName,
            depth: 3,
            ...info
          }
        })
        .sort((a, b) => (b.snapshot.metrics.roi || -Infinity) - (a.snapshot.metrics.roi || -Infinity) || a.label.localeCompare(b.label, "zh-CN"))
    }
    if (node.level === "class") {
      const classBuckets = Array.from(groupBy(node.rows, (row) => campOverviewClassName(row, meta)).entries())
        .filter(([className]) => !!String(className || "").trim())
      if (classBuckets.length < 2) return []
      return classBuckets
        .map(([classDetailName, bucket]) => {
          const info = buildCampNodeMetricData(bucket, dimension, "classDetail", classDetailName, {
            groupName: node.groupName,
            smallGroupName: node.smallGroupName,
            className: classDetailName
          })
          return {
            key: `${node.key}__class-detail__${classDetailName}`,
            parentKey: node.key,
            level: "classDetail",
            label: classDetailName,
            rows: bucket,
            groupName: node.groupName,
            smallGroupName: node.smallGroupName,
            className: node.className,
            classDetailName,
            depth: 4,
            ...info
          }
        })
        .sort((a, b) => (b.snapshot.metrics.roi || -Infinity) - (a.snapshot.metrics.roi || -Infinity) || a.label.localeCompare(b.label, "zh-CN"))
    }
    return []
  }

  function buildCampOverviewFlatRows(scopedRows, dimension, expandedKeys) {
    const meta = currentMeta()
    const roots = Array.from(groupBy(scopedRows, (row) => campViewBucketFromRow(row, meta, dimension).key).entries())
      .map(([key, bucket]) => {
        const bucketInfo = campViewBucketFromRow(bucket[0], meta, dimension)
        const info = buildCampNodeMetricData(bucket, dimension, "dimension", bucketInfo.label, {})
        return {
          key,
          parentKey: null,
          level: "dimension",
          label: bucketInfo.label,
          rows: bucket,
          depth: 0,
          ...info
        }
      })
      .sort((a, b) => compareOverviewBucket(a.bucketInfo, b.bucketInfo))
    const expanded = new Set(expandedKeys || [])
    const flattened = []
    const walk = (nodes) => {
      nodes.forEach((node) => {
        const hasChildren = campOverviewNodeCanExpand(node)
        flattened.push({ ...node, hasChildren, expanded: hasChildren && expanded.has(node.key) })
        if (hasChildren && expanded.has(node.key)) walk(buildCampOverviewChildren(node, dimension))
      })
    }
    walk(roots)
    return flattened
  }

  function compareOverviewBucket(a, b) {
    const av = a?.sortValue
    const bv = b?.sortValue
    if (typeof av === "number" && typeof bv === "number") return av - bv
    return String(a?.label || "").localeCompare(String(b?.label || ""), "zh-CN", { numeric: true })
  }

  function dataBarCell(value, formatter, maxValue, tone = "blue") {
    if (!Number.isFinite(value)) return "-"
    const ratioValue = maxValue > 0 ? Math.max(0.04, Math.min(1, value / maxValue)) : 0
    return `
      <div class="data-bar-cell ${tone}">
        <span class="data-bar-fill" style="width:${(ratioValue * 100).toFixed(1)}%"></span>
        <span class="data-bar-text">${formatter(value)}</span>
      </div>
    `
  }

  function roiTagCell(value) {
    if (!Number.isFinite(value)) return "-"
    const cls = value >= 0.8 ? "td-good" : value >= 0.5 ? "td-warn" : "td-bad"
    return `<span class="metric-pill ${cls}">${formatNum(value, 2)}</span>`
  }

  function orderRhythmCell(values) {
    const total = sum(values)
    if (!Number.isFinite(total) || total <= 0) return "-"
    const palette = ["#22c55e", "#84cc16", "#facc15", "#fb923c", "#ef4444"]
    return `
      <div class="order-rhythm-stack">
        ${values.map((value, index) => {
          const width = total > 0 ? (Math.max(0, value || 0) / total) * 100 : 0
          return `<span class="order-rhythm-segment" style="width:${width.toFixed(2)}%;background:${palette[index]}">${Number.isFinite(value) ? Math.round(value) : 0}</span>`
        }).join("")}
      </div>
    `
  }

  function treeLabelCell(node, dimension) {
    const expandedIcon = node.hasChildren ? (node.expanded ? "▾" : "▸") : "•"
    return `
      <button class="tree-toggle-btn level-${node.level} ${node.hasChildren ? "" : "leaf"}" type="button" data-action="camp-tree-toggle" data-key="${node.key}">
        <span class="tree-toggle-icon">${expandedIcon}</span>
        <span class="tree-depth" style="width:${node.depth * 10}px"></span>
        <span class="tree-label-text">${node.label}</span>
      </button>
    `
  }

  function renderCampOverviewTreeTable(host, rows, dimension, warmMode = false) {
    if (!host) return
    const visible = rows.slice()
    if (!visible.length) {
      host.innerHTML = `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
      return
    }
    const maxMap = {
      personEfficiency: max(visible.map((item) => item.snapshot.metrics.personEfficiency)),
      convRate: max(visible.map((item) => item.snapshot.metrics.convRate)),
      individualShare: max(visible.map((item) => item.snapshot.metrics.individualShare)),
      pendingRate: max(visible.map((item) => item.snapshot.metrics.pendingRate)),
      pendingConv: max(visible.map((item) => item.snapshot.metrics.pendingConv)),
      avgOutputPerLeader: max(visible.map((item) => item.avgOutputPerLeader)),
      highImmerseRate: max(visible.map((item) => item.highImmerseRate)),
      highImmerseConvRate: max(visible.map((item) => item.highImmerseConvRate)),
      warmGroupIn: max(visible.map((item) => item.warmGroupIn)),
      warmAttend: max(visible.map((item) => item.warmAttend)),
      warmBlacklist: max(visible.map((item) => item.warmBlacklist)),
      day0Speak: max(visible.map((item) => item.day0Speak))
    }
    const headers = warmMode
      ? ["层级", "ROI", "保温进群", "保温到播", "保温拉黑", "day0发言", "高沉浸率", "高沉浸转率"]
      : [campViewDimensionText(dimension), "ROI", "转率", "添加成本", "添加产值", "人均产能", "个销占比", "待支付率", "待支付转率", "出单节奏", "客单价", "人效", "单号承载", "高沉浸率", "高沉浸转率", "营期数", "总流水", "总转化人数", "升班率", "添加人数"]
    host.innerHTML = `
      <table class="tree-table">
        <thead>
          <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${visible.map((node) => {
            if (warmMode) {
              return `
                <tr class="tree-row level-${node.level}">
                  <td>${treeLabelCell(node, dimension)}</td>
                  <td>${roiTagCell(node.snapshot.metrics.roi)}</td>
                  <td>${dataBarCell(node.warmGroupIn, formatPct, maxMap.warmGroupIn, "blue")}</td>
                  <td>${dataBarCell(node.warmAttend, formatPct, maxMap.warmAttend, "teal")}</td>
                  <td>${dataBarCell(node.warmBlacklist, formatPct, maxMap.warmBlacklist, "orange")}</td>
                  <td>${dataBarCell(node.day0Speak, formatPct, maxMap.day0Speak, "cyan")}</td>
                  <td>${dataBarCell(node.highImmerseRate, formatPct, maxMap.highImmerseRate, "gold")}</td>
                  <td>${dataBarCell(node.highImmerseConvRate, formatPct, maxMap.highImmerseConvRate, "green")}</td>
                </tr>
              `
            }
            return `
              <tr class="tree-row level-${node.level}">
                <td>${treeLabelCell(node, dimension)}</td>
                <td>${roiTagCell(node.snapshot.metrics.roi)}</td>
                <td>${dataBarCell(node.snapshot.metrics.convRate, formatPct, maxMap.convRate, "blue")}</td>
                <td>${formatMoney(node.snapshot.metrics.addCost)}</td>
                <td>${formatMoney(node.snapshot.metrics.addRevenue)}</td>
                <td>${dataBarCell(node.avgOutputPerLeader, formatMoney, maxMap.avgOutputPerLeader, "teal")}</td>
                <td>${dataBarCell(node.snapshot.metrics.individualShare, formatPct, maxMap.individualShare, "orange")}</td>
                <td>${dataBarCell(node.snapshot.metrics.pendingRate, formatPct, maxMap.pendingRate, "purple")}</td>
                <td>${dataBarCell(node.snapshot.metrics.pendingConv, formatPct, maxMap.pendingConv, "cyan")}</td>
                <td>${orderRhythmCell(node.orderCounts)}</td>
                <td>${formatMoney(node.snapshot.metrics.aov)}</td>
                <td>${dataBarCell(node.snapshot.metrics.personEfficiency, (value) => formatNum(value, 0), maxMap.personEfficiency, "green")}</td>
                <td>${Number.isFinite(node.snapshot.metrics.machineLoad) ? formatNum(node.snapshot.metrics.machineLoad, 0) : "-"}</td>
                <td>${dataBarCell(node.highImmerseRate, formatPct, maxMap.highImmerseRate, "gold")}</td>
                <td>${dataBarCell(node.highImmerseConvRate, formatPct, maxMap.highImmerseConvRate, "green")}</td>
                <td>${Number.isFinite(node.snapshot.coveredCampCount) ? Math.round(node.snapshot.coveredCampCount) : "-"}</td>
                <td>${formatMoney(node.snapshot.metrics.revenue)}</td>
                <td>${Number.isFinite(node.snapshot.metrics.conv) ? Math.round(node.snapshot.metrics.conv) : "-"}</td>
                <td>${formatPct(node.snapshot.metrics.upgradeRate)}</td>
                <td>${Number.isFinite(node.snapshot.metrics.adds) ? Math.round(node.snapshot.metrics.adds) : "-"}</td>
              </tr>
            `
          }).join("")}
        </tbody>
      </table>
    `
  }

  function seriesColor(index) {
    const palette = ["#2563eb", "#059669", "#f59e0b", "#dc2626", "#7c3aed", "#0f766e", "#ea580c", "#db2777"]
    return palette[index % palette.length]
  }

  function renderEntityFocusCards(items, compareRows, kind) {
    const config = ENTITY_ANALYSIS_CONFIG[kind]
    const activeKey = ensureEntityFocus(compareRows, config.focusStateKey)
    const quickSwitchOptions = compareRows.map((item) => ({ label: item.entityName, value: item.key }))
    const byDayCampStateKey = kind === "group" ? "groupByDayCamps" : "smallGroupByDayCamps"
    const activeByDayCamps = ensureMultiCampSelection(items, byDayCampStateKey)
    const byDayCampOptions = uniq(items.map((item) => String(item.campId || "").trim()).filter(Boolean))
      .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }))
      .map((campId) => ({ label: campId, value: campId }))
    if (kind === "group") {
      const activeKeys = ensureMultiEntityFocus(compareRows, "groupFocusCompare", activeKey)
      renderMultiQuickSwitch(config.focusChaseSwitch, quickSwitchOptions, activeKeys, { action: `${kind}-focus-compare-toggle` })
      renderMultiQuickSwitch(config.focusByDaySwitch, byDayCampOptions, activeByDayCamps, { action: `${kind}-byday-camp-toggle` })
      const focusGroups = activeKeys.map((key) => ({
        key,
        name: compareRows.find((item) => item.key === key)?.entityName || key,
        items: items.filter((item) => entityKey(kind, item) === key).sort(compareStart)
      })).filter((item) => item.items.length)
      const focusCampIds = uniq(focusGroups.flatMap((group) => group.items.map((item) => String(item.campId || ""))))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }))
      const day3PendingTraces = focusGroups.map((group, index) => ({
        type: "scatter",
        mode: "lines+markers",
        name: group.name,
        x: group.items.map((item) => item.campId),
        y: group.items.map((item) => firstMetric(item.raw, item.supplement, ["day3待支付率", "待支付率"])),
        line: { color: seriesColor(index), width: 2 },
        marker: { color: seriesColor(index), size: 7 }
      }))
      Plotly.newPlot(config.focusChartIds.day3Pending, withValueLabels(day3PendingTraces, formatChartPercent), baseLayout({
        margin: { l: 50, r: 14, t: 24, b: 56 },
        showlegend: true,
        xaxis: fullCategoryAxis(focusCampIds),
        yaxis: { title: "待支付率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID }
      }), plotConfig)

      const day3ComboTraces = focusGroups.flatMap((group, index) => {
        const color = seriesColor(index)
        return [{
          type: "scatter",
          mode: "lines+markers",
          name: `${group.name} 转率`,
          x: group.items.map((item) => item.campId),
          y: group.items.map((item) => firstMetric(item.raw, item.supplement, ["day3转率"])),
          line: { color, width: 2 },
          marker: { color, size: 7 }
        }, {
          type: "scatter",
          mode: "lines+markers",
          name: `${group.name} 出单占比`,
          x: group.items.map((item) => item.campId),
          y: group.items.map((item) => orderShare(item, 3)),
          yaxis: "y2",
          line: { color, width: 2, dash: "dash" },
          marker: { color, size: 7, symbol: "diamond" }
        }]
      })
      Plotly.newPlot(config.focusChartIds.day3ConvChase, withValueLabels(day3ComboTraces, formatChartPercent), baseLayout({
        margin: { l: 50, r: 42, t: 24, b: 56 },
        showlegend: true,
        xaxis: fullCategoryAxis(focusCampIds),
        yaxis: { title: "Day3 转率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID },
        yaxis2: { title: "出单占比", tickformat: ".1%", overlaying: "y", side: "right", color: PLOT_MUTED }
      }), plotConfig)

      const d67ComboTraces = focusGroups.flatMap((group, index) => {
        const color = seriesColor(index)
        return [{
          type: "scatter",
          mode: "lines+markers",
          name: `${group.name} 转率合计`,
          x: group.items.map((item) => item.campId),
          y: group.items.map((item) => sum([6, 7].map((day) => firstMetric(item.raw, item.supplement, [`day${day}转率`])))),
          line: { color, width: 2 },
          marker: { color, size: 7 }
        }, {
          type: "scatter",
          mode: "lines+markers",
          name: `${group.name} 出单占比合计`,
          x: group.items.map((item) => item.campId),
          y: group.items.map((item) => sum([6, 7].map((day) => orderShare(item, day)))),
          yaxis: "y2",
          line: { color, width: 2, dash: "dash" },
          marker: { color, size: 7, symbol: "diamond" }
        }]
      })
      Plotly.newPlot(config.focusChartIds.d6d7ConvChase, withValueLabels(d67ComboTraces, formatChartPercent), baseLayout({
        margin: { l: 50, r: 42, t: 24, b: 56 },
        showlegend: true,
        xaxis: fullCategoryAxis(focusCampIds),
        yaxis: { title: "D6-D7 转率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID },
        yaxis2: { title: "出单占比", tickformat: ".1%", overlaying: "y", side: "right", color: PLOT_MUTED }
      }), plotConfig)
      const byDayItems = buildEntityByDayCompareItems(items, compareRows, kind, activeByDayCamps)
      renderByDayCharts(config.processChartsHost, byDayItems, PROCESS_SPECS, false)
      renderByDayCharts(config.conversionChartsHost, byDayItems, CONVERSION_SPECS, false)
      renderDecayCharts(config.decayChartsHost, byDayItems, DECAY_SPECS, false)
    } else {
      renderQuickSwitch(config.focusChaseSwitch, quickSwitchOptions, activeKey, { action: `${kind}-focus` })
      renderMultiQuickSwitch(config.focusByDaySwitch, byDayCampOptions, activeByDayCamps, { action: `${kind}-byday-camp-toggle` })
      const focusItems = items.filter((item) => entityKey(kind, item) === activeKey).sort(compareStart)
      const campIds = focusItems.map((item) => item.campId)
      const day3Pending = focusItems.map((item) => firstMetric(item.raw, item.supplement, ["day3待支付率", "待支付率"]))
      const day3Conv = focusItems.map((item) => firstMetric(item.raw, item.supplement, ["day3转率"]))
      const day3OrderShare = focusItems.map((item) => orderShare(item, 3))
      const d67Conv = focusItems.map((item) => sum([6, 7].map((day) => firstMetric(item.raw, item.supplement, [`day${day}转率`]))))
      const d67OrderShare = focusItems.map((item) => sum([6, 7].map((day) => orderShare(item, day))))

      Plotly.newPlot(config.focusChartIds.day3Pending, withValueLabels([{
        type: "scatter",
        mode: "lines+markers",
        name: "Day3 待支付率",
        x: campIds,
        y: day3Pending,
        line: { color: "#2563eb", width: 2 }
      }], formatChartPercent), baseLayout({
        margin: { l: 50, r: 14, t: 24, b: 56 },
        showlegend: false,
        xaxis: fullCategoryAxis(campIds),
        yaxis: { title: "待支付率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID }
      }), plotConfig)

      Plotly.newPlot(config.focusChartIds.day3ConvChase, withValueLabels([
        {
          type: "bar",
          name: "Day3 出单占比",
          x: campIds,
          y: day3OrderShare,
          yaxis: "y2",
          marker: { color: "rgba(245,158,11,0.55)" }
        },
        {
          type: "scatter",
          mode: "lines+markers",
          name: "Day3 转率",
          x: campIds,
          y: day3Conv,
          line: { color: "#059669", width: 2 }
        }
      ], formatChartPercent), baseLayout({
        margin: { l: 50, r: 42, t: 24, b: 56 },
        barmode: "group",
        xaxis: fullCategoryAxis(campIds),
        yaxis: { title: "Day3 转率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID },
        yaxis2: { title: "出单占比", tickformat: ".1%", overlaying: "y", side: "right", color: PLOT_MUTED }
      }), plotConfig)

      Plotly.newPlot(config.focusChartIds.d6d7ConvChase, withValueLabels([
        {
          type: "bar",
          name: "D6-D7 出单占比合计",
          x: campIds,
          y: d67OrderShare,
          yaxis: "y2",
          marker: { color: "rgba(249,115,22,0.50)" }
        },
        {
          type: "scatter",
          mode: "lines+markers",
          name: "D6-D7 转率合计",
          x: campIds,
          y: d67Conv,
          line: { color: "#dc2626", width: 2 }
        }
      ], formatChartPercent), baseLayout({
        margin: { l: 50, r: 42, t: 24, b: 56 },
        barmode: "group",
        xaxis: fullCategoryAxis(campIds),
        yaxis: { title: "D6-D7 转率", tickformat: ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID },
        yaxis2: { title: "出单占比", tickformat: ".1%", overlaying: "y", side: "right", color: PLOT_MUTED }
      }), plotConfig)
    }
    if (kind !== "group") {
      const byDayItems = buildEntityByDayCompareItems(items, compareRows, kind, activeByDayCamps)
      renderByDayCharts(config.processChartsHost, byDayItems, PROCESS_SPECS, false)
      renderByDayCharts(config.conversionChartsHost, byDayItems, CONVERSION_SPECS, false)
      renderDecayCharts(config.decayChartsHost, byDayItems, DECAY_SPECS, false)
    }
  }

  function renderEntitySection(items, kind, classItems = []) {
    const config = ENTITY_ANALYSIS_CONFIG[kind]
    const compareRows = buildEntityComparisonRows(items, kind, classItems)
    const trendDimension = state.ui[config.trendDimensionStateKey] || "camp"
    const trendRows = buildEntityTrendRows(items, kind, trendDimension)
    const rhythmMetric = state.ui[config.orderRhythmStateKey] || "orderShare"
    const roiBest = pickBestMetricRow(compareRows, GROUP_COMPARE_METRICS[0])
    const efficiencyBest = pickBestMetricRow(compareRows, GROUP_COMPARE_METRICS[1])
    const convBest = pickBestMetricRow(compareRows, GROUP_COMPARE_METRICS[2])
    const addRevenueBest = pickBestMetricRow(compareRows, GROUP_COMPARE_METRICS[3])

    document.getElementById(config.metricHostId).innerHTML = [
      metricCard(`${config.label}数`, compareRows.length, `${items.length} 个营期-${config.label}对象`, "当前筛选范围", "good"),
      metricCard(`ROI 最优${config.label}`, roiBest?.entityName || "-", roiBest ? `ROI ${GROUP_COMPARE_METRICS[0].formatter(roiBest.roi)}` : "暂无数据", roiBest ? "领先" : "-", roiBest ? "good" : "warn"),
      metricCard(`人效最优${config.label}`, efficiencyBest?.entityName || "-", efficiencyBest ? `人效 ${GROUP_COMPARE_METRICS[1].formatter(efficiencyBest.personEfficiency)}` : "暂无数据", efficiencyBest ? "领先" : "-", efficiencyBest ? "good" : "warn"),
      metricCard(`转率最优${config.label}`, convBest?.entityName || "-", convBest ? `转率 ${GROUP_COMPARE_METRICS[2].formatter(convBest.convRate)}` : "暂无数据", convBest ? "领先" : "-", convBest ? "good" : "warn"),
      metricCard(`添加产值最优${config.label}`, addRevenueBest?.entityName || "-", addRevenueBest ? `添加产值 ${GROUP_COMPARE_METRICS[3].formatter(addRevenueBest.addRevenue)}` : "暂无数据", addRevenueBest ? "领先" : "-", addRevenueBest ? "good" : "warn")
    ].join("")

    renderEntityComparisonHeatmap(compareRows, config.heatmapId)
    renderQuickSwitch(config.orderRhythmSwitch, [
      { label: "出单占比", value: "orderShare" },
      { label: "转率", value: "convRate" }
    ], rhythmMetric, { action: `${kind}-rhythm-metric` })
    renderEntityOrderRhythmHeatmap(compareRows, config.orderRhythmHeatmapId, rhythmMetric)

    renderEntityFocusCards(items, compareRows, kind)
    renderQuickSwitch(config.trendDimensionSwitch, [
      { label: "营期维度", value: "camp" },
      { label: "周维度", value: "week" }
    ], trendDimension, { action: `${kind}-trend-dimension` })
    config.trendSpecs.forEach((spec) => renderEntityTrendChart(trendRows, spec))
    renderTable(document.getElementById(config.trendTableId), [
      trendDimension === "week" ? "周维度" : "营期",
      ...(kind === "smallGroup" ? ["大组"] : []),
      config.label,
      ...GROUP_COMPARE_METRICS.map((item) => item.label)
    ], trendRows.map((item) => [
      trendDimension === "week" ? item.periodFullLabel : item.periodLabel,
      ...(kind === "smallGroup" ? [item.groupName] : []),
      item.entityName,
      ...GROUP_COMPARE_METRICS.map((spec) => spec.formatter(spec.value(item)))
    ]))
    if (kind === "smallGroup") renderSmallGroupRadarComparison(compareRows)
  }

  function normalizedMetricScore(value, values, better = "high") {
    const valid = values.filter((item) => Number.isFinite(item))
    if (!Number.isFinite(value) || !valid.length) return null
    const maxValue = Math.max(...valid)
    if (maxValue <= 0) return 0
    return Math.max(0, Math.min(1, value / maxValue))
  }

  function renderSmallGroupRadarComparison(rows) {
    if (!dom.smallGroupRadarChart || !dom.smallGroupRadarTable) return
    if (!rows.length) {
      dom.smallGroupRadarChart.innerHTML = ""
      dom.smallGroupRadarTable.innerHTML = `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
      return
    }
    const indicators = SMALL_GROUP_RADAR_METRICS.map((item) => item.label)
    const traces = rows.map((item) => {
      const scores = SMALL_GROUP_RADAR_METRICS.map((metric) => normalizedMetricScore(
        metric.value(item),
        rows.map((row) => metric.value(row)),
        metric.better
      ))
      return {
        type: "scatterpolar",
        mode: "lines+markers",
        name: item.entityName,
        r: [...scores, scores[0]].map((value) => Number.isFinite(value) ? value : 0),
        theta: [...indicators, indicators[0]],
        fill: "none",
        opacity: 1,
        line: { width: 2 },
        marker: { size: 5 }
      }
    })
    Plotly.newPlot(dom.smallGroupRadarChart, traces, {
      margin: { l: 30, r: 30, t: 16, b: 20 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      legend: { orientation: "h", y: -0.12, x: 0, font: { size: 11, color: PLOT_MUTED } },
      polar: {
        bgcolor: "rgba(0,0,0,0)",
        radialaxis: {
          range: [0, 1],
          tickvals: [0.25, 0.5, 0.75, 1],
          ticktext: ["25", "50", "75", "100"],
          color: PLOT_MUTED,
          gridcolor: PLOT_GRID
        },
        angularaxis: {
          color: PLOT_MUTED,
          gridcolor: PLOT_GRID_LIGHT
        }
      }
    }, plotConfig)

    renderTable(dom.smallGroupRadarTable, [
      "大组",
      "小组",
      ...SMALL_GROUP_RADAR_METRICS.map((item) => item.label)
    ], rows.map((item) => [
      item.groupName || "未知大组",
      item.entityName,
      ...SMALL_GROUP_RADAR_METRICS.map((metric) => metric.formatter(metric.value(item)))
    ]))
  }

  function renderGroupSection(groups, classes = []) {
    renderEntitySection(groups, "group", classes)
  }

  function renderSmallGroupSection(smallGroups, classes = []) {
    renderEntitySection(smallGroups, "smallGroup", classes)
  }

  function renderClassSection(classes) {
    const rankedClasses = classes.slice().sort((a, b) => (b.metrics.roi || 0) - (a.metrics.roi || 0))
    const leaderRows = aggregateLeaderRows(rankedClasses).sort((a, b) => (b.roi || 0) - (a.roi || 0))
    const headCount = leaderRows.filter((item) => roiTier(item.roi) === "头部").length
    const midCount = leaderRows.filter((item) => roiTier(item.roi) === "中部").length
    const tailCount = leaderRows.filter((item) => roiTier(item.roi) === "尾部").length
    const bestClass = leaderRows[0]
    dom.classMetrics.innerHTML = [
      metricCard("班长数", leaderRows.length, "按班长聚合口径", `${uniq(rankedClasses.map((item) => item.campId)).length} 个营期`, "good"),
      metricCard("头部班长", headCount, "ROI >= 0.8", formatPct(ratio(headCount, leaderRows.length)), headCount ? "good" : "warn"),
      metricCard("中部班长", midCount, "0.5 <= ROI < 0.8", formatPct(ratio(midCount, leaderRows.length)), "当前结构", "warn"),
      metricCard("尾部班长", tailCount, "ROI < 0.5", formatPct(ratio(tailCount, leaderRows.length)), tailCount ? "需关注" : "稳定", tailCount ? "bad" : "good"),
      metricCard("ROI 最优班长", bestClass?.className || "-", bestClass ? `ROI ${formatNum(bestClass.roi, 2)}` : "暂无数据", bestClass ? `${bestClass.smallGroupName}` : "-", bestClass ? "good" : "warn")
    ].join("")

    renderClassRoiScatter(rankedClasses)
    renderClassWeeklyRoiHeatmap(rankedClasses)
    renderClassWeeklyAddRevenueTable(rankedClasses)
    renderClassTierCharts(rankedClasses)
    renderClassTierCompareSection(rankedClasses)
    renderClassTypeCharts(rankedClasses)
    renderClassTypeCompareSection(rankedClasses)
    renderClassFormatCharts(rankedClasses)
    renderClassFormatCompareSection(rankedClasses)
    renderClassByDaySection(rankedClasses)
    renderClassCompareByDaySection(rankedClasses)
    const detailRows = buildClassDetailRows(rankedClasses)
    const keywords = splitBatchSearchKeywords(state.ui.classTableSearch)
    const filteredDetailRows = detailRows.filter((item) => classTableSearchMatch(item, keywords))
    const activeSort = /^(roi|conv|camp)(Asc|Desc)$/.test(state.ui.classTableSort) ? state.ui.classTableSort : "roiDesc"
    state.ui.classTableSort = activeSort
    if (dom.classTableSearchInput && dom.classTableSearchInput.value !== state.ui.classTableSearch) {
      dom.classTableSearchInput.value = state.ui.classTableSearch
    }
    renderClassDetailTable(sortClassDetailRows(filteredDetailRows, activeSort), activeSort)
  }

  function renderQuality(scopedRows, camps, groups, smallGroups, classes) {
    const quality = buildQualityReport(scopedRows, scopedRows, camps, groups, smallGroups, classes, state.model.meta)
    dom.qualityMetrics.innerHTML = [
      metricCard("班级原始行数", quality.classRows, "导入文件", `${quality.unifiedRows} 条统一底表记录`, "good"),
      metricCard("营期对象数", quality.totalCamps, "由班级明细聚合", `${quality.totalGroups} 个大组对象`, "good"),
      metricCard("开营时间解析成功", `${quality.parsedStartDates}/${quality.totalCamps}`, "营期状态基础", quality.parsedStartDates === quality.totalCamps ? "通过" : "需关注", quality.parsedStartDates === quality.totalCamps ? "good" : "warn"),
      metricCard("大组空值行", quality.missingGroupRows, "班级明细", quality.missingGroupRows ? "需检查" : "正常", quality.missingGroupRows ? "warn" : "good"),
      metricCard("班级对象数", quality.totalClasses, `${quality.totalSmallGroups} 个小组对象`, quality.missingSmallGroupRows ? "存在小组空值" : "已纳入下钻", quality.missingSmallGroupRows ? "warn" : "good")
    ].join("")

    renderTable(dom.qualityFieldTable, ["字段", "缺失行数", "总行数", "缺失率"], quality.keyFields.map((item) => [
      item.label,
      String(item.missing),
      String(item.total),
      formatPct(item.total ? item.missing / item.total : null)
    ]))

    renderTable(dom.qualityDayTable, ["字段", "可用行数", "总行数", "覆盖率"], quality.dayFields.map((item) => [
      item.field,
      String(item.available),
      String(item.total),
      formatPct(item.total ? item.available / item.total : null)
    ]))

    dom.qualityNotes.innerHTML = quality.notes.map((note) => `<div class="stack-item">${note}</div>`).join("")
  }

  function renderByDayCharts(host, items, specs, includeGroupName) {
    host.innerHTML = ""
    const effectiveDayEnd = /ProcessCharts$/.test(host.id) ? 7 : null
    specs.forEach((spec) => {
      const card = document.createElement("div")
      card.className = "chart-card"
      card.innerHTML = `<button class="btn ghost chart-zoom-btn" type="button" data-action="open-chart-modal" data-chart="${host.id}_${spec.key}" data-title="${spec.title}">放大</button><div class="chart-card-title">${spec.title}</div><div id="${host.id}_${spec.key}" class="chart"></div>`
      host.appendChild(card)
      const maxDay = effectiveDayEnd || spec.dayEnd
      const xCategories = []
      for (let day = spec.dayStart; day <= maxDay; day += 1) xCategories.push(`day${day}`)
      const traces = items.map((item) => {
        const x = xCategories.slice()
        const y = []
        for (let day = spec.dayStart; day <= maxDay; day += 1) {
          const value = firstMetric(item.raw, item.supplement, spec.resolver ? spec.resolver(day) : [spec.field(day)])
          y.push(value === null ? null : value)
        }
        return {
          type: "scatter",
          mode: "lines+markers",
          name: item.seriesName || (includeGroupName ? `${item.groupName}-${item.campId}` : item.campId),
          x,
          y
        }
      }).filter((trace) => trace.y.length)
      const normalTraceNames = traces
        .map((trace) => trace.name)
        .filter((name) => !["营期均值", "头部", "中部", "尾部", "新人", "老人"].includes(name))
      const traceColorMap = new Map()
      uniq(normalTraceNames).forEach((name, index) => {
        traceColorMap.set(name, seriesColor(index))
      })
      traces.forEach((trace) => {
        if (trace.name === "营期均值") {
          trace.line = { color: "#94a3b8", width: 2, dash: "dash" }
          trace.marker = { color: "#94a3b8", size: 7 }
        } else if (trace.name === "头部") {
          trace.line = { color: "#2563eb", width: 2 }
          trace.marker = { color: "#2563eb", size: 7 }
        } else if (trace.name === "中部") {
          trace.line = { color: "#f59e0b", width: 2 }
          trace.marker = { color: "#f59e0b", size: 7 }
        } else if (trace.name === "尾部") {
          trace.line = { color: "#ef4444", width: 2 }
          trace.marker = { color: "#ef4444", size: 7 }
        } else if (trace.name === "新人") {
          trace.line = { color: "#22c55e", width: 2 }
          trace.marker = { color: "#22c55e", size: 7 }
        } else if (trace.name === "老人") {
          trace.line = { color: "#8b5cf6", width: 2 }
          trace.marker = { color: "#8b5cf6", size: 7 }
        } else if (!trace.line) {
          const color = traceColorMap.get(trace.name) || "#2563eb"
          trace.line = { color, width: 2 }
          trace.marker = { color, size: 7 }
        } else if (!trace.marker) {
          trace.marker = { size: 7 }
        }
      })
      Plotly.newPlot(`${host.id}_${spec.key}`, withValueLabels(traces, spec.formatter || (spec.tickformat ? formatChartPercent : formatChartNumber)), baseLayout({
        xaxis: { categoryorder: "array", categoryarray: xCategories, color: PLOT_MUTED, gridcolor: PLOT_GRID_LIGHT, zerolinecolor: PLOT_GRID_LIGHT },
        yaxis: { tickformat: spec.tickformat || undefined, color: PLOT_MUTED, gridcolor: PLOT_GRID }
      }), plotConfig)
    })
  }

  function decayRatio(previousValue, currentValue) {
    if (!Number.isFinite(previousValue) || !Number.isFinite(currentValue)) return null
    if (Math.abs(previousValue) < 1e-9) return null
    return (currentValue - previousValue) / previousValue
  }

  function renderDecayCharts(host, items, specs, includeGroupName) {
    if (!host) return
    host.innerHTML = ""
    specs.forEach((spec) => {
      const card = document.createElement("div")
      card.className = "chart-card"
      card.innerHTML = `<button class="btn ghost chart-zoom-btn" type="button" data-action="open-chart-modal" data-chart="${host.id}_${spec.key}" data-title="${spec.title}">放大</button><div class="chart-card-title">${spec.title}</div><div id="${host.id}_${spec.key}" class="chart"></div>`
      host.appendChild(card)
      const xCategories = []
      for (let day = spec.dayStart + 1; day <= spec.dayEnd; day += 1) xCategories.push(`D${day - 1}-${day}`)
      xCategories.push(`D${spec.dayStart}-${spec.dayEnd}`)
      const traces = items.map((item) => {
        const y = []
        for (let day = spec.dayStart + 1; day <= spec.dayEnd; day += 1) {
          const previousValue = firstMetric(item.raw, item.supplement, [spec.field(day - 1)])
          const currentValue = firstMetric(item.raw, item.supplement, [spec.field(day)])
          y.push(decayRatio(previousValue, currentValue))
        }
        const firstValue = firstMetric(item.raw, item.supplement, [spec.field(spec.dayStart)])
        const lastValue = firstMetric(item.raw, item.supplement, [spec.field(spec.dayEnd)])
        y.push(decayRatio(firstValue, lastValue))
        return {
          type: "bar",
          name: item.seriesName || (includeGroupName ? `${item.groupName}-${item.campId}` : item.campId),
          x: xCategories.slice(),
          y
        }
      }).filter((trace) => trace.y.some((value) => Number.isFinite(value)))
      const normalTraceNames = traces
        .map((trace) => trace.name)
        .filter((name) => !["营期均值", "头部", "中部", "尾部", "新人", "老人"].includes(name))
      const traceColorMap = new Map()
      uniq(normalTraceNames).forEach((name, index) => {
        traceColorMap.set(name, seriesColor(index))
      })
      traces.forEach((trace) => {
        if (trace.name === "营期均值") {
          trace.marker = { color: "#94a3b8" }
        } else if (trace.name === "头部") {
          trace.marker = { color: "#2563eb" }
        } else if (trace.name === "中部") {
          trace.marker = { color: "#f59e0b" }
        } else if (trace.name === "尾部") {
          trace.marker = { color: "#ef4444" }
        } else if (trace.name === "新人") {
          trace.marker = { color: "#22c55e" }
        } else if (trace.name === "老人") {
          trace.marker = { color: "#8b5cf6" }
        } else {
          trace.marker = { color: traceColorMap.get(trace.name) || "#2563eb" }
        }
      })
      Plotly.newPlot(`${host.id}_${spec.key}`, withValueLabels(traces, formatChartPercent), baseLayout({
        barmode: "group",
        xaxis: { categoryorder: "array", categoryarray: xCategories, color: PLOT_MUTED, gridcolor: PLOT_GRID_LIGHT, zerolinecolor: PLOT_GRID_LIGHT },
        yaxis: { tickformat: spec.tickformat || ".1%", color: PLOT_MUTED, gridcolor: PLOT_GRID }
      }), plotConfig)
    })
  }

  function renderHeatmap(id, items, resolver, formatter, includeGroupName, lowerIsBetter = false) {
    const yLabels = items.map((item) => String(item.seriesName || (includeGroupName ? `${item.groupName}-${item.campId}` : `营期${item.campId}`)))
    Plotly.newPlot(id, [{
      type: "heatmap",
      x: [3, 4, 5, 6, 7].map((day) => `day${day}`),
      y: yLabels,
      z: items.map((item) => [3, 4, 5, 6, 7].map((day) => resolver(item, day))),
      colorscale: lowerIsBetter
        ? [[0, "#dcfce7"], [0.5, "#fef3c7"], [1, "#fee2e2"]]
        : [[0, "#fee2e2"], [0.5, "#fef3c7"], [1, "#dcfce7"]],
      text: items.map((item) => [3, 4, 5, 6, 7].map((day) => formatter(resolver(item, day)))),
      texttemplate: "%{text}",
      hovertemplate: "%{y}<br>%{x}<br>%{z}<extra></extra>"
    }], baseLayout({
      margin: { l: 90, r: 18, t: 20, b: 46 },
      yaxis: {
        type: "category",
        categoryorder: "array",
        categoryarray: yLabels,
        autorange: "reversed",
        color: PLOT_MUTED,
        gridcolor: PLOT_GRID_LIGHT,
        zerolinecolor: PLOT_GRID_LIGHT
      }
    }), plotConfig)
  }

  function renderTable(host, headers, rows) {
    host.innerHTML = rows.length ? `
      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    ` : `<div class="stack-item">当前筛选范围内暂无可展示数据。</div>`
  }

  function openChartModal(chartId, title) {
    const source = document.getElementById(chartId)
    if (!source?.data || !dom.chartModal || !dom.chartModalPlot) return
    dom.chartModalTitle.textContent = title || "图表放大查看"
    dom.chartModal.classList.remove("hidden")
    const data = source.data.map((item) => JSON.parse(JSON.stringify(item)))
    const layout = JSON.parse(JSON.stringify(source.layout || {}))
    layout.margin = { l: 70, r: 40, t: 36, b: 70 }
    layout.paper_bgcolor = "rgba(0,0,0,0)"
    layout.plot_bgcolor = "rgba(0,0,0,0)"
    delete layout.width
    delete layout.height
    Plotly.newPlot(dom.chartModalPlot, data, layout, modalPlotConfig)
  }

  function closeChartModal() {
    if (!dom.chartModal) return
    dom.chartModal.classList.add("hidden")
    if (dom.chartModalPlot) {
      try {
        Plotly.purge(dom.chartModalPlot)
      } catch {}
      dom.chartModalPlot.innerHTML = ""
    }
  }

  async function copyCampBroadcast(campId, button) {
    const text = state.ui.campBroadcasts?.[String(campId)]
    if (!text) return
    let copied = false
    try {
      await navigator.clipboard.writeText(text)
      copied = true
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      copied = document.execCommand("copy")
      textarea.remove()
    }
    if (!button) return
    const original = button.textContent
    button.textContent = copied ? "已复制播报" : "复制失败"
    button.classList.toggle("copied", copied)
    setTimeout(() => {
      button.textContent = original
      button.classList.remove("copied")
    }, 1800)
  }

  function baseLayout(extra = {}) {
    return Object.assign({
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 54, r: 30, t: 36, b: 80 },
      legend: { orientation: "h", x: 0, y: -0.22, font: { color: PLOT_TEXT } },
      xaxis: { color: PLOT_MUTED, gridcolor: PLOT_GRID_LIGHT, zerolinecolor: PLOT_GRID_LIGHT },
      yaxis: { color: PLOT_MUTED, gridcolor: PLOT_GRID, zerolinecolor: PLOT_GRID_LIGHT },
      font: { color: PLOT_TEXT }
    }, extra)
  }

  function fullCategoryAxis(labels, extra = {}) {
    const categories = uniq((labels || []).map((label) => String(label ?? "")).filter(Boolean))
    const density = categories.length
    return Object.assign({
      type: "category",
      categoryorder: "array",
      categoryarray: categories,
      tickmode: "array",
      tickvals: categories,
      ticktext: categories,
      tickangle: density > 20 ? -45 : density > 10 ? -30 : -15,
      tickfont: { size: density > 20 ? 9 : density > 10 ? 10 : 11 },
      automargin: true,
      color: PLOT_MUTED,
      gridcolor: PLOT_GRID_LIGHT,
      zerolinecolor: PLOT_GRID_LIGHT
    }, extra)
  }

  function orderShare(item, day) {
    return firstMetric(item.raw, item.supplement, [`day${day}出单占比`, `day${day}出单比例`, `day${day}出单占比%`])
  }

  const TAB_CONTEXT = {
    overview: ["经营驾驶舱 / 经营总览", "先检查进行中营期的昨日小组异常，再复盘最近结营3期。"],
    "project-compare": ["经营驾驶舱 / 项目对比", "横向比较项目经营表现，并逐层展开到大组、小组和班长。"],
    camp: ["经营驾驶舱 / 营期分析", "面向单项目负责人查看各营期经营表现，再进入成本、转化节奏、过程指标与组织贡献分析。"],
    group: ["组织分析 / 大组分析", "比较大组差异，聚焦单个大组趋势并继续下钻到小组与班长。"],
    "small-group": ["组织分析 / 小组分析", "定位小组间差异，结合过程、转化和班长表现复盘。"],
    class: ["组织分析 / 班长分析", "从能力分层、班型结构、ROI和By-day表现识别具体执行差异。"],
    "ban-impact": ["组织分析 / 封号影响", "按封号日比较班级封号前后By-day表现，定位受影响最大的小组和班级。"],
    quality: ["数据管理 / 数据健康", "检查关键字段、过程数据覆盖率与分析口径，确认结论可信度。"]
  }

  function switchAnalysisTab(tabName, options = {}) {
    const target = document.querySelector(`.tab[data-tab='${tabName}']`)
    if (!target) return
    state.ui.activeTab = tabName
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName))
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tabName))
    const context = TAB_CONTEXT[tabName] || ["分析工作台", ""]
    if (dom.analysisBreadcrumb) dom.analysisBreadcrumb.textContent = context[0]
    if (dom.analysisPageHint) dom.analysisPageHint.textContent = context[1]
    renderActiveTab()
    if (options.scroll !== false) dom.analysisBreadcrumb?.scrollIntoView({ behavior: "smooth", block: "start" })
    resizeVisiblePlots()
  }

  function bindTabs() {
    document.querySelectorAll(".tab").forEach((button) => {
      button.addEventListener("click", () => switchAnalysisTab(button.dataset.tab))
    })
  }

  function bindCampDrillEvents() {
    ;[
      document.getElementById("campMonthProgress"),
      dom.monthDrillTable
    ].forEach((host) => {
      host?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action='month-drill']")
        if (!button) return
        openCampDrill("month", parseDrillState(button))
      })
    })

    ;[
      document.getElementById("campTable"),
      dom.campEntityDrillTable
    ].forEach((host) => {
      host?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action='camp-entity-drill']")
        if (!button) return
        openCampDrill("entity", parseDrillState(button))
      })
    })

    dom.monthDrillBackBtn?.addEventListener("click", () => {
      state.ui.monthDrill = previousCampDrill(state.ui.monthDrill)
      renderMonthDrilldown()
    })

    dom.monthDrillResetBtn?.addEventListener("click", () => {
      state.ui.monthDrill = null
      renderMonthDrilldown()
    })

    dom.monthDrillPathModeBtn?.addEventListener("click", () => {
      state.ui.monthDrillMode = "path"
      renderMonthDrilldown()
    })

    dom.monthDrillExpandModeBtn?.addEventListener("click", () => {
      state.ui.monthDrillMode = "expand"
      renderMonthDrilldown()
    })

    dom.campEntityDrillBackBtn?.addEventListener("click", () => {
      state.ui.campEntityDrill = previousCampDrill(state.ui.campEntityDrill)
      renderCampEntityDrilldown()
    })

    dom.campEntityDrillResetBtn?.addEventListener("click", () => {
      state.ui.campEntityDrill = null
      renderCampEntityDrilldown()
    })

    dom.campEntityDrillPathModeBtn?.addEventListener("click", () => {
      state.ui.campEntityDrillMode = "path"
      renderCampEntityDrilldown()
    })

    dom.campEntityDrillExpandModeBtn?.addEventListener("click", () => {
      state.ui.campEntityDrillMode = "expand"
      renderCampEntityDrilldown()
    })

    ;[
      dom.monthDrillExpandView,
      dom.campEntityDrillExpandView
    ].forEach((host, index) => {
      const kind = index === 0 ? "month" : "entity"
      host?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]")
        if (!button) return
        const action = button.dataset.action
        if (action === `${kind}-expand-group`) {
          updateExpandedDrill(kind, (_, root) => {
            const value = button.dataset.value || ""
            return value ? { ...root, level: "group", groupName: value } : { ...root }
          })
        }
        if (action === `${kind}-expand-group-row`) {
          updateExpandedDrill(kind, (_, root) => ({ ...root, level: "group", groupName: button.dataset.group || null }))
        }
        if (action === `${kind}-expand-smallgroup`) {
          updateExpandedDrill(kind, (current, root) => {
            const value = button.dataset.value || ""
            if (!value) {
              return current.groupName ? { ...root, level: "group", groupName: current.groupName } : { ...root }
            }
            return {
              ...root,
              level: "smallGroup",
              groupName: current.groupName || button.dataset.group || null,
              smallGroupName: value
            }
          })
        }
        if (action === `${kind}-expand-smallgroup-row`) {
          updateExpandedDrill(kind, (current, root) => ({
            ...root,
            level: "smallGroup",
            groupName: button.dataset.group || current.groupName || null,
            smallGroupName: button.dataset.smallgroup || null
          }))
        }
      })
    })

    ;["group", "smallGroup"].forEach((kind) => {
      const config = ENTITY_ANALYSIS_CONFIG[kind]
      config.focusChaseSwitch?.addEventListener("click", (event) => {
        const button = event.target.closest(`[data-action='${kind}-focus']`)
        if (button) {
          state.ui[config.focusStateKey] = button.dataset.value || null
          const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
          if (kind === "group") renderGroupSection(scoped.groupSnapshots, scoped.classSnapshots)
          else renderSmallGroupSection(scoped.smallGroupSnapshots, scoped.classSnapshots)
          return
        }
        if (kind !== "group") return
        const compareButton = event.target.closest("[data-action='group-focus-compare-toggle']")
        if (!compareButton) return
        const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
        const compareRows = buildEntityComparisonRows(scoped.groupSnapshots, "group", scoped.classSnapshots)
        const validKeys = compareRows.map((item) => item.key)
        const value = compareButton.dataset.value || ""
        state.ui.groupFocusCompare = toggleMultiSelection(state.ui.groupFocusCompare, value, validKeys)
        renderGroupSection(scoped.groupSnapshots, scoped.classSnapshots)
      })
      config.focusByDaySwitch?.addEventListener("click", (event) => {
        const button = event.target.closest(`[data-action='${kind}-byday-camp-toggle']`)
        if (!button) return
        const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
        const items = kind === "group" ? scoped.groupSnapshots : scoped.smallGroupSnapshots
        const validCampIds = uniq(items.map((item) => String(item.campId || "").trim()).filter(Boolean))
        const value = button.dataset.value || ""
        const stateKey = kind === "group" ? "groupByDayCamps" : "smallGroupByDayCamps"
        state.ui[stateKey] = toggleMultiSelection(state.ui[stateKey], value, validCampIds)
        state.ui[`${stateKey}ManuallyCleared`] = false
        if (kind === "group") renderGroupSection(scoped.groupSnapshots, scoped.classSnapshots)
        else renderSmallGroupSection(scoped.smallGroupSnapshots, scoped.classSnapshots)
      })
      const selectAllBtn = kind === "group" ? dom.groupFocusByDaySelectAllBtn : dom.smallGroupFocusByDaySelectAllBtn
      const clearBtn = kind === "group" ? dom.groupFocusByDayClearBtn : dom.smallGroupFocusByDayClearBtn
      selectAllBtn?.addEventListener("click", () => {
        const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
        const items = kind === "group" ? scoped.groupSnapshots : scoped.smallGroupSnapshots
        const validCampIds = uniq(items.map((item) => String(item.campId || "").trim()).filter(Boolean))
          .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }))
        const stateKey = kind === "group" ? "groupByDayCamps" : "smallGroupByDayCamps"
        state.ui[stateKey] = validCampIds
        state.ui[`${stateKey}ManuallyCleared`] = false
        if (kind === "group") renderGroupSection(scoped.groupSnapshots, scoped.classSnapshots)
        else renderSmallGroupSection(scoped.smallGroupSnapshots, scoped.classSnapshots)
      })
      clearBtn?.addEventListener("click", () => {
        const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
        const stateKey = kind === "group" ? "groupByDayCamps" : "smallGroupByDayCamps"
        state.ui[stateKey] = []
        state.ui[`${stateKey}ManuallyCleared`] = true
        if (kind === "group") renderGroupSection(scoped.groupSnapshots, scoped.classSnapshots)
        else renderSmallGroupSection(scoped.smallGroupSnapshots, scoped.classSnapshots)
      })
      config.orderRhythmSwitch?.addEventListener("click", (event) => {
        const button = event.target.closest(`[data-action='${kind}-rhythm-metric']`)
        if (!button) return
        state.ui[config.orderRhythmStateKey] = button.dataset.value || "orderShare"
        const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
        if (kind === "group") renderGroupSection(scoped.groupSnapshots, scoped.classSnapshots)
        else renderSmallGroupSection(scoped.smallGroupSnapshots, scoped.classSnapshots)
      })
      config.trendDimensionSwitch?.addEventListener("click", (event) => {
        const button = event.target.closest(`[data-action='${kind}-trend-dimension']`)
        if (!button) return
        state.ui[config.trendDimensionStateKey] = button.dataset.value || "camp"
        const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
        if (kind === "group") renderGroupSection(scoped.groupSnapshots, scoped.classSnapshots)
        else renderSmallGroupSection(scoped.smallGroupSnapshots, scoped.classSnapshots)
      })
    })
    dom.projectCompareOverviewTable?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-tree-toggle']")
      if (!button || button.classList.contains("leaf")) return
      const key = button.dataset.key || ""
      const current = new Set(state.ui.projectCompareOverviewExpanded || [])
      if (current.has(key)) current.delete(key)
      else current.add(key)
      state.ui.projectCompareOverviewExpanded = Array.from(current)
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderProjectCompareSection(scoped.campSnapshots, scopedRows)
    })
    dom.projectCompareWarmOverviewTable?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-tree-toggle']")
      if (!button || button.classList.contains("leaf")) return
      const key = button.dataset.key || ""
      const current = new Set(state.ui.projectCompareWarmOverviewExpanded || [])
      if (current.has(key)) current.delete(key)
      else current.add(key)
      state.ui.projectCompareWarmOverviewExpanded = Array.from(current)
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderProjectCompareSection(scoped.campSnapshots, scopedRows)
    })

    dom.campViewDimensionSwitch?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-view-dimension']")
      if (!button) return
      state.ui.campViewDimension = button.dataset.value || "camp"
      state.ui.campOverviewExpanded = []
      state.ui.campWarmOverviewExpanded = []
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderCampSection(scoped.campSnapshots, scopedRows)
    })
    dom.campOverviewTable?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-tree-toggle']")
      if (!button || button.classList.contains("leaf")) return
      const key = button.dataset.key || ""
      const current = new Set(state.ui.campOverviewExpanded || [])
      if (current.has(key)) current.delete(key)
      else current.add(key)
      state.ui.campOverviewExpanded = Array.from(current)
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderCampSection(scoped.campSnapshots, scopedRows)
    })
    dom.campWarmOverviewTable?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-tree-toggle']")
      if (!button || button.classList.contains("leaf")) return
      const key = button.dataset.key || ""
      const current = new Set(state.ui.campWarmOverviewExpanded || [])
      if (current.has(key)) current.delete(key)
      else current.add(key)
      state.ui.campWarmOverviewExpanded = Array.from(current)
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderCampSection(scoped.campSnapshots, scopedRows)
    })
    dom.campRhythmDimensionSwitch?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-rhythm-dimension']")
      if (!button) return
      state.ui.campRhythmDimension = button.dataset.value || "camp"
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderCampSection(scoped.campSnapshots, scopedRows)
    })
    dom.campByDayDimensionSwitch?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-byday-dimension']")
      if (!button) return
      state.ui.campByDayDimension = button.dataset.value || "camp"
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderCampSection(scoped.campSnapshots, scopedRows)
    })

    dom.classHeatmapSmallGroupSwitch?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='class-heatmap-smallgroup']")
      if (!button) return
      state.ui.classHeatmapSmallGroup = button.dataset.value || ""
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classAddRevenueSmallGroupSwitch?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='class-heatmap-smallgroup']")
      if (!button) return
      state.ui.classHeatmapSmallGroup = button.dataset.value || ""
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classTable?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='class-table-sort-header']")
      if (!button) return
      state.ui.classTableSort = button.dataset.sort || "roiDesc"
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classTableSearchInput?.addEventListener("input", (event) => {
      state.ui.classTableSearch = event.target.value || ""
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classHeatmapSearchInput?.addEventListener("input", (event) => {
      state.ui.classHeatmapSearch = event.target.value || ""
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classByDayLeaderSelect?.addEventListener("change", (event) => {
      state.ui.classByDayLeader = event.target.value || ""
      state.ui.classByDayCamp = ""
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classByDayCampSelect?.addEventListener("change", (event) => {
      state.ui.classByDayCamp = event.target.value || ""
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classCompareByDayCampSelect?.addEventListener("change", (event) => {
      state.ui.classCompareByDayCamp = event.target.value || ""
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classCompareByDaySearchInput?.addEventListener("input", (event) => {
      state.ui.classCompareByDaySearch = event.target.value || ""
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classTierCompareToggleBtn?.addEventListener("click", () => {
      state.ui.classTierCompareCollapsed = !state.ui.classTierCompareCollapsed
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classTypeCompareToggleBtn?.addEventListener("click", () => {
      state.ui.classTypeCompareCollapsed = !state.ui.classTypeCompareCollapsed
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classFormatCompareToggleBtn?.addEventListener("click", () => {
      state.ui.classFormatCompareCollapsed = !state.ui.classFormatCompareCollapsed
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classTypeCompareTable?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='class-type-compare-toggle']")
      if (!button) return
      const key = button.dataset.key || ""
      const current = new Set(state.ui.classTypeCompareExpanded || [])
      if (current.has(key)) current.delete(key)
      else current.add(key)
      state.ui.classTypeCompareExpanded = Array.from(current)
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })
    dom.classTierCompareTable?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='class-tier-compare-toggle']")
      if (!button) return
      const key = button.dataset.key || ""
      const current = new Set(state.ui.classTierCompareExpanded || [])
      if (current.has(key)) current.delete(key)
      else current.add(key)
      state.ui.classTierCompareExpanded = Array.from(current)
      const scoped = buildSnapshotsFromRows(getScopedUnifiedRows(null), state.model.meta)
      renderClassSection(scoped.classSnapshots)
    })

    dom.campWarmDimensionSwitch?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-warm-dimension']")
      if (!button) return
      state.ui.campWarmDimension = button.dataset.value || "group"
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderCampSection(scoped.campSnapshots, scopedRows)
    })
    dom.campWarmTimeDimensionSwitch?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='camp-warm-time-dimension']")
      if (!button) return
      state.ui.campWarmTimeDimension = button.dataset.value || "camp"
      const scopedRows = getScopedUnifiedRows(null)
      const scoped = buildSnapshotsFromRows(scopedRows, state.model.meta)
      renderCampSection(scoped.campSnapshots, scopedRows)
    })

    dom.campInsightOpenBtn?.addEventListener("click", openCampInsight)
    dom.campInsightCloseBtn?.addEventListener("click", closeCampInsight)
    dom.campInsightCopyBtn?.addEventListener("click", copyCampInsight)
    dom.banInsightCopyBtn?.addEventListener("click", copyBanInsight)
    dom.banDaySwitch?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='ban-day']")
      if (!button) return
      state.ui.banDay = button.dataset.value || "全部"
      renderBanImpactSection(getScopedUnifiedRows(null))
    })
    dom.campInsightModal?.addEventListener("click", (event) => {
      if (event.target === dom.campInsightModal) closeCampInsight()
    })

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='open-chart-modal']")
      if (!button) return
      openChartModal(button.dataset.chart, button.dataset.title)
    })

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='jump-analysis']")
      if (!button) return
      switchAnalysisTab(button.dataset.targetTab || "overview")
    })

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='jump-camp-filtered']")
      if (!button) return
      openCampAnalysisWithCamp(button.dataset.campId || "")
    })

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='jump-class-byday']")
      if (!button) return
      openClassByDayWithContext(button.dataset.className || "", button.dataset.campId || "")
    })

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='focus-overview-camp-anomalies']")
      if (!button) return
      focusOverviewCampAnomalies(button.dataset.campId || "")
    })

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='clear-overview-anomaly-focus']")
      if (!button) return
      clearOverviewCampAnomalyFocus()
    })

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='copy-camp-broadcast']")
      if (!button) return
      copyCampBroadcast(button.dataset.campId || "", button)
    })

    dom.toggleFiltersBtn?.addEventListener("click", () => {
      state.ui.filterCollapsed = !state.ui.filterCollapsed
      renderFilterPanelState()
      resizeVisiblePlots()
    })

    dom.chartModalCloseBtn?.addEventListener("click", closeChartModal)
    dom.chartModal?.addEventListener("click", (event) => {
      if (event.target === dom.chartModal) closeChartModal()
    })
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !dom.chartModal?.classList.contains("hidden")) closeChartModal()
      if (event.key === "Escape" && !dom.campInsightModal?.classList.contains("hidden")) closeCampInsight()
    })
  }


  function csvEscape(value) {
    if (value === null || value === undefined) return ""
    const text = String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text
  }

  function csvHeaders(rows) {
    const preferred = ["营期", "月份", "开营时间", "_开营周", "_开营周起始", "_开营周结束", "大组", "小组", "班级", "_标准班级", "_预处理班型", "机器号数", "添加人数", "转化人数", "流水", "成本", "ROI", "转率", "个销占比", "待支付率", "待支付转率"]
    const seen = new Set()
    const ordered = []
    preferred.forEach((key) => {
      if (rows.some((row) => Object.prototype.hasOwnProperty.call(row, key))) {
        seen.add(key)
        ordered.push(key)
      }
    })
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key)
          ordered.push(key)
        }
      })
    })
    return ordered
  }

  function campOverviewVisibleRows() {
    const dimension = state.ui.campViewDimension || "camp"
    const scopedRows = getScopedUnifiedRows(null)
    return {
      dimension,
      rows: buildCampOverviewFlatRows(scopedRows, dimension, state.ui.campOverviewExpanded)
    }
  }

  function campOverviewHeaders() {
    return [
      "层级",
      "ROI",
      "转率",
      "添加成本",
      "添加产值",
      "人均产能",
      "个销占比",
      "待支付率",
      "待支付转率",
      "出单节奏",
      "客单价",
      "人效",
      "单号承载",
      "高沉浸率",
      "高沉浸转率",
      "营期数",
      "总流水",
      "总转化人数",
      "升班率",
      "添加人数"
    ]
  }

  function campOverviewLabel(node) {
    const depthPrefix = node.depth > 0 ? `${"  ".repeat(node.depth)}${node.hasChildren ? "▸ " : ""}` : ""
    return `${depthPrefix}${node.label}`
  }

  function campOverviewCsvRow(node) {
    return {
      层级: campOverviewLabel(node),
      ROI: Number.isFinite(node.snapshot.metrics.roi) ? formatNum(node.snapshot.metrics.roi, 2) : "-",
      转率: formatPct(node.snapshot.metrics.convRate),
      添加成本: formatMoney(node.snapshot.metrics.addCost),
      添加产值: formatMoney(node.snapshot.metrics.addRevenue),
      人均产能: formatMoney(node.avgOutputPerLeader),
      个销占比: formatPct(node.snapshot.metrics.individualShare),
      待支付率: formatPct(node.snapshot.metrics.pendingRate),
      待支付转率: formatPct(node.snapshot.metrics.pendingConv),
      出单节奏: node.orderCounts.map((value) => Math.round(Number.isFinite(value) ? value : 0)).join(" / "),
      客单价: formatMoney(node.snapshot.metrics.aov),
      人效: Number.isFinite(node.snapshot.metrics.personEfficiency) ? formatNum(node.snapshot.metrics.personEfficiency, 0) : "-",
      单号承载: Number.isFinite(node.snapshot.metrics.machineLoad) ? formatNum(node.snapshot.metrics.machineLoad, 0) : "-",
      高沉浸率: formatPct(node.highImmerseRate),
      高沉浸转率: formatPct(node.highImmerseConvRate),
      营期数: Number.isFinite(node.snapshot.coveredCampCount) ? Math.round(node.snapshot.coveredCampCount) : "-",
      总流水: formatMoney(node.snapshot.metrics.revenue),
      总转化人数: Number.isFinite(node.snapshot.metrics.conv) ? Math.round(node.snapshot.metrics.conv) : "-",
      升班率: formatPct(node.snapshot.metrics.upgradeRate),
      添加人数: Number.isFinite(node.snapshot.metrics.adds) ? Math.round(node.snapshot.metrics.adds) : "-"
    }
  }

  function downloadBlob(blob, filename) {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function exportCampOverviewCsv() {
    if (!state.model) return
    const { rows } = campOverviewVisibleRows()
    if (!rows.length) return
    const headers = campOverviewHeaders()
    const content = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => {
        const mapped = campOverviewCsvRow(row)
        return headers.map((header) => csvEscape(mapped[header])).join(",")
      })
    ].join("\r\n")
    const datePart = formatDate(state.filters.asOfDate).replace(/-/g, "")
    const dimensionText = campViewDimensionText(state.ui.campViewDimension || "camp")
    downloadBlob(new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" }), `营期分析_核心指标概览_${dimensionText}_${datePart}.csv`)
  }

  function roundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + width, y, x + width, y + height, r)
    ctx.arcTo(x + width, y + height, x, y + height, r)
    ctx.arcTo(x, y + height, x, y, r)
    ctx.arcTo(x, y, x + width, y, r)
    ctx.closePath()
  }

  function ellipsizeCanvasText(ctx, text, maxWidth) {
    const raw = String(text || "").replace(/\s+/g, " ").trim()
    if (!raw) return ""
    if (ctx.measureText(raw).width <= maxWidth) return raw
    const ellipsis = "…"
    let left = 0
    let right = raw.length
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const candidate = `${raw.slice(0, mid)}${ellipsis}`
      if (ctx.measureText(candidate).width <= maxWidth) left = mid + 1
      else right = mid
    }
    return `${raw.slice(0, Math.max(1, left - 1))}${ellipsis}`
  }

  function styleWidthPercent(text) {
    const match = String(text || "").match(/width\s*:\s*([\d.]+)%/)
    if (!match) return null
    const value = Number(match[1])
    return Number.isFinite(value) ? value : null
  }

  function styleBackground(text) {
    const match = String(text || "").match(/background\s*:\s*([^;]+)/)
    return match ? match[1].trim() : ""
  }

  async function exportCampOverviewPng() {
    if (!state.model || !dom.campOverviewTable) return
    const table = dom.campOverviewTable.querySelector("table")
    if (!table) return
    const dimensionText = campViewDimensionText(state.ui.campViewDimension || "camp")
    const button = dom.campOverviewExportPngBtn
    const originalText = button?.textContent || "导出 PNG"
    if (button) {
      button.disabled = true
      button.textContent = "生成中..."
    }
    try {
      const rowEls = Array.from(table.querySelectorAll("tr"))
      if (!rowEls.length) return
      const colCount = rowEls[0].children.length
      const colWidths = Array.from({ length: colCount }, (_, index) => {
        const widths = rowEls.map((row) => {
          const cell = row.children[index]
          if (!(cell instanceof HTMLElement)) return 0
          return Math.max(cell.getBoundingClientRect().width || 0, cell.scrollWidth || 0)
        })
        return Math.ceil(Math.max(...widths, index === 0 ? 200 : 96))
      })

      const outerPad = 24
      const panelPad = 16
      const headHeight = 64
      const headerHeight = 42
      const rowHeight = 44
      const tableWidth = colWidths.reduce((sum, w) => sum + w, 0)
      const tableHeight = headerHeight + Math.max(0, rowEls.length - 1) * rowHeight
      const panelWidth = tableWidth + panelPad * 2
      const panelHeight = headHeight + tableHeight + panelPad * 2
      const width = panelWidth + outerPad * 2
      const height = panelHeight + outerPad * 2

      const ratioValue = Math.max(2, Math.min(3, window.devicePixelRatio || 2))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(width * ratioValue)
      canvas.height = Math.round(height * ratioValue)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.scale(ratioValue, ratioValue)

      ctx.fillStyle = "#f5f7fb"
      ctx.fillRect(0, 0, width, height)

      const panelX = outerPad
      const panelY = outerPad
      ctx.save()
      ctx.shadowColor = "rgba(15, 23, 42, 0.10)"
      ctx.shadowBlur = 26
      ctx.shadowOffsetY = 10
      roundedRectPath(ctx, panelX, panelY, panelWidth, panelHeight, 22)
      ctx.fillStyle = "rgba(255, 255, 255, 0.98)"
      ctx.fill()
      ctx.restore()

      roundedRectPath(ctx, panelX, panelY, panelWidth, panelHeight, 22)
      ctx.strokeStyle = "rgba(15, 23, 42, 0.12)"
      ctx.lineWidth = 1
      ctx.stroke()

      const textX = panelX + panelPad
      const textY = panelY + panelPad
      ctx.fillStyle = "#94a3b8"
      ctx.font = "800 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      ctx.fillText("核心概览", textX, textY + 12)
      ctx.fillStyle = "#0f172a"
      ctx.font = "700 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      ctx.fillText("核心指标概览", textX, textY + 36)
      ctx.fillStyle = "#64748b"
      ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      ctx.fillText(`导出时间：${formatDate(state.filters.asOfDate)} · 当前视角：${dimensionText}`, textX, textY + 56)

      const tableX = panelX + panelPad
      const tableY = panelY + panelPad + headHeight

      const lineColor = "rgba(15, 23, 42, 0.12)"
      const headerBg = "#f8fafc"
      const cellBg = "#ffffff"
      const dimensionRowBg = "rgba(248, 250, 252, 0.92)"
      const pillBg = "rgba(15, 23, 42, 0.06)"
      const good = "#059669"
      const warn = "#d97706"
      const bad = "#dc2626"
      const muted = "#64748b"

      const barFillColors = {
        blue: "rgba(37, 99, 235, 0.28)",
        green: "rgba(34, 197, 94, 0.28)",
        orange: "rgba(249, 115, 22, 0.28)",
        purple: "rgba(139, 92, 246, 0.24)",
        cyan: "rgba(6, 182, 212, 0.24)",
        teal: "rgba(20, 184, 166, 0.24)",
        gold: "rgba(245, 158, 11, 0.24)"
      }

      let y = tableY
      rowEls.forEach((rowEl, rowIndex) => {
        const isHeader = rowIndex === 0
        const isDimensionRow = rowEl.classList.contains("level-dimension")
        let x = tableX
        Array.from(rowEl.children).forEach((cellEl, colIndex) => {
          const widthCell = colWidths[colIndex]
          const heightCell = isHeader ? headerHeight : rowHeight
          let background = cellBg
          if (isHeader) background = headerBg
          else if (isDimensionRow) background = dimensionRowBg

          const isFirst = colIndex === 0
          if (!isHeader && isFirst) {
            if (rowEl.classList.contains("level-group")) background = "rgba(37, 99, 235, 0.05)"
            if (rowEl.classList.contains("level-smallGroup")) background = "rgba(14, 165, 233, 0.05)"
            if (rowEl.classList.contains("level-class")) background = "rgba(15, 23, 42, 0.03)"
          }

          ctx.fillStyle = background
          ctx.fillRect(x, y, widthCell, heightCell)
          ctx.strokeStyle = lineColor
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, widthCell, heightCell)

          if (!isHeader && isFirst) {
            if (rowEl.classList.contains("level-group")) {
              ctx.fillStyle = "rgba(37, 99, 235, 0.30)"
              ctx.fillRect(x, y, 3, heightCell)
            }
            if (rowEl.classList.contains("level-smallGroup")) {
              ctx.fillStyle = "rgba(14, 165, 233, 0.24)"
              ctx.fillRect(x, y, 3, heightCell)
            }
            if (rowEl.classList.contains("level-class")) {
              ctx.fillStyle = "rgba(15, 23, 42, 0.12)"
              ctx.fillRect(x, y, 3, heightCell)
            }
          }

          const cell = cellEl instanceof HTMLElement ? cellEl : null
          const centerY = y + heightCell / 2
          if (cell) {
            const pill = cell.querySelector(".metric-pill")
            const dataBar = cell.querySelector(".data-bar-cell")
            const rhythm = cell.querySelector(".order-rhythm-stack")
            if (pill instanceof HTMLElement) {
              const text = (pill.innerText || "").trim()
              ctx.font = isHeader ? "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : "700 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              const w = Math.min(widthCell - 14, Math.max(56, ctx.measureText(text).width + 20))
              const h = 24
              const px = x + (widthCell - w) / 2
              const py = centerY - h / 2
              ctx.fillStyle = pillBg
              roundedRectPath(ctx, px, py, w, h, 999)
              ctx.fill()
              ctx.fillStyle = pill.classList.contains("td-good") ? good : pill.classList.contains("td-warn") ? warn : pill.classList.contains("td-bad") ? bad : "#0f172a"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(text, x + widthCell / 2, centerY + 0.5)
              ctx.textAlign = "start"
            } else if (dataBar instanceof HTMLElement) {
              const fill = dataBar.querySelector(".data-bar-fill")
              const label = dataBar.querySelector(".data-bar-text")
              const percent = fill instanceof HTMLElement ? styleWidthPercent(fill.getAttribute("style")) : null
              const toneKey = ["blue", "green", "orange", "purple", "cyan", "teal", "gold"].find((key) => dataBar.classList.contains(key)) || "blue"
              const h = 26
              const w = Math.min(widthCell - 14, Math.max(92, widthCell - 18))
              const px = x + (widthCell - w) / 2
              const py = centerY - h / 2
              ctx.fillStyle = "rgba(148, 163, 184, 0.12)"
              roundedRectPath(ctx, px, py, w, h, 999)
              ctx.fill()
              const ratio = percent === null ? 0 : Math.max(0, Math.min(1, percent / 100))
              const fillW = Math.max(0, ratio * w)
              ctx.fillStyle = barFillColors[toneKey] || barFillColors.blue
              roundedRectPath(ctx, px, py, fillW, h, 999)
              ctx.fill()
              ctx.fillStyle = "#0f172a"
              ctx.font = "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText((label?.innerText || dataBar.innerText || "").trim(), x + widthCell / 2, centerY + 0.5)
              ctx.textAlign = "start"
            } else if (rhythm instanceof HTMLElement) {
              const h = 30
              const w = Math.min(widthCell - 14, Math.max(180, widthCell - 18))
              const px = x + (widthCell - w) / 2
              const py = centerY - h / 2
              ctx.fillStyle = "rgba(15, 23, 42, 0.06)"
              roundedRectPath(ctx, px, py, w, h, 10)
              ctx.fill()
              const segments = Array.from(rhythm.querySelectorAll(".order-rhythm-segment"))
              let sx = px
              segments.forEach((seg) => {
                if (!(seg instanceof HTMLElement)) return
                const pct = styleWidthPercent(seg.getAttribute("style")) || 0
                const segW = (pct / 100) * w
                if (segW <= 0) return
                ctx.fillStyle = styleBackground(seg.getAttribute("style")) || "#94a3b8"
                ctx.fillRect(sx, py, segW, h)
                const labelText = (seg.innerText || "").trim()
                if (labelText) {
                  ctx.fillStyle = "rgba(255, 255, 255, 0.96)"
                  ctx.font = "700 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  ctx.textAlign = "center"
                  ctx.textBaseline = "middle"
                  ctx.fillText(labelText, sx + segW / 2, centerY)
                  ctx.textAlign = "start"
                }
                sx += segW
              })
            } else {
              const rawText = (cell.innerText || "").replace(/\s+/g, " ").trim()
              ctx.fillStyle = isHeader ? muted : "#0f172a"
              ctx.font = isHeader ? "600 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              ctx.textBaseline = "middle"
              if (colIndex === 0) {
                const max = widthCell - 18
                const text = ellipsizeCanvasText(ctx, rawText, max)
                ctx.fillText(text, x + 10, centerY + 0.5)
              } else {
                const max = widthCell - 12
                const text = ellipsizeCanvasText(ctx, rawText, max)
                ctx.textAlign = "center"
                ctx.fillText(text, x + widthCell / 2, centerY + 0.5)
                ctx.textAlign = "start"
              }
            }
          }

          x += widthCell
        })
        y += isHeader ? headerHeight : rowHeight
      })

      const datePart = formatDate(state.filters.asOfDate).replace(/-/g, "")
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
      downloadBlob(blob, `营期分析_核心指标概览_${dimensionText}_${datePart}.png`)
      if (button) {
        button.textContent = "已导出"
        setTimeout(() => { button.textContent = originalText }, 1600)
      }
    } catch (error) {
      if (button) {
        button.textContent = "导出失败"
        setTimeout(() => { button.textContent = originalText }, 2200)
      }
    } finally {
      if (button) button.disabled = false
    }
  }

  function exportPreprocessedCsv() {
    if (!state.model) return
    const rows = getScopedUnifiedRows(null)
    if (!rows.length) return
    const headers = csvHeaders(rows)
    const content = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    ].join("\r\n")
    const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" })
    const datePart = formatDate(state.filters.asOfDate).replace(/-/g, "")
    downloadBlob(blob, `预处理数据_${datePart}.csv`)
  }

  dom.fileClass.addEventListener("change", (event) => onFileChange("class", event))
  dom.fileLimit?.addEventListener("change", (event) => onFileChange("limit", event))
  dom.startAnalysisBtn.addEventListener("click", onStartAnalysis)
  dom.exportCsvBtn.addEventListener("click", exportPreprocessedCsv)
  dom.campOverviewExportCsvBtn?.addEventListener("click", exportCampOverviewCsv)
  dom.campOverviewExportPngBtn?.addEventListener("click", exportCampOverviewPng)
  dom.toggleSidebarBtn?.addEventListener("click", () => {
    state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed
    renderSidebarState()
  })
  dom.backToImportBtn.addEventListener("click", () => {
    resetAnalysisSession({ clearUpload: true })
    switchScreen("import")
  })
  dom.applyFiltersBtn?.addEventListener("click", applyFilters)
  window.addEventListener("resize", resizeVisiblePlots)
  if ("ResizeObserver" in window) {
    const plotResizeObserver = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.contentRect.width > 80 && entry.contentRect.height > 80)) resizeVisiblePlots()
    })
    document.querySelectorAll(".tab-panel, .chart, .dashboard-main").forEach((el) => plotResizeObserver.observe(el))
  }
  bindTabs()
  bindCampDrillEvents()
  renderImportState()
})()
