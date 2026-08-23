// -----------------------------------------------------------------------------
// main.js — the entry point. This runs first and boots the whole app.
// -----------------------------------------------------------------------------
import Vue from 'vue'
import App from './App.vue'

// 1) CSS. Order matters: Bootstrap core first, then BootstrapVue's tweaks,
//    then the icon font. BootstrapVue 2.x is built for Bootstrap 4 (that's why
//    package.json pins bootstrap ^4).
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// 2) Import the BootstrapVue plugin (gives us <b-modal>, <b-button>, etc.)
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// 3) Register it. Vue.use(...) makes those <b-*> components available in EVERY
//    component's template without importing them one by one.
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)

Vue.config.productionTip = false

// 4) Create the root Vue instance and mount it into <div id="app"> from
//    public/index.html. `render: h => h(App)` means "render the App component".
new Vue({
  render: (h) => h(App),
}).$mount('#app')
