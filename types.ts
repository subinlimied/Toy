
export enum GamePhase {
  IDLE = 'IDLE',
  DISCUSSION = 'DISCUSSION',
  VOTING = 'VOTING',
}

export interface TTSState {
  isLoading: boolean;
  error: string | null;
}
