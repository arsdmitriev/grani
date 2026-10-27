import { describe, expect, it } from 'vitest'
import { scaleRamp, scaleRampStep } from './scaleRamp'

describe('scaleRamp', () => {
  it('the low half runs danger to warning, the high half warning to success', () => {
    expect(scaleRamp(0)).toEqual({ half: 'low', mix: '100%' })
    expect(scaleRamp(0.25)).toEqual({ half: 'low', mix: '50%' })
    expect(scaleRamp(0.5)).toEqual({ half: 'high', mix: '100%' })
    expect(scaleRamp(1)).toEqual({ half: 'high', mix: '0%' })
  })
  it('clamps', () => {
    expect(scaleRamp(-1)).toEqual({ half: 'low', mix: '100%' })
    expect(scaleRamp(2)).toEqual({ half: 'high', mix: '0%' })
  })

  it('a numbered ramp takes the nearest of five stops and the ink that reads on it', () => {
    expect(scaleRampStep(0)).toEqual({ half: 'low', mix: '100%', ink: 'light' })
    expect(scaleRampStep(0.3)).toEqual({ half: 'low', mix: '50%', ink: 'dark' })
    expect(scaleRampStep(0.5)).toEqual({ half: 'high', mix: '100%', ink: 'dark' })
    expect(scaleRampStep(0.7)).toEqual({ half: 'high', mix: '50%', ink: 'dark' })
    expect(scaleRampStep(1)).toEqual({ half: 'high', mix: '0%', ink: 'light' })
  })
})
