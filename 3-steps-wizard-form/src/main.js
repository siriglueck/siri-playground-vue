import { createApp } from 'vue'

// Custom Bootstrap 5 build (dark-grey primary). We control components (modal,
// etc.) via Vue state, so we only need the CSS here — no Bootstrap JS bundle.
import './styles/custom.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'

import App from './App.vue'

createApp(App).mount('#app')
