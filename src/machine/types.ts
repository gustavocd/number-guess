export type NumberGuessContextType = {
  recognition: SpeechRecognition | null
  randomNumber: number
  hint: string
  error: string
  isChrome: boolean
}

export type NotSupportedErrorType = {
  type: 'NOT_SUPPORTED_ERROR'
  error: string
}

export type CheckReadinessType = {
  type: 'CHECK_READINESS'
}

type NotAllowedErrorType = {
  type: 'NOT_ALLOWED_ERROR'
  error: string
}

type SpeakType = {
  type: 'SPEAK'
  message: string
}

type PlayAgainType = {
  type: 'PLAY_AGAIN'
}

export type UpdateHintType = {
  type: 'UPDATE_HINT'
  data: string
}

export type NumberGuessEventType =
  | NotSupportedErrorType
  | CheckReadinessType
  | NotAllowedErrorType
  | SpeakType
  | PlayAgainType
  | UpdateHintType

export type NumberGuessStateType = {
  context: NumberGuessContextType
  value: 'verifyingBrowser' | 'failure' | 'playing' | 'checkNumber' | 'gameOver'
}
