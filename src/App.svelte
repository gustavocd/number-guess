<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { interpret } from 'xstate'
  import { realisticLook } from 'src/utils'
  import { numberGuessMachine } from 'src/machine/numberGuess'

  const service = interpret(numberGuessMachine).start()

  function onSpeak(event: SpeechRecognitionEvent) {
    const [result] = event.results
    const [transcripts] = result
    const { transcript: message } = transcripts
    service.send({
      message,
      type: 'SPEAK',
    })
  }

  onMount(() => {
    if (!$service.context.isChrome) {
      return service.send({
        type: 'NOT_SUPPORTED_ERROR',
        error: 'Lo siento, tu navegador no soporta la API SpeechRecognition.',
      })
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        service.send({
          type: 'CHECK_READINESS',
        })

        const recognition = $service.context.recognition
        if (!recognition) {
          return
        }

        recognition.start()
        recognition.addEventListener('result', onSpeak)
        recognition.addEventListener('end', () => recognition.start())
      })
      .catch(() => {
        service.send({
          type: 'NOT_ALLOWED_ERROR',
          error:
            'Por favor, permita el uso del 🎤 para poder jugar. Y después recargue la página.',
        })
      })
  })

  onDestroy(() => {
    $service.context?.recognition?.stop()
    service.stop()
  })

  service.onTransition(state => {
    if (state.matches('gameOver')) {
      realisticLook()
    }
  })
</script>

<section class="container" data-state={$service.toStrings().join(' ')}>
  {#if $service.matches('failure') && !$service.context.isChrome}
    <div>{$service.context.error}</div>
  {/if}
  {#if $service.matches('playing')}
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        class="mic"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>

      <h1>Adivina el número entre 1 y 100</h1>

      <h3>Mencina el número que quieras usando tu micrófono.</h3>

      <div class="msg">
        {$service.context.hint}
      </div>
    </div>
  {/if}
  {#if $service.matches('gameOver')}
    <div>
      <h2>
        {$service.context.hint}
        <br />
        <br />
        El número era: {$service.context.randomNumber}
      </h2>
      <button
        class="play-again"
        on:click={() =>
          service.send({
            type: 'PLAY_AGAIN',
          })}>Play</button
      >
      <p class="mt-1">O menciona "play"</p>
    </div>
  {/if}
  {#if $service.matches('failure') && $service.context.isChrome}
    <div>
      {$service.context.error}
    </div>
  {/if}
</section>
