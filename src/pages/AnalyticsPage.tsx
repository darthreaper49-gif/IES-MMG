import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Download,
  ScanLine,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { Camera, DetectionEvent, Page } from '../types'
import { eventLabels } from '../data'
import { Badge, downloadCSV, EventIcon, PageHeading, Select } from '../components/ui'

const weekly = [48, 76, 62, 101, 84, 113, 128]
const monthly = [345, 382, 397, 413, 468, 481]
const hourly = [2, 3, 1, 5, 10, 16, 21, 19, 17, 15, 11, 8]
export function AnalyticsPage({
  cameras,
  events,
  navigate,
  notify,
}: {
  cameras: Camera[]
  events: DetectionEvent[]
  navigate: (page: Page) => void
  notify: (message: string) => void
}) {
  const [period, setPeriod] = useState('week')
  const [chartMode, setChartMode] = useState('daily')
  const [hovered, setHovered] = useState<number | null>(null)
  const values = chartMode === 'hourly' ? hourly : period === 'week' ? weekly : monthly
  const labels =
    chartMode === 'hourly'
      ? [
          '00:00',
          '02:00',
          '04:00',
          '06:00',
          '08:00',
          '10:00',
          '12:00',
          '14:00',
          '16:00',
          '18:00',
          '20:00',
          '22:00',
        ]
      : period === 'week'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['Oct 3–7', 'Oct 8–12', 'Oct 13–17', 'Oct 18–22', 'Oct 23–27', 'Oct 28–Nov 1']
  const total = period === 'week' ? 612 : 2486
  const chartMax = chartMode === 'hourly' ? 25 : period === 'week' ? 150 : 450
  const peakIndex = values.indexOf(Math.max(...values))
  const exportReport = () => {
    downloadCSV('vigil-demo-analytics.csv', [
      ['Vigil demo analytics', 'Sample data'],
      ['Period', period],
      ['Total detections', total],
      [],
      ['Interval', 'Detections'],
      ...values.map((v, i) => [labels[i], v]),
      [],
      ['Camera', 'Location', 'Status'],
      ...cameras.map((c) => [c.name, c.location, c.online ? 'Online' : 'Paused']),
    ])
    notify('Demo analytics report exported')
  }
  const breakdown = [
    { type: 'person' as const, count: 54, color: '#388765', value: Math.round(total * 0.54) },
    { type: 'vehicle' as const, count: 28, color: '#8bbda6', value: Math.round(total * 0.28) },
    { type: 'motion' as const, count: 12, color: '#abc2d3', value: Math.round(total * 0.12) },
    { type: 'zone' as const, count: 6, color: '#e6bc73', value: Math.round(total * 0.06) },
  ]
  return (
    <>
      <PageHeading title="Analytics" subtitle="Turn everyday activity into a clearer picture.">
        <Select
          label="Analytics period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: 'Last 7 days' },
            { value: 'month', label: 'Last 30 days' },
          ]}
        />
        <button className="button button-secondary" onClick={exportReport}>
          <Download size={16} /> Export report
        </button>
      </PageHeading>
      <div className="analytics-period">
        <CalendarDays size={15} />
        {period === 'week' ? 'Oct 26 – Nov 1, 2026' : 'Oct 3 – Nov 1, 2026'}
        <span className="demo-dot" /> Sample analytics
      </div>
      <div className="analytics-stats">
        {[
          {
            label: 'Total detections',
            value: total.toLocaleString(),
            trend: '+12.3%',
            icon: ScanLine,
          },
          {
            label: 'Daily average',
            value: period === 'week' ? '87' : '83',
            trend: '+8.1%',
            icon: TrendingUp,
          },
          { label: 'Alert rate', value: '2.4%', trend: '−1.2%', icon: Sparkles },
          { label: 'Camera availability', value: '99.9%', trend: '+0.2%', icon: TrendingUp },
        ].map((s) => (
          <div className="panel analytics-stat" key={s.label}>
            <span>
              {s.label}
              <s.icon size={18} />
            </span>
            <strong>{s.value}</strong>
            <small>
              <ArrowUpRight size={13} />
              {s.trend}
              <span>vs. previous period</span>
            </small>
          </div>
        ))}
      </div>
      <div className="analytics-charts">
        <section className="panel detection-chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Detection activity</h2>
              <p>Understand the rhythm of your spaces.</p>
            </div>
            <div className="segmented-control">
              <button
                className={chartMode === 'daily' ? 'active' : ''}
                onClick={() => {
                  setChartMode('daily')
                  setHovered(null)
                }}
              >
                {period === 'week' ? 'Daily' : 'By period'}
              </button>
              <button
                className={chartMode === 'hourly' ? 'active' : ''}
                onClick={() => {
                  setChartMode('hourly')
                  setHovered(null)
                }}
              >
                Hourly
              </button>
            </div>
          </div>
          <div className="chart-legend">
            <span className="status-dot" />
            {chartMode === 'daily'
              ? period === 'week'
                ? 'Detections per day'
                : 'Detections by period'
              : 'Sample hourly distribution'}
            <span className="chart-hover-value">
              {hovered !== null
                ? `${labels[hovered]} · ${values[hovered]} detections`
                : `Peak: ${Math.max(...values)} detections`}
            </span>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis">
              <span>{chartMax}</span>
              <span>{Math.round((chartMax * 2) / 3)}</span>
              <span>{Math.round(chartMax / 3)}</span>
              <span>0</span>
            </div>
            <div className="chart-plot">
              <div className="chart-gridlines">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="chart-bars">
                {values.map((value, i) => (
                  <button
                    className={`chart-bar-column ${hovered === i ? 'bar-hovered' : ''}`}
                    key={`${chartMode}-${i}`}
                    onMouseEnter={() => setHovered(i)}
                    onFocus={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onBlur={() => setHovered(null)}
                    onClick={() => setHovered(i)}
                    aria-label={`${labels[i]}: ${value} detections`}
                  >
                    <span className="chart-bar" style={{ height: `${(value / chartMax) * 100}%` }}>
                      <span>{value}</span>
                    </span>
                    <small>{labels[i]}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-insight">
            <Sparkles size={16} />
            <span>
              {chartMode === 'daily'
                ? 'Activity is trending up.'
                : `Peak activity: ${labels[peakIndex]}.`}{' '}
              <span>
                {chartMode === 'daily'
                  ? 'Most detections are people entering your spaces.'
                  : 'Plan patrols around the moments that matter.'}
              </span>
            </span>
          </div>
        </section>
        <section className="panel breakdown-panel">
          <div className="panel-heading">
            <h2>Detection breakdown</h2>
          </div>
          <div
            className="donut-chart"
            style={{
              background: `conic-gradient(${breakdown.map((b, i) => `${b.color} ${breakdown.slice(0, i).reduce((s, x) => s + x.count, 0)}% ${breakdown.slice(0, i + 1).reduce((s, x) => s + x.count, 0)}%`).join(',')})`,
            }}
            role="img"
            aria-label="Detections: 54% people, 28% vehicles, 12% motion, 6% zone intrusions"
          >
            <div>
              <strong>{total.toLocaleString()}</strong>
              <span>Total detections</span>
            </div>
          </div>
          <div className="breakdown-legend">
            {breakdown.map((b) => (
              <div key={b.type}>
                <span className="legend-dot" style={{ background: b.color }} />
                <span>
                  <EventIcon type={b.type} size={14} />
                  {eventLabels[b.type]}
                </span>
                <strong>{b.count}%</strong>
                <small>{b.value}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel camera-activity-panel">
        <div className="panel-heading">
          <div className="panel-title">
            <h2>Camera activity</h2>
            <Badge>Top 4</Badge>
          </div>
          <button className="text-button" onClick={() => navigate('cameras')}>
            All cameras <ChevronRight size={14} />
          </button>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Camera</th>
                <th>Detections</th>
                <th>Activity share</th>
                <th>Alerts</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {cameras.slice(0, 4).map((c, i) => (
                <tr key={c.id}>
                  <td>
                    <div className="table-event-name">
                      <span className="camera-table-thumbnail">
                        <img src={c.image} alt="" />
                      </span>
                      <span>
                        <strong>{c.name}</strong>
                        <small>{c.location}</small>
                      </span>
                    </div>
                  </td>
                  <td className="table-primary">
                    {Math.round(total * [0.32, 0.27, 0.23, 0.18][i])}
                  </td>
                  <td>
                    <div className="activity-share">
                      <span>
                        <i style={{ width: `${[32, 27, 23, 18][i] * 2.5}%` }} />
                      </span>
                      {[32, 27, 23, 18][i]}%
                    </div>
                  </td>
                  <td>{events.filter((e) => e.cameraId === c.id && e.alert).length}</td>
                  <td>
                    <span className="text-green">
                      <ArrowDownRight size={13} className="rotate-180" /> 99.9%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
