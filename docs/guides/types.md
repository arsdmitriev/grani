# Types

The package is built: `dist` holds JavaScript with a declaration beside every file, one file per
component, so an app bundles what it imports and type-checks the package under its own `tsconfig`
without reading the sources. The sources ship beside the build, to read.

To wrap a component in one of your own, read its props from the component itself:
`InstanceType<typeof UiButton>['$props']`. A component typed over the row (UiDataTable, UiTable,
UiTableToolbar, UiTableColumns) has no instance to take `$props` from: it is a generic function, not
a class, so take its call signature instead, naming the row: `Parameters<typeof UiDataTable<Row>>[0]`.
