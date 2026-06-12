import { createClient } from '@supabase/supabase-js';

// Read connection configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Connection status validator
export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL_HERE' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE';

// Instantiate Supabase client safely
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Seed data
const DEFAULT_BANK_DETAILS = {
  bankName: 'HDFC Bank',
  accountNo: '50100412345678',
  ifsc: 'HDFC0000123',
  upiId: 'assetraheights@upi'
};

// Seeding engine to bootstrap fresh databases with demo registries
export async function initDB() {
  if (!isSupabaseConfigured) return;

  try {
    // Check if buildings table is empty
    const { count, error } = await supabase
      .from('buildings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Failed to inspect database state:', error);
      return;
    }

    if (count === 0) {
      console.log('Database empty. Bootstrapping seed dataset AST-1001 (Assetra Heights)...');

      // 1. Insert Building
      const { error: bErr } = await supabase.from('buildings').insert([{
        code: 'AST-1001',
        name: 'Assetra Heights',
        base_maintenance: 4000,
        admin_name: 'Manoj Rathod',
        admin_username: 'mrathod@gmail.com',
        admin_password: 'manoj',
        bank_name: DEFAULT_BANK_DETAILS.bankName,
        account_no: DEFAULT_BANK_DETAILS.accountNo,
        ifsc: DEFAULT_BANK_DETAILS.ifsc,
        upi_id: DEFAULT_BANK_DETAILS.upiId
      }]);

      if (bErr) throw bErr;

      // 2. Insert Seed Flats
      const seedFlats = [
        { building_code: 'AST-1001', flat_no: 'A-101', head_name: 'Vikram Malhotra', monthly_charge: 4000, outstanding_dues: 8000, phone: '+91 98100 12345', email: 'vikram.malhotra@gmail.com', last_payment_date: '2026-04-02', oldest_due_date: '2026-04-05', username: 'vikram', password: 'password' },
        { building_code: 'AST-1001', flat_no: 'B-304', head_name: 'Ananya Deshmukh', monthly_charge: 3500, outstanding_dues: 17500, phone: '+91 98200 54321', email: 'ananya.d@yahoo.com', last_payment_date: '2025-12-05', oldest_due_date: '2026-01-05', username: 'ananya', password: 'password' },
        { building_code: 'AST-1001', flat_no: 'C-202', head_name: 'Amitabh Sharma', monthly_charge: 4500, outstanding_dues: 0, phone: '+91 98300 98765', email: 'sharma.amitabh@outlook.com', last_payment_date: '2026-06-02', oldest_due_date: '', username: 'amitabh', password: 'password' },
        { building_code: 'AST-1001', flat_no: 'B-105', head_name: 'Sanjay Dutt', monthly_charge: 3500, outstanding_dues: 10500, phone: '+91 99800 11111', email: 'sanjay.dutt@gmail.com', last_payment_date: '2026-03-04', oldest_due_date: '2026-03-05', username: 'sanjay', password: 'password' },
        { building_code: 'AST-1001', flat_no: 'A-402', head_name: 'Rohit Verma', monthly_charge: 4000, outstanding_dues: 28000, phone: '+91 99200 33333', email: 'rohit.v@gmail.com', last_payment_date: '2025-10-03', oldest_due_date: '2025-11-05', username: 'rohit', password: 'password' },
        { building_code: 'AST-1001', flat_no: 'C-102', head_name: 'Meera Nair', monthly_charge: 3800, outstanding_dues: 3800, phone: '+91 99100 22222', email: 'meera.nair@live.com', last_payment_date: '2026-05-04', oldest_due_date: '2026-06-05', username: 'meera', password: 'password' }
      ];

      const { error: fErr } = await supabase.from('flats').insert(seedFlats);
      if (fErr) throw fErr;

      // 3. Insert Seed Reminders
      const seedReminders = [
        { id: 'rem-1', building_code: 'AST-1001', flat_no: 'A-101', date: '2026-05-06 10:15 AM', subject: 'Assetra Dues Alert - A-101', monthly_charge: 4000, due_charge: 4000, total_due: 8000, content: 'Please pay your pending maintenance dues of ₹8,000 for Flat A-101. Monthly maintenance: ₹4,000. Overdue charges: ₹4,000.' },
        { id: 'rem-2', building_code: 'AST-1001', flat_no: 'B-304', date: '2026-05-06 10:15 AM', subject: 'Assetra Dues Alert - B-304', monthly_charge: 3500, due_charge: 14000, total_due: 17500, content: 'Heavy overdue warning: Dues of ₹17,500 pending for Flat B-304. Please clear immediately to avoid penalties.' },
        { id: 'rem-3', building_code: 'AST-1001', flat_no: 'A-402', date: '2026-05-06 10:15 AM', subject: 'Assetra Dues Alert - A-402', monthly_charge: 4000, due_charge: 24000, total_due: 28000, content: 'CRITICAL WARNING: Maintenance dues are overdue by 7 months. Total due: ₹28,000.' }
      ];

      const { error: rErr } = await supabase.from('reminders').insert(seedReminders);
      if (rErr) throw rErr;

      // 4. Insert Seed Payments
      const seedPayments = [
        { building_code: 'AST-1001', flat_no: 'A-101', date: '2026-04-02', amount: 4000, method: 'Card' },
        { building_code: 'AST-1001', flat_no: 'C-202', date: '2026-06-02', amount: 4500, method: 'UPI' },
        { building_code: 'AST-1001', flat_no: 'C-102', date: '2026-05-04', amount: 3800, method: 'Net Banking' }
      ];

      const { error: pErr } = await supabase.from('payments').insert(seedPayments);
      if (pErr) throw pErr;

      console.log('Database seeded successfully.');
    }
  } catch (err) {
    console.error('Failed to seed Supabase database:', err);
  }
}

// Reconstruct building structure with nested flats, reminders, and payments
export async function getBuildingWithNestedData(code) {
  if (!isSupabaseConfigured) return null;

  try {
    // Fetch building details
    const { data: b, error: bErr } = await supabase.from('buildings').select('*').eq('code', code).maybeSingle();
    if (bErr || !b) return null;

    // Fetch flats, reminders, and payments in parallel to optimize latency and minimize round-trips
    const [flatsResult, remindersResult, paymentsResult] = await Promise.all([
      supabase.from('flats').select('*').eq('building_code', code),
      supabase.from('reminders').select('*').eq('building_code', code),
      supabase.from('payments').select('*').eq('building_code', code).order('id', { ascending: false })
    ]);

    if (flatsResult.error || remindersResult.error || paymentsResult.error) {
      console.error('Parallel fetch failed:', flatsResult.error || remindersResult.error || paymentsResult.error);
      return null;
    }

    const flatsData = flatsResult.data;
    const remindersData = remindersResult.data;
    const paymentsData = paymentsResult.data;

    // Map database fields to application structure
    const buildingObj = {
      code: b.code,
      name: b.name,
      baseMaintenance: Number(b.base_maintenance) || 0,
      isActive: b.is_active !== false,
      subscriptionExpiresAt: b.subscription_expires_at || null,
      adminDetails: {
        name: b.admin_name || '',
        username: b.admin_username || '',
        password: b.admin_password || ''
      },
      bankDetails: {
        bankName: b.bank_name || '',
        accountNo: b.account_no || '',
        ifsc: b.ifsc || '',
        upiId: b.upi_id || '',
        razorpayKeyId: b.razorpay_key_id || ''
      },
      flats: {}
    };

    // Populate flats
    flatsData.forEach(f => {
      buildingObj.flats[f.flat_no] = {
        flatNo: f.flat_no,
        headName: f.head_name,
        monthlyCharge: Number(f.monthly_charge) || 0,
        outstandingDues: Number(f.outstanding_dues) || 0,
        phone: f.phone || '',
        email: f.email || '',
        lastPaymentDate: f.last_payment_date || '',
        oldestDueDate: f.oldest_due_date || '',
        username: f.username || '',
        password: f.password || '',
        reminders: [],
        payments: []
      };
    });

    // Nest reminders
    remindersData.forEach(rem => {
      const flat = buildingObj.flats[rem.flat_no];
      if (flat) {
        flat.reminders.push({
          id: rem.id,
          date: rem.date,
          subject: rem.subject,
          monthlyCharge: Number(rem.monthly_charge) || 0,
          dueCharge: Number(rem.due_charge) || 0,
          totalDue: Number(rem.total_due) || 0,
          content: rem.content
        });
      }
    });

    // Nest payments
    paymentsData.forEach(p => {
      const flat = buildingObj.flats[p.flat_no];
      if (flat) {
        flat.payments.push({
          date: p.date,
          amount: Number(p.amount) || 0,
          method: p.method
        });
      }
    });

    return buildingObj;
  } catch (err) {
    console.error('Failed to construct nested building structure:', err);
    return null;
  }
}

// Register a new building registry
export async function registerBuilding(name, bankDetails, baseMaintenance, adminDetails) {
  if (!isSupabaseConfigured) return null;

  try {
    let code = '';
    let exists = true;

    // Loop until we generate a unique code
    while (exists) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      code = `AST-${rand}`;
      const { data } = await supabase.from('buildings').select('code').eq('code', code).maybeSingle();
      if (!data) exists = false;
    }

    const { error } = await supabase.from('buildings').insert([{
      code,
      name,
      base_maintenance: Number(baseMaintenance) || 0,
      admin_name: adminDetails.name || '',
      admin_username: adminDetails.username || '',
      admin_password: adminDetails.password || '',
      bank_name: bankDetails.bankName || '',
      account_no: bankDetails.accountNo || '',
      ifsc: bankDetails.ifsc || '',
      upi_id: bankDetails.upiId || '',
      razorpay_key_id: bankDetails.razorpayKeyId || ''
    }]);

    if (error) throw error;

    return { code, name, baseMaintenance, adminDetails, bankDetails, flats: {} };
  } catch (err) {
    console.error('Failed to register building in Supabase:', err);
    throw err;
  }
}

// Update building registry details
export async function updateBuilding(buildingCode, updatedName, baseMaintenance, adminDetails, bankDetails) {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('buildings').update({
      name: updatedName,
      base_maintenance: Number(baseMaintenance) || 0,
      admin_name: adminDetails.name,
      admin_username: adminDetails.username,
      admin_password: adminDetails.password,
      bank_name: bankDetails.bankName,
      account_no: bankDetails.accountNo,
      ifsc: bankDetails.ifsc,
      upi_id: bankDetails.upiId,
      razorpay_key_id: bankDetails.razorpayKeyId
    }).eq('code', buildingCode);

    return !error;
  } catch (err) {
    console.error('Failed to update building details in Supabase:', err);
    return false;
  }
}

// Delete property database
export async function deleteBuilding(buildingCode) {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('buildings').delete().eq('code', buildingCode);
    return !error;
  } catch (err) {
    console.error('Failed to delete building in Supabase:', err);
    return false;
  }
}

// Add flat member to building
export async function addFlat(buildingCode, flatDetails) {
  if (!isSupabaseConfigured) return null;

  try {
    const flatNo = flatDetails.flatNo.toUpperCase().trim();
    const monthlyCharge = Number(flatDetails.monthlyCharge) || 0;
    const outstandingDues = Number(flatDetails.outstandingDues) || 0;

    let oldestDueDate = flatDetails.oldestDueDate || '';
    if (!oldestDueDate && outstandingDues > 0) {
      const divisor = monthlyCharge > 0 ? monthlyCharge : 1;
      const unpaidMonths = Math.ceil(outstandingDues / divisor) || 1;
      const date = new Date();
      date.setMonth(date.getMonth() - unpaidMonths);
      date.setDate(5);
      oldestDueDate = date.toISOString().split('T')[0];
    }

    const { error } = await supabase.from('flats').insert([{
      building_code: buildingCode,
      flat_no: flatNo,
      head_name: flatDetails.headName,
      monthly_charge: monthlyCharge,
      outstanding_dues: outstandingDues,
      phone: flatDetails.phone || '',
      email: flatDetails.email || '',
      last_payment_date: flatDetails.lastPaymentDate || '',
      oldest_due_date: oldestDueDate,
      username: (flatDetails.username && flatDetails.username.trim()) ? flatDetails.username.trim() : null,
      password: flatDetails.password || null
    }]);

    if (error) throw error;

    return { flatNo, headName: flatDetails.headName, monthlyCharge, outstandingDues, oldestDueDate };
  } catch (err) {
    console.error('Failed to add flat member in Supabase:', err);
    return null;
  }
}

// Edit flat details
export async function updateFlat(buildingCode, originalFlatNo, flatDetails) {
  if (!isSupabaseConfigured) return false;

  try {
    const updatedFlatNo = flatDetails.flatNo.toUpperCase().trim();
    
    // Fetch existing flat
    const { data: oldFlat } = await supabase.from('flats').select('*')
      .eq('building_code', buildingCode).eq('flat_no', originalFlatNo).maybeSingle();

    if (!oldFlat) return false;

    let monthlyCharge = Number(flatDetails.monthlyCharge) || 0;
    let outstandingDues = Number(flatDetails.outstandingDues) || 0;
    let oldestDueDate = flatDetails.oldestDueDate || oldFlat.oldest_due_date;

    if (flatDetails.isClaiming) {
      monthlyCharge = Number(oldFlat.monthly_charge) || 0;
      outstandingDues = Number(oldFlat.outstanding_dues) || 0;
      oldestDueDate = oldFlat.oldest_due_date || '';
    } else {
      if (outstandingDues === 0) {
        oldestDueDate = '';
      } else if (!oldestDueDate || (outstandingDues !== Number(oldFlat.outstanding_dues) && !flatDetails.oldestDueDate)) {
        const divisor = monthlyCharge > 0 ? monthlyCharge : 1;
        const unpaidMonths = Math.ceil(outstandingDues / divisor) || 1;
        const date = new Date();
        date.setMonth(date.getMonth() - unpaidMonths);
        date.setDate(5);
        oldestDueDate = date.toISOString().split('T')[0];
      }
    }

    // Delete original record if renaming flat index
    if (updatedFlatNo !== originalFlatNo) {
      const { error: dErr } = await supabase.from('flats').delete()
        .eq('building_code', buildingCode).eq('flat_no', originalFlatNo);
      if (dErr) return false;
    }

    // Upsert updated record
    const { error: uErr } = await supabase.from('flats').upsert({
      building_code: buildingCode,
      flat_no: updatedFlatNo,
      head_name: flatDetails.headName,
      monthly_charge: monthlyCharge,
      outstanding_dues: outstandingDues,
      phone: flatDetails.phone || '',
      email: flatDetails.email || '',
      last_payment_date: oldFlat.last_payment_date || '',
      oldest_due_date: oldestDueDate,
      username: (flatDetails.username && flatDetails.username.trim()) ? flatDetails.username.trim() : null,
      password: flatDetails.password || null
    });

    return !uErr;
  } catch (err) {
    console.error('Failed to edit flat in Supabase:', err);
    return false;
  }
}

// Delete flat member registry
export async function deleteFlat(buildingCode, flatNo) {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('flats').delete()
      .eq('building_code', buildingCode).eq('flat_no', flatNo);
    return !error;
  } catch (err) {
    console.error('Failed to delete flat member in Supabase:', err);
    return false;
  }
}

// Record flat payment details
export async function recordFlatPayment(buildingCode, flatNo, amount, method = 'UPI') {
  if (!isSupabaseConfigured) return false;

  try {
    const { data: flat } = await supabase.from('flats').select('*')
      .eq('building_code', buildingCode).eq('flat_no', flatNo).maybeSingle();

    if (!flat) return false;

    const paidAmount = Number(amount) || 0;
    const remainingDues = Math.max(0, Number(flat.outstanding_dues) - paidAmount);
    const lastPaymentDate = new Date().toISOString().split('T')[0];

    let oldestDueDate = flat.oldest_due_date;
    if (remainingDues === 0) {
      oldestDueDate = '';
    } else {
      const charge = Number(flat.monthly_charge) || 0;
      const divisor = charge > 0 ? charge : 1;
      const unpaidMonths = Math.ceil(remainingDues / divisor) || 1;
      const date = new Date();
      date.setMonth(date.getMonth() - unpaidMonths);
      date.setDate(5);
      oldestDueDate = date.toISOString().split('T')[0];
    }

    // Update dues
    const { error: uErr } = await supabase.from('flats').update({
      outstanding_dues: remainingDues,
      last_payment_date: lastPaymentDate,
      oldest_due_date: oldestDueDate
    }).eq('building_code', buildingCode).eq('flat_no', flatNo);

    if (uErr) return false;

    // Log transaction
    const { error: pErr } = await supabase.from('payments').insert([{
      building_code: buildingCode,
      flat_no: flatNo,
      date: lastPaymentDate,
      amount: paidAmount,
      method: method
    }]);

    return !pErr;
  } catch (err) {
    console.error('Failed to record flat payment in Supabase:', err);
    return false;
  }
}

// Settle full outstanding dues balance
export async function clearAllDues(buildingCode, flatNo, method = 'UPI') {
  if (!isSupabaseConfigured) return false;

  try {
    const { data: flat } = await supabase.from('flats').select('*')
      .eq('building_code', buildingCode).eq('flat_no', flatNo).maybeSingle();

    if (!flat) return false;

    const paidAmount = Number(flat.outstanding_dues);
    if (paidAmount === 0) return true;

    // Update dues to zero
    const { error: uErr } = await supabase.from('flats').update({
      outstanding_dues: 0,
      last_payment_date: new Date().toISOString().split('T')[0],
      oldest_due_date: ''
    }).eq('building_code', buildingCode).eq('flat_no', flatNo);

    if (uErr) return false;

    // Log transaction
    const { error: pErr } = await supabase.from('payments').insert([{
      building_code: buildingCode,
      flat_no: flatNo,
      date: new Date().toISOString().split('T')[0],
      amount: paidAmount,
      method: method
    }]);

    return !pErr;
  } catch (err) {
    console.error('Failed to clear dues in Supabase:', err);
    return false;
  }
}

// Log simulated email reminder notice dispatch
export async function sendEmailReminder(buildingCode, flatNo) {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: b } = await supabase.from('buildings').select('name').eq('code', buildingCode).maybeSingle();
    const { data: flat } = await supabase.from('flats').select('*').eq('building_code', buildingCode).eq('flat_no', flatNo).maybeSingle();

    if (!b || !flat || Number(flat.outstanding_dues) <= 0) return null;

    const monthly = Number(flat.monthly_charge);
    const dues = Number(flat.outstanding_dues) - monthly;
    const total = Number(flat.outstanding_dues);

    const timeString = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const emailSubject = `Assetra Dues Alert - Flat ${flat.flat_no} (${b.name})`;
    const emailContent = `Dear ${flat.head_name},\n\nThis is a friendly reminder to pay the maintenance charges for Flat ${flat.flat_no} in ${b.name}.\n\nBreakdown of Charges:\n- Current Monthly Maintenance: ₹${monthly.toLocaleString()}\n- Outstanding Due Balance: ₹${Math.max(0, dues).toLocaleString()}\n- Total Outstanding Amount: ₹${total.toLocaleString()}\n\nPlease log into the Assetra Member Portal with Building Code: ${buildingCode} to complete your payment.`;

    const reminderId = `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { error } = await supabase.from('reminders').insert([{
      id: reminderId,
      building_code: buildingCode,
      flat_no: flatNo,
      date: timeString,
      subject: emailSubject,
      monthly_charge: monthly,
      due_charge: Math.max(0, dues),
      total_due: total,
      content: emailContent
    }]);

    if (error) throw error;

    return {
      id: reminderId,
      date: timeString,
      subject: emailSubject,
      monthlyCharge: monthly,
      dueCharge: Math.max(0, dues),
      totalDue: total,
      content: emailContent
    };
  } catch (err) {
    console.error('Failed to log email reminder in Supabase:', err);
    return null;
  }
}

// Bulk reminders trigger
export async function sendBulkReminders(buildingCode) {
  if (!isSupabaseConfigured) return 0;

  try {
    const { data: flats } = await supabase.from('flats').select('flat_no')
      .eq('building_code', buildingCode).gt('outstanding_dues', 0);

    if (!flats) return 0;

    const results = await Promise.all(
      flats.map(f => sendEmailReminder(buildingCode, f.flat_no))
    );
    return results.filter(Boolean).length;
  } catch (err) {
    console.error('Failed to send bulk reminders in Supabase:', err);
    return 0;
  }
}

// Get global leaderboard ranked metrics
export async function getGlobalLeaderboard(buildingCodeFilter = 'All') {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase.from('flats').select(`
      building_code,
      flat_no,
      head_name,
      outstanding_dues,
      monthly_charge,
      oldest_due_date,
      buildings(name)
    `).gt('outstanding_dues', 0);

    if (buildingCodeFilter !== 'All') {
      query = query.eq('building_code', buildingCodeFilter);
    }

    const { data: flats } = await query;
    if (!flats) return [];

    const today = new Date();
    const list = flats.map(f => {
      let overdueDays = 0;
      if (f.oldest_due_date) {
        const oldestDate = new Date(f.oldest_due_date);
        if (!isNaN(oldestDate.getTime())) {
          const diffTime = today - oldestDate;
          overdueDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
      }

      return {
        buildingCode: f.building_code,
        buildingName: f.buildings ? f.buildings.name : '',
        flatNo: f.flat_no,
        headName: f.head_name,
        outstandingDues: Number(f.outstanding_dues) || 0,
        monthlyCharge: Number(f.monthly_charge) || 0,
        oldestDueDate: f.oldest_due_date,
        overdueDays
      };
    });

    list.sort((a, b) => {
      if (b.outstandingDues !== a.outstandingDues) {
        return b.outstandingDues - a.outstandingDues;
      }
      return b.overdueDays - a.overdueDays;
    });

    return list;
  } catch (err) {
    console.error('Failed to fetch leaderboard from Supabase:', err);
    return [];
  }
}

export async function findBuildingByAdminCredentials(username, password) {
  if (username.trim() === 'rakshitrajput006@gmail.com' && password.trim() === 'Rax&@102110)') {
    return {
      code: 'SUPER_ADMIN',
      name: 'Platform SaaS Console',
      role: 'superadmin',
      baseMaintenance: 0,
      isActive: true,
      subscriptionExpiresAt: null,
      adminDetails: {
        name: 'Platform Manager',
        username: 'rakshitrajput006@gmail.com',
        password: 'Rax&@102110)'
      }
    };
  }

  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase.from('buildings').select('*')
      .ilike('admin_username', username.trim())
      .eq('admin_password', password.trim())
      .maybeSingle();

    if (error || !data) return null;

    return {
      code: data.code,
      name: data.name,
      baseMaintenance: Number(data.base_maintenance) || 0,
      isActive: data.is_active !== false,
      subscriptionExpiresAt: data.subscription_expires_at || null,
      adminDetails: {
        name: data.admin_name || '',
        username: data.admin_username || '',
        password: data.admin_password || ''
      }
    };
  } catch (err) {
    console.error('Failed to query admin credentials in Supabase:', err);
    return null;
  }
}

// Authenticate building resident portal logins
export async function getBuildingByCodeAndFlat(buildingCode, flatNo) {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: b } = await supabase.from('buildings').select('*').eq('code', buildingCode).maybeSingle();
    if (!b) return null;

    const { data: f } = await supabase.from('flats').select('*').eq('building_code', buildingCode).eq('flat_no', flatNo).maybeSingle();
    if (!f) return null;

    return {
      code: b.code,
      name: b.name,
      baseMaintenance: Number(b.base_maintenance) || 0
    };
  } catch (err) {
    console.error('Failed to query member login in Supabase:', err);
    return null;
  }
}

// Check availability of a flat for member self-registration
export async function checkFlatAvailability(buildingCode, flatNo) {
  if (!isSupabaseConfigured) return { status: 'db_not_configured' };

  try {
    const cleanCode = buildingCode.trim().toUpperCase();
    const cleanFlatNo = flatNo.trim().toUpperCase();

    // Check if building exists
    const { data: b, error: bErr } = await supabase.from('buildings').select('*').eq('code', cleanCode).maybeSingle();
    if (bErr) throw bErr;
    if (!b) return { status: 'building_not_found' };

    // Check if flat exists
    const { data: f, error: fErr } = await supabase.from('flats').select('*').eq('building_code', cleanCode).eq('flat_no', cleanFlatNo).maybeSingle();
    if (fErr) throw fErr;

    if (!f) {
      // Flat doesn't exist yet: fully available
      return { status: 'available', buildingName: b.name, baseMaintenance: Number(b.base_maintenance) || 0 };
    }

    if (f.username) {
      // Flat is already registered and claimed by a resident
      return { status: 'already_registered', headName: f.head_name };
    }

    // Flat exists (e.g. pre-added by admin) but has no username set: claimable!
    return { status: 'claimable', buildingName: b.name, baseMaintenance: Number(b.base_maintenance) || 0, headName: f.head_name };
  } catch (err) {
    console.error('Check flat availability error:', err);
    throw err;
  }
}

// Authenticate flat resident portal logins
export async function getFlatByUsernameAndPassword(username, password) {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('flats')
      .select('*, buildings(name, base_maintenance)')
      .eq('username', username.trim())
      .eq('password', password.trim())
      .maybeSingle();

    if (error || !data) return null;

    return {
      buildingCode: data.building_code,
      buildingName: data.buildings ? data.buildings.name : '',
      flatNo: data.flat_no,
      headName: data.head_name,
      monthlyCharge: Number(data.monthly_charge) || 0,
      outstandingDues: Number(data.outstanding_dues) || 0,
      phone: data.phone || '',
      email: data.email || '',
      lastPaymentDate: data.last_payment_date || '',
      oldestDueDate: data.oldest_due_date || '',
      username: data.username,
      password: data.password
    };
  } catch (err) {
    console.error('Failed to authenticate member in Supabase:', err);
    return null;
  }
}

// Format registry databases
export async function resetDB() {
  if (!isSupabaseConfigured) return false;

  try {
    await Promise.all([
      supabase.from('payments').delete().neq('id', 0),
      supabase.from('reminders').delete().neq('id', ''),
      supabase.from('flats').delete().neq('flat_no', '')
    ]);
    await supabase.from('buildings').delete().neq('code', '');
    await initDB();
    return true;
  } catch (e) {
    console.error('Failed to format database in Supabase:', e);
    return false;
  }
}

// Broadcast leaderboard top member details
export async function broadcastCongrats(buildingCode, topMember) {
  if (!isSupabaseConfigured) return false;

  try {
    // 1. Ensure system flat exists
    const { data: existingFlat } = await supabase
      .from('flats')
      .select('*')
      .eq('building_code', buildingCode)
      .eq('flat_no', 'SYSTEM_BROADCAST')
      .maybeSingle();

    if (!existingFlat) {
      const { error: fErr } = await supabase.from('flats').insert([{
        building_code: buildingCode,
        flat_no: 'SYSTEM_BROADCAST',
        head_name: 'System Broadcast',
        monthly_charge: 0,
        outstanding_dues: 0,
        phone: '',
        email: '',
        last_payment_date: new Date().toISOString().split('T')[0],
        oldest_due_date: null,
        username: 'system_broadcast_user',
        password: 'system_broadcast_password'
      }]);
      if (fErr) throw fErr;
    }

    // 2. Delete any existing broadcast reminder
    const broadcastId = `broadcast-congrats-${buildingCode}`;
    await supabase.from('reminders').delete().eq('id', broadcastId);

    // 3. Insert new broadcast reminder containing top member details in json
    const { error: rErr } = await supabase.from('reminders').insert([{
      id: broadcastId,
      building_code: buildingCode,
      flat_no: 'SYSTEM_BROADCAST',
      date: new Date().toISOString(),
      subject: 'Leaderboard Congratulations',
      monthly_charge: 0,
      due_charge: 0,
      total_due: topMember.outstandingDues,
      content: JSON.stringify({
        flatNo: topMember.flatNo,
        headName: topMember.headName,
        outstandingDues: topMember.outstandingDues,
        broadcastTime: Date.now()
      })
    }]);

    if (rErr) throw rErr;
    return true;
  } catch (err) {
    console.error('Failed to broadcast congrats:', err);
    return false;
  }
}

// Get all buildings (SaaS platform console)
export async function getAllBuildings() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.from('buildings').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data.map(b => ({
      code: b.code,
      name: b.name,
      adminEmail: b.admin_username,
      isActive: b.is_active !== false,
      subscriptionExpiresAt: b.subscription_expires_at || null
    }));
  } catch (err) {
    console.error('Failed to get all buildings:', err);
    return [];
  }
}

// Update building SaaS parameters
export async function updateBuildingSaaS(code, isActive, subscriptionExpiresAt) {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('buildings')
      .update({
        is_active: isActive,
        subscription_expires_at: subscriptionExpiresAt
      })
      .eq('code', code);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to update building SaaS:', err);
    return false;
  }
}

