# Hard Delete Implementation Guide

## 🔥 Overview

Your meal planner now uses **hard delete** (permanent deletion) instead of soft delete. This is GDPR/CCPA compliant from day one.

---

## ✅ What Happens When User is Deleted:

```typescript
await dataAccess.deleteUser(userId)
```

**Automatically deleted (CASCADE):**
1. ✅ User profile (all personal data)
2. ✅ All sessions (including current meal plans)
3. ✅ All saved meal plans

**Result:** User and ALL their data is permanently gone.

---

## 🔄 Database CASCADE Configuration

Your schema already has CASCADE set up:

```sql
CREATE TABLE sessions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- When user deleted → all sessions auto-deleted
);

CREATE TABLE meal_plans (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- When user deleted → all meal plans auto-deleted
);
```

---

## 📋 Implementation Details

### **Current Implementation:**

```typescript
async deleteUser(userId: string): Promise<boolean> {
  // Hard delete - permanently remove user
  const { error } = await this.supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Error deleting user:', error.message)
    return false
  }

  console.log(`✅ User ${userId} permanently deleted`)
  return true
}
```

### **What Gets Deleted:**

```
users (id: user-123)
  └─ DELETE
      ↓
sessions (user_id: user-123)  [CASCADE]
  └─ All deleted automatically
      ↓
meal_plans (user_id: user-123)  [CASCADE]
  └─ All deleted automatically
```

---

## 🚀 How to Use in Your App

### **1. Settings Page - Delete Account**

```typescript
// API Route: /api/account/delete
import { authenticateUser } from './middleware/auth'
import { getDataAccess } from './data/data-access'

app.post('/api/account/delete', authenticateUser, async (req, res) => {
  const userId = req.user.id
  
  try {
    // Delete user (and all their data via CASCADE)
    const success = await getDataAccess().deleteUser(userId)
    
    if (success) {
      // Log out user
      req.session.destroy()
      
      res.json({ 
        success: true, 
        message: 'Account permanently deleted' 
      })
    } else {
      res.status(500).json({ error: 'Failed to delete account' })
    }
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### **2. Frontend - Delete Button**

```tsx
// AccountSettings.tsx
import { useState } from 'react'

export function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Redirect to goodbye page
        window.location.href = '/goodbye'
      } else {
        alert('Failed to delete account. Please contact support.')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Error deleting account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="danger-zone">
      <h3>Delete Account</h3>
      <p>
        Once you delete your account, there is no going back. 
        All your data will be permanently removed.
      </p>
      
      {!showConfirm ? (
        <button 
          onClick={() => setShowConfirm(true)}
          className="btn-danger"
        >
          Delete My Account
        </button>
      ) : (
        <div className="confirm-delete">
          <p><strong>Are you absolutely sure?</strong></p>
          <p>This action cannot be undone. All your meal plans will be lost.</p>
          
          <div className="button-group">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-danger"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
            </button>
            
            <button 
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 🔒 Security Considerations

### **1. Require Re-authentication**

For extra security, require users to re-enter their password:

```typescript
app.post('/api/account/delete', authenticateUser, async (req, res) => {
  const { password } = req.body
  const userId = req.user.id
  
  // Verify password before deletion
  const passwordValid = await verifyPassword(userId, password)
  
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid password' })
  }
  
  // Proceed with deletion
  await getDataAccess().deleteUser(userId)
  res.json({ success: true })
})
```

### **2. Rate Limiting**

Prevent abuse:

```typescript
import rateLimit from 'express-rate-limit'

const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 attempts per hour
  message: 'Too many deletion attempts. Please try again later.'
})

app.post('/api/account/delete', deleteAccountLimiter, authenticateUser, ...)
```

---

## 📊 Optional: Audit Logging

For compliance, log deletions:

```sql
-- Create audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
```

```typescript
async deleteUser(userId: string): Promise<boolean> {
  // Get user info before deletion (for audit log)
  const user = await this.findUserById(userId)
  
  if (!user) return false
  
  // Log deletion for audit trail
  await this.supabase.from('audit_log').insert({
    action: 'USER_DELETED',
    user_id: userId,
    user_email: user.profile.email,
    timestamp: new Date().toISOString()
  })
  
  // Delete user
  const { error } = await this.supabase
    .from('users')
    .delete()
    .eq('id', userId)
  
  return !error
}
```

---

## ⚖️ GDPR/CCPA Compliance

Your implementation is compliant because:

✅ **Right to Erasure** - Users can delete their account  
✅ **Complete Deletion** - All personal data is removed  
✅ **Cascade Deletion** - Related data is automatically deleted  
✅ **No Recovery** - Data is permanently gone (as required)  

### **Privacy Policy Language:**

```
Data Deletion

You have the right to request deletion of your personal data at any time. 
To delete your account:
1. Go to Settings > Account
2. Click "Delete My Account"
3. Confirm deletion

Once deleted, all your data will be permanently removed from our servers 
within 24 hours and cannot be recovered. This includes:
- Your profile information
- All meal plans you've created
- All preferences and history

Alternatively, you can email us at privacy@yourapp.com to request deletion.
```

---

## 🧪 Testing

### **Test the deletion flow:**

```typescript
// test-deletion.ts
import { SupabaseDataAccess } from './data/supabase-data-access'
import { createNewUser } from './core/user-schemas'

async function testDeletion() {
  const dataAccess = new SupabaseDataAccess()
  
  // 1. Create test user
  const user = await dataAccess.createUser(createNewUser({
    email: 'delete-test@example.com',
    name: 'Delete Test',
    diet: 'omnivore',
    calorieTarget: 2000,
    cookingSkill: 'beginner'
  }))
  console.log('✅ User created:', user.id)
  
  // 2. Create session
  const session = await dataAccess.createSession(user.id)
  console.log('✅ Session created:', session.id)
  
  // 3. Create meal plan
  const mealPlan = { /* ... */ }
  const savedPlan = await dataAccess.saveMealPlan(user.id, mealPlan)
  console.log('✅ Meal plan created:', savedPlan.id)
  
  // 4. Verify everything exists
  const checkUser = await dataAccess.findUserById(user.id)
  const checkSession = await dataAccess.findSessionById(session.id)
  const checkPlan = await dataAccess.findMealPlanById(savedPlan.id)
  console.log('✅ All data exists before deletion')
  
  // 5. DELETE USER
  await dataAccess.deleteUser(user.id)
  console.log('🔥 User deleted')
  
  // 6. Verify everything is gone
  const afterUser = await dataAccess.findUserById(user.id)
  const afterSession = await dataAccess.findSessionById(session.id)
  const afterPlan = await dataAccess.findMealPlanById(savedPlan.id)
  
  console.log('User exists:', !!afterUser) // Should be false
  console.log('Session exists:', !!afterSession) // Should be false
  console.log('Plan exists:', !!afterPlan) // Should be false
  
  if (!afterUser && !afterSession && !afterPlan) {
    console.log('✅ CASCADE deletion working perfectly!')
  } else {
    console.error('❌ Something not deleted properly!')
  }
}

testDeletion()
```

---

## 🎯 Summary

✅ **Hard delete implemented**  
✅ **CASCADE configured** - Related data auto-deleted  
✅ **GDPR/CCPA compliant** from day one  
✅ **No risk of data retention issues**  
✅ **Simple implementation** - One method call  

Your users can delete their accounts and ALL their data is permanently removed! 🚀

---

## 📚 Related Files

- `supabase-data-access.ts` - deleteUser() implementation
- `supabase-schema-aligned.sql` - CASCADE configuration
- Privacy policy template (add to your website)