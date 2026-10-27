import type { CompilerOptions } from '@vue/compiler-core'

/** The template compiler's option that marks every HTML element of `components/` with `data-grani`. */
export declare const graniElements: Pick<CompilerOptions, 'nodeTransforms'>
