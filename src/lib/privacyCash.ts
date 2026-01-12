// Pay a link (stub, to be implemented)
import { supabase } from './supabaseClient';
import { PaymentLink, AmountType, LinkUsageType, Token } from './types';

// Full Supabase sync logic for on-chain payment
export async function payLink(linkId: string, payer_wallet: string, amount: number, tx_hash?: string): Promise<{ success: boolean }> {
  // STEP 1: Validate & fetch payment link
  if (!linkId || !payer_wallet || !amount) {
    throw new Error("linkId, payer_wallet, and amount are required");
  }
  
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  try {
    // Fetch payment link by link_id
    const { data: links, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('link_id', linkId)
      .limit(1);
    
    if (linkError) {
      console.error("Error fetching link:", linkError);
      throw new Error(`Failed to fetch payment link: ${linkError.message}`);
    }
    
    if (!links || links.length === 0) {
      throw new Error(`Payment link not found: ${linkId}`);
    }

    const link: any = links[0];

    // Validate link status
    if (link.status !== 'active') {
      throw new Error(`Link is not active. Current status: ${link.status}`);
    }

    // Validate one-time link hasn't been used
    if (link.link_usage_type === 'one-time' && link.payment_count >= 1) {
      throw new Error('One-time link has already been paid. Cannot reuse.');
    }

    // STEP 2: Insert payment record (on-chain proof)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        link_id: link.id,
        payer_wallet,
        amount,
        tx_hash: tx_hash || null,
        paid_at: new Date().toISOString(),
      }])
      .select();

    if (paymentError) {
      console.error("Error inserting payment:", paymentError);
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    if (!payment || payment.length === 0) {
      throw new Error("Payment record created but could not be retrieved");
    }

    console.log("✅ Payment recorded:", payment[0]);

    // STEP 3: Increment payment_count & update status if needed
    const newPaymentCount = (link.payment_count || 0) + 1;
    const updateFields: any = { 
      payment_count: newPaymentCount,
      updated_at: new Date().toISOString(),
    };

    // STEP 5: If one-time link, mark as paid after first payment
    if (link.link_usage_type === 'one-time') {
      updateFields.status = 'paid';
    }

    const { error: updateLinkError } = await supabase
      .from('payment_links')
      .update(updateFields)
      .eq('id', link.id);

    if (updateLinkError) {
      console.error("Error updating payment_links:", updateLinkError);
      throw new Error(`Failed to update link: ${updateLinkError.message}`);
    }

    console.log(`✅ Link updated: payment_count=${newPaymentCount}, status=${updateFields.status || link.status}`);

    // STEP 4: Update or create balance for link creator
    // First, try to fetch existing balance
    const { data: balData, error: balFetchError } = await supabase
      .from('balances')
      .select('id, balance')
      .eq('user_id', link.creator_id)
      .single();

    let balanceUpdateError = null;

    if (balFetchError && balFetchError.code !== 'PGRST116') {
      // PGRST116 = "not found" (expected if no balance row yet)
      console.error("Error fetching balance:", balFetchError);
      throw new Error(`Failed to fetch balance: ${balFetchError.message}`);
    }

    // Determine new balance
    const newBalance = balData 
      ? Number(balData.balance) + Number(amount)
      : Number(amount);

    if (balData) {
      // Update existing balance row
      const { error: updBalError } = await supabase
        .from('balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', link.creator_id);

      if (updBalError) {
        console.error("Error updating balance:", updBalError);
        balanceUpdateError = updBalError;
      }
    } else {
      // Create new balance row
      const { error: insBalError } = await supabase
        .from('balances')
        .insert([{
          user_id: link.creator_id,
          balance: newBalance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (insBalError) {
        console.error("Error creating balance:", insBalError);
        balanceUpdateError = insBalError;
      }
    }

    if (balanceUpdateError) {
      throw new Error(`Failed to update balance: ${balanceUpdateError.message}`);
    }

    console.log(`✅ Balance updated for ${link.creator_id}: ${newBalance}`);

    // STEP 6: Return success
    console.log(`✅ Payment synced successfully for link ${linkId}`);
    return { success: true };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ payLink failed:", message);
    throw err;
  }
}
import { createPaymentLink, getAllPaymentLinks } from './supabasePayment';
// ...existing code...

export async function createPrivateLink(opts: {
  amount?: string;
  token?: string;
  amountType?: AmountType;
  linkUsageType?: LinkUsageType;
  expiresIn?: number; // milliseconds, optional
  creator_id: string;
}): Promise<PaymentLink> {
  const linkId = Math.random().toString(36).slice(2, 9);
  const url = `${window.location.origin}/pay/${linkId}`;
  await createPaymentLink({
    creator_id: opts.creator_id,
    link_id: linkId,
    amount: opts.amount,
    token: (opts.token || 'SOL') as Token,
  });
  return {
    linkId,
    url,
    amountType: opts.amountType || 'fixed',
    linkUsageType: opts.linkUsageType || 'one-time',
    amount: opts.amount,
    token: (opts.token || 'SOL') as Token,
    status: 'active',
    createdAt: Date.now(),
    paymentCount: 0,
    expiresAt: opts.expiresIn ? Date.now() + opts.expiresIn : undefined
  };
}

export async function getLinkDetails(linkId?: string | null): Promise<PaymentLink | null> {
  if (!linkId) return null;
  const links = await getAllPaymentLinks();
  return links.find((l: any) => l.linkId === linkId) || null;
}

// ...existing code...
