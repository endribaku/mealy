import { mockUsers } from '../mocks/mock-users.js'
import { mockSessions } from '../mocks/mock-sessions.js'

console.log('Testing mock data...\n')

console.log('Mock Users:')
Object.keys(mockUsers).forEach(key => {
  const user = mockUsers[key]
  console.log(`  ${key}: ${user!.profile.diet}, ${user!.metadata.totalRatings} ratings`)
})

console.log('\nMock Sessions:')
Object.keys(mockSessions).forEach(key => {
  const session = mockSessions[key]
  console.log(`  ${key}: ${session!.modifications.length} modifications`)
})

console.log('\nMock data loaded successfully')