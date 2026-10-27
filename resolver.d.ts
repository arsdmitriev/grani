/**
 * For `unplugin-vue-components`: `<UiButton>` in a template imports `UiButton` from `grani-ui`, as
 * an app would by hand. `Components({ resolvers: [GraniResolver()] })`. A `Ui` name this package
 * does not have is left to the next resolver.
 */
export declare function GraniResolver(): (
  name: string,
) => { name: string; from: 'grani-ui' } | undefined
