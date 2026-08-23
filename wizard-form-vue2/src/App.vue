<!--
  App.vue — the root component (the "first page").

  Its job here is small and deliberate:
    • show ONE button
    • own whether the modal is open (`showModal`)
    • host the wizard

  App owns `showModal`. It passes it to the wizard with `:visible.sync`, which is
  shorthand for BOTH:
      :visible="showModal"                (send the value DOWN)
      @update:visible="showModal = $event" (receive changes back UP)
  So when the wizard closes itself (X, Esc, Abbrechen), `showModal` flips to false
  automatically. That's props-down / events-up in one tidy line.
-->
<template>
  <div id="app" class="container py-5">
    <h1 class="h3 mb-1">Unfallmeldung</h1>
    <p class="text-muted">Ein 3-Schritte-Assistent (Vue 2 + BootstrapVue).</p>

    <!-- The single button that opens the wizard. -->
    <b-button variant="primary" @click="showModal = true">
      <i class="bi bi-plus-lg"></i> Neuen Unfall melden
    </b-button>

    <!-- The wizard. `.sync` keeps App's showModal and the modal in agreement.
         @submit receives the finished JSON payload (event UP from the wizard). -->
    <WizardModal :visible.sync="showModal" @submit="onSubmit" />

    <!-- Show the last delivered payload so we can SEE the JSON the backend gets.
         In a real app this is where you'd POST it to the API instead. -->
    <div v-if="lastPayload" class="mt-4">
      <h2 class="h5">Gesendetes JSON (an Backend)</h2>
      <pre class="bg-light border rounded p-3"><code>{{ prettyPayload }}</code></pre>
    </div>
  </div>
</template>

<script>
import WizardModal from './components/WizardModal.vue'

export default {
  name: 'App',

  components: { WizardModal },

  data() {
    return {
      showModal: false, // is the wizard open?
      lastPayload: null, // the most recent JSON the wizard delivered
    }
  },

  computed: {
    // Pretty-print the payload for display (2-space indent).
    prettyPayload() {
      return JSON.stringify(this.lastPayload, null, 2)
    },
  },

  methods: {
    // The wizard finished: it handed us the final JSON. In a real app we'd
    // POST it here (await api.post('/incidents', payload)). For now we store it
    // so the template can display it.
    onSubmit(payload) {
      this.lastPayload = payload
      // eslint-disable-next-line no-console
      console.log('Payload an Backend:', payload)
    },
  },
}
</script>
