import { createMachine, assign } from 'xstate'
import type {
  NumberGuessContextType,
  NumberGuessEventType,
  NumberGuessStateType,
  NotSupportedErrorType,
  UpdateHintType,
} from 'src/machine/types'

const numberGuessMachine = createMachine<
  NumberGuessContextType,
  NumberGuessEventType,
  NumberGuessStateType
>(
  {
    id: 'guessNumber',
    initial: 'verifyingBrowser',
    context: {
      hint: '',
      recognition: null,
      randomNumber: -1,
      error: '',
      isChrome: false,
    },
    states: {
      verifyingBrowser: {
        entry: 'checkBrowser',
        on: {
          NOT_SUPPORTED_ERROR: {
            target: 'failure',
            actions: 'displayError',
          },
          CHECK_READINESS: {
            target: 'playing',
            actions: 'initGame',
            cond: 'isSpeechRecognitionReady',
          },
          NOT_ALLOWED_ERROR: {
            target: 'failure',
            actions: 'displayError',
            cond: 'hasError',
          },
        },
      },
      playing: {
        after: {
          2500: {
            actions: 'clearHint',
            cond: 'hasHint',
          },
        },
        on: {
          SPEAK: {
            target: 'checkNumber',
          },
        },
      },
      checkNumber: {
        invoke: {
          id: 'checkingNumber',
          src: 'checkNumber',
          onDone: {
            actions: 'updateHint',
            target: 'gameOver',
          },
          onError: {
            actions: 'updateHint',
            target: 'playing',
          },
        },
      },
      gameOver: {
        exit: 'initGame',
        on: {
          PLAY_AGAIN: {
            target: 'playing',
          },
          SPEAK: {
            target: 'playing',
            cond: 'isPlayAgain',
          },
        },
      },
      failure: {
        type: 'final',
      },
    },
  },
  {
    actions: {
      checkBrowser: assign({
        isChrome: _ => navigator.userAgent.includes('Chrome'),
      }),
      displayError: assign<NumberGuessContextType, NotSupportedErrorType>({
        error: (_, event) => event.error,
      }) as any,
      initGame: assign({
        hint: _ => '',
        recognition: _ => new window.SpeechRecognition(),
        randomNumber: _ => Math.floor(Math.random() * 100) + 1,
      }),
      updateHint: assign<NumberGuessContextType, UpdateHintType>({
        hint: (_, event) => event.data,
      }) as any,
      clearHint: assign({
        hint: _ => '',
      }),
    },
    guards: {
      hasError(_, event: NumberGuessEventType) {
        if (event.type === 'NOT_ALLOWED_ERROR') {
          return event.error !== ''
        }
        return false
      },
      hasHint(context) {
        return context.hint !== ''
      },
      isUnsupportedBrowser(_, event: NumberGuessEventType) {
        return event.type !== 'NOT_SUPPORTED_ERROR'
      },
      isSpeechRecognitionReady() {
        window.SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition
        return window.SpeechRecognition !== undefined
      },
      isPlayAgain(_, event: NumberGuessEventType) {
        if (event.type === 'SPEAK') {
          return event.message === 'play'
        }
        return false
      },
    },
    services: {
      checkNumber(
        context: NumberGuessContextType,
        event: NumberGuessEventType
      ) {
        if (event.type !== 'SPEAK') {
          return Promise.reject('Acción no válida.')
        }

        const num = +event.message

        if (Number.isNaN(num)) {
          return Promise.reject('Ese no es un número válido, intenta de nuevo')
        }

        if (num > 100 || num < 1) {
          return Promise.reject('El número debe estar entre 1 y 100')
        }

        if (num === context.randomNumber) {
          return Promise.resolve('¡Felicidades has ganado!')
        }

        if (num > context.randomNumber) {
          return Promise.reject('MENOR')
        }

        return Promise.reject('MAYOR')
      },
    },
  }
)

export { numberGuessMachine }
