/**
 * Web Audio API Sound Helper
 * Synthesizes premium chimes for restaurant events without external assets.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

/**
 * Play a custom synthesized audio tone
 */
function playChimeTone(
  ctx: AudioContext, 
  frequency: number, 
  startTime: number, 
  volume: number,
  type: OscillatorType = 'sine',
  decayTime = 0.8
) {
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc.connect(gainNode)
  gainNode.connect(ctx.destination)

  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)

  // Audio envelope: instant attack, exponential decay
  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime)

  osc.start(startTime)
  osc.stop(startTime + decayTime + 0.05)
}

/**
 * 1. New Order (Đơn món mới): Double-chime sweet bell tone
 */
export function playOrderPing() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    
    playChimeTone(ctx, 880, now, 0.4, 'sine', 0.8)      // A5 note
    playChimeTone(ctx, 1046.5, now + 0.12, 0.6, 'sine', 0.8) // C6 note
  } catch (error) {
    console.error("Web Audio API blocked: ", error)
  }
}

/**
 * 2. Call Waiter (Gọi phục vụ): Soft, dual-tone alarm pattern
 */
export function playWaiterCallPing() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime

    // Alternating warm triangle waves (woodier/softer chime alert)
    playChimeTone(ctx, 587.33, now, 0.4, 'triangle', 0.5)      // D5 note
    playChimeTone(ctx, 659.25, now + 0.15, 0.4, 'triangle', 0.5) // E5 note
    playChimeTone(ctx, 587.33, now + 0.3, 0.4, 'triangle', 0.5)  // D5 note
  } catch (error) {
    console.error("Web Audio API blocked: ", error)
  }
}

/**
 * 3. Request Bill (Yêu cầu tính tiền): Rising cash register/coin register sound
 */
export function playBillRequestPing() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime

    // Rapid rising high-pitch coin register sound (crisp sine waves, fast decay)
    playChimeTone(ctx, 1318.51, now, 0.3, 'sine', 0.2)         // E6 note
    playChimeTone(ctx, 1760.00, now + 0.06, 0.4, 'sine', 0.2)  // A6 note
    playChimeTone(ctx, 2093.00, now + 0.12, 0.5, 'sine', 0.4)  // C7 note
  } catch (error) {
    console.error("Web Audio API blocked: ", error)
  }
}
