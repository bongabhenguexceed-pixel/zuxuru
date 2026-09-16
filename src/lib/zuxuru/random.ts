// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
//
// Shared deterministic pseudo-random utilities used by every Zuxuru
// engine layer that needs to simulate an external signal (investigation,
// execution, monitoring). Seeded by business/action identity so repeated
// calls for the same entity are reproducible instead of flaky.

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rng(seedStr: string) {
  return mulberry32(hashSeed(seedStr))
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function slugHandle(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'business'
}
