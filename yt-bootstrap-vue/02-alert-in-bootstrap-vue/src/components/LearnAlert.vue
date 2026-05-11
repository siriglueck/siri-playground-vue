<template>
  <b-container>
    <b-alert> Without the show prop, this alert will not be visible. </b-alert>

    <b-alert show> Default alert showing up here! </b-alert>

    <b-alert show variant="warning">
      This is an alert with a warning variant!
    </b-alert>

    <b-alert show variant="danger">
      This is an alert with a danger variant!
    </b-alert>

    <b-alert :show="success_show" fade variant="success">
      Success alert showing up here with fade!
    </b-alert>
    <span @click="toggle_success_alert" style="cursor: pointer"
      >Toggle success alert</span
    >

    <b-alert show variant="danger" dismissible
      >Danger alert with dismissible
    </b-alert>

    <b-alert show variant="danger" @dismissed="dismissed_callback" dismissible
      >Danger alert with dismissible with callback
    </b-alert>

    <b-alert
      :show="dismissCountDown"
      dismissible
      variant="warning"
      @dismissed="dismissCountDown = 0"
      @dismiss-count-down="countDownChanged"
    >
      This alert will dismiss after {{ dismissCountDown }} seconds...
    </b-alert>
    <b-button @click="showAlert" variant="info" class="m-1">
      Show alert with count-down timer
    </b-button>
  </b-container>
</template>

<script>
export default {
  name: "LearnAlert",
  data() {
    return {
      success_show: false,
      dismissSecs: 5,
      dismissCountDown: 0,
    };
  },
  methods: {
    toggle_success_alert() {
      this.success_show = !this.success_show;
    },

    dismissed_callback() {
      console.log("Thanks for triggering the dismissed callback!");
    },

    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown;
    },
    showAlert() {
      this.dismissCountDown = this.dismissSecs;
    },
  },
};
</script>