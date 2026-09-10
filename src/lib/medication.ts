export interface StockMovement { quantity: number }
export interface Intake { scheduleId: string; scheduledAt: string }

export const calculateStock = (movements: StockMovement[]) =>
  movements.reduce((total, movement) => total + movement.quantity, 0);

export const registerIntake = (intakes: Intake[], intake: Intake) => {
  const duplicate = intakes.some((item) =>
    item.scheduleId === intake.scheduleId && item.scheduledAt === intake.scheduledAt
  );
  return duplicate ? intakes : [...intakes, intake];
};

export const notificationTimes = (scheduledAt: Date, secondReminderMinutes: number) => [
  new Date(scheduledAt),
  new Date(scheduledAt.getTime() + secondReminderMinutes * 60_000),
];
