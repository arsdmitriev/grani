import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { graniElements } from './scripts/elements.mjs'

// Every spec reads the clock in UTC, whatever zone the machine is in, so a run on one laptop is a
// run on any other. The date specs run again in the two zones furthest apart, +14 and -11, where
// "today" in UTC is already tomorrow or still yesterday: a spec right only in UTC fails there.
process.env.TZ = 'UTC'
const ZONES = ['Pacific/Kiritimati', 'Pacific/Pago_Pago']
const DATE_SPECS = [
  'components/UiCalendar.spec.ts',
  'components/UiDataTable.spec.ts',
  'components/UiDateCell.spec.ts',
  'components/UiDatePicker.spec.ts',
  'components/UiDateRange.spec.ts',
  'components/UiLog.spec.ts',
  'composables/useToday.spec.ts',
  'composables/useUiT.spec.ts',
  'utils/calendar.spec.ts',
  'utils/chartFormat.spec.ts',
  'utils/dateRange.spec.ts',
  'utils/dateValue.spec.ts',
]
const SETUP = [fileURLToPath(new URL('./test/setup.ts', import.meta.url))]

// The specs alone mark the demos' own elements `data-demo`, so `test/dataGrani.spec.ts` tells
// what a demo writes from what grani draws. The library and the showcase builds never take it.
const demos = fileURLToPath(new URL('./demos/', import.meta.url))
const markDemo = (node: any, context: { filename: string }) => {
  if (node.type !== 1 || node.tagType !== 0 || node.ns !== 0) return
  if (!context.filename.startsWith(demos)) return
  node.props.push({
    type: 6,
    name: 'data-demo',
    value: undefined,
    loc: node.loc,
    nameLoc: node.loc,
  })
}

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: { nodeTransforms: [...graniElements.nodeTransforms, markDemo] },
      },
    }),
  ],
  test: {
    globals: true,
    // A `.only` left in a spec would quietly skip the rest of the suite.
    allowOnly: false,
    // The package's own code, measured by the unit specs in the source repository's gates, never
    // below these floors. They only rise: the coverage ratchet writes the new numbers when the
    // coverage grows, and the change is committed like any other. The dates, the addresses and the
    // waits are held higher, file by file.
    coverage: {
      provider: 'v8',
      include: ['components/**', 'composables/**', 'utils/**'],
      exclude: ['**/*.spec.ts', '.playground/**', 'demos/**'],
      thresholds: {
        lines: 97,
        statements: 96,
        functions: 97,
        branches: 92,
        // A key per file: vitest checks the files of one key together, so each of these is its own.
        ...Object.fromEntries(
          [
            'utils/calendar.ts',
            'utils/dateValue.ts',
            'utils/dateRange.ts',
            'utils/link.ts',
            'utils/routeLink.ts',
            'utils/debounce.ts',
            'utils/announce.ts',
            'utils/liveText.ts',
            'utils/sharedSeed.ts',
            'composables/useSubmitLock.ts',
            'composables/useClipboard.ts',
            'composables/useToday.ts',
          ].map((f) => [f, { lines: 95, branches: 84 }]),
        ),
      },
    },
    projects: [
      {
        // The specs in a browser-like page: happy-dom and the harness.
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: [
            'components/**/*.spec.ts',
            'composables/**/*.spec.ts',
            'utils/**/*.spec.ts',
            'i18n/**/*.spec.ts',
            'test/**/*.spec.ts',
          ],
          exclude: ['node_modules/**', 'test/ssr/**'],
          setupFiles: SETUP,
          env: { TZ: 'UTC' },
        },
      },
      ...ZONES.map((zone) => ({
        extends: true as const,
        test: {
          name: zone,
          environment: 'happy-dom' as const,
          include: DATE_SPECS,
          setupFiles: SETUP,
          env: { TZ: zone },
        },
      })),
      {
        // The server: plain Node, no window, no document, no harness.
        extends: true,
        test: {
          name: 'ssr',
          environment: 'node',
          include: ['test/ssr/**/*.ssr.spec.ts'],
          exclude: ['node_modules/**'],
          env: { TZ: 'UTC' },
        },
      },
    ],
  },
})
