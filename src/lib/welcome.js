import { readJSON, writeJSON } from './storage.js'

// The landing page is shown once, to someone who has never picked a profile.
export const hasWelcomed = () => readJSON('mf_welcomed', false) === true

export const markWelcomed = () => writeJSON('mf_welcomed', true)
