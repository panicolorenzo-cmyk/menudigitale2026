import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateStock, notificationTimes, registerIntake } from './medication.ts';

test('calcola la scorta attraverso carichi, assunzioni, rettifiche e annullamenti', () => {
  assert.equal(calculateStock([{ quantity: 30 }, { quantity: -4 }, { quantity: -2 }, { quantity: 2 }]), 26);
});

test('impedisce la doppia registrazione della stessa dose', () => {
  const dose = { scheduleId: 'mattina', scheduledAt: '2026-07-25T08:00:00Z' };
  assert.equal(registerIntake([dose], dose).length, 1);
});

test('programma il secondo promemoria dopo l’intervallo configurato', () => {
  const [first, second] = notificationTimes(new Date('2026-07-25T08:00:00Z'), 20);
  assert.equal(first.toISOString(), '2026-07-25T08:00:00.000Z');
  assert.equal(second.toISOString(), '2026-07-25T08:20:00.000Z');
});
