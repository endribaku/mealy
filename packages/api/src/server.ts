import { createProductionApp } from './app/create-production-app'

const app = createProductionApp()

app.listen(3000, () => {
  console.log('Server running on port 3000')
})

