import Vue from 'vue'
import App from './App.vue'

// 1. import Bootstrap-Vue
import { BootstrapVue, IconsPlugin} from 'bootstrap-vue'

// 2. import css
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// 3. register BootstrapVue 
// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
