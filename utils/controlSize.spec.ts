import { describe, expect, it } from 'vitest'
import {
  CONTROL_HEIGHT,
  controlHeightClass,
  controlMinHeightClass,
  DEFAULT_CONTROL_SIZE,
} from './controlSize'

describe('control size ladder', () => {
  it('is 28, 36, 44 with sm as the default', () => {
    expect(CONTROL_HEIGHT).toEqual({ xs: 28, sm: 36, md: 44 })
    expect(DEFAULT_CONTROL_SIZE).toBe('sm')
  })

  it('maps every step to a class', () => {
    for (const step of Object.keys(CONTROL_HEIGHT)) {
      expect(controlHeightClass[step as keyof typeof controlHeightClass]).toMatch(/^h-/)
    }
  })

  it('the floor of every step is the same step as the height', () => {
    for (const step of Object.keys(CONTROL_HEIGHT) as (keyof typeof CONTROL_HEIGHT)[]) {
      expect(controlMinHeightClass[step]).toBe(`min-${controlHeightClass[step]}`)
    }
  })
})
