import type { HealthState } from '@/types/digitalTwin'

export const HEALTH_COLORS: Record<HealthState, string> = {
  normal: '#39f7d2',
  warning: '#ffd45c',
  critical: '#ff5578',
}

export function healthLabel(state: HealthState): string {
  if (state === 'normal') return '运行正常'
  if (state === 'warning') return '需要关注'
  return '告警处理中'
}
