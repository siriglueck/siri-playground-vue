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

    <!-- The wizard. `.sync` keeps App's showModal and the modal in agreement. -->
    <WizardModal :visible.sync="showModal" />
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
    }
  },
}
</script>
