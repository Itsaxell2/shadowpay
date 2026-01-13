# URGENT: Create Supabase Table

The app is failing because `payment_links` table doesn't exist in Supabase.

## Steps to Fix (5 minutes):

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select project: `shadowpay` 
   - Click **SQL Editor**

2. **Create Table**
   - Copy-paste content from `SUPABASE_MIGRATION.sql` (in this folder)
   - Click **Run** (or Ctrl+Enter)
   - Wait for success message

3. **Verify**
   - Go to **Table Editor**
   - Confirm `payment_links` table exists
   - Confirm columns: id, creator_id, amount, paid, etc.

4. **Backend Will Auto-Sync**
   - Once table exists, Railway will automatically save links there
   - Links will be persistent (won't disappear on restart)

5. **Test Again**
   - Create payment link via https://shadowpay-seven.vercel.app/create
   - Pay it
   - Check Dashboard - should show link + balance

## If Stuck:
- Check Supabase logs for errors
- Ensure RLS policies are enabled
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in Railway env vars
