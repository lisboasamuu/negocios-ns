export type MinuteRange = {
  start: number;
  end: number;
};

export type SlotEngineInput = {
  date: string;
  durationMinutes: number;
  intervalMinutes: number;
  businessHours: MinuteRange[];
  appointments?: MinuteRange[];
  blockedPeriods?: MinuteRange[];
  now?: { date: string; minute: number };
};

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function rangesOverlap(first: MinuteRange, second: MinuteRange) {
  return first.start < second.end && second.start < first.end;
}

export function generateAvailableSlots({
  date,
  durationMinutes,
  intervalMinutes,
  businessHours,
  appointments = [],
  blockedPeriods = [],
  now,
}: SlotEngineInput) {
  if (durationMinutes <= 0 || intervalMinutes <= 0) return [];
  if (now && date < now.date) return [];

  const unavailable = [...appointments, ...blockedPeriods];
  const slots: MinuteRange[] = [];

  for (const period of businessHours) {
    for (
      let start = period.start;
      start + durationMinutes <= period.end;
      start += intervalMinutes
    ) {
      const candidate = { start, end: start + durationMinutes };
      if (now && date === now.date && candidate.start <= now.minute) continue;
      if (unavailable.some((range) => rangesOverlap(candidate, range))) continue;
      slots.push(candidate);
    }
  }

  return slots;
}

export function mapBookingError(message?: string) {
  if (!message) return "Não foi possível confirmar o agendamento. Tente novamente.";
  if (message.includes("slot_conflict")) {
    return "Esse horário acabou de ser reservado. Escolha outro horário.";
  }
  if (message.includes("service_inactive")) {
    return "Esse serviço não está mais disponível. Escolha outro serviço.";
  }
  if (message.includes("outside_business_hours")) {
    return "Esse não é um horário válido de atendimento. Escolha uma opção exibida na agenda.";
  }
  if (message.includes("blocked_period")) {
    return "Esse período foi bloqueado pela clínica. Escolha outro horário.";
  }
  return "Não foi possível confirmar o agendamento. Seus dados foram preservados para você tentar novamente.";
}
