import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    // App.css usa light-dark(); com o alvo padrão o minificador a substitui por variáveis
    // que dependem de um color-scheme fixo, e o Mantine define o color-scheme por variável.
    // Navegadores a partir de 2024 suportam light-dark() nativamente.
    cssTarget: ['chrome123', 'edge123', 'firefox120', 'safari18'],
  },
})
