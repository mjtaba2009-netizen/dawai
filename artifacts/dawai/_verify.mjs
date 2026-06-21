import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const DOMAIN = "phone.dawai.app";
const phoneToEmail = (p) => `${String(p).replace(/\D/g, "")}@${DOMAIN}`;

const log = (...a) => console.log(...a);
const sb = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const run = async () => {
  const anon = sb();

  // 1) Public reads (seed data)
  const ph = await anon.from("pharmacies").select("id,name,type,governorate").order("id");
  log("PHARMACIES", ph.error ? "ERR:" + ph.error.message : ph.data.map((x) => `${x.name}(${x.type}/${x.governorate})`).join(", "));
  const meds = await anon.from("medications").select("id,name,requires_prescription");
  log("MEDS", meds.error ? "ERR:" + meds.error.message : `${meds.data.length} items`);
  const pm = await anon.from("pharmacy_medications").select("id", { count: "exact", head: true });
  log("PHARMACY_MEDS count", pm.error ? "ERR:" + pm.error.message : pm.count);

  const stamp = Date.now();

  // 2) Patient signup
  const patientPhone = "0770" + String(stamp).slice(-7);
  const cPat = sb();
  const sp = await cPat.auth.signUp({ email: phoneToEmail(patientPhone), password: "Test12345!", options: { data: { name: "مريض تجريبي", phone: patientPhone, role: "patient" } } });
  log("PATIENT signUp", sp.error ? "ERR:" + sp.error.message : `user=${!!sp.data.user} session=${!!sp.data.session}`);
  if (sp.data?.session) {
    const up = await cPat.from("profiles").upsert({ id: sp.data.user.id, name: "مريض تجريبي", phone: patientPhone, role: "patient", status: "active" }).select().single();
    log("PATIENT profile", up.error ? "ERR:" + up.error.message : `role=${up.data.role} status=${up.data.status}`);
    const me = await cPat.from("profiles").select("*").eq("id", sp.data.user.id).single();
    log("PATIENT read own", me.error ? "ERR:" + me.error.message : "ok");
    // place an order on first pharmacy/med
    if (ph.data?.length && meds.data?.length) {
      const ord = await cPat.from("orders").insert({ user_id: sp.data.user.id, pharmacy_id: ph.data[0].id, medication_id: meds.data[0].id, quantity: 2, total_price: 3000, tracking_code: "#DW-TEST", status: "pending" }).select().single();
      log("PATIENT order", ord.error ? "ERR:" + ord.error.message : `id=${ord.data.id} status=${ord.data.status}`);
    }
  }

  // 3) Vendor (pharmacy) signup + createVendor + profile link
  const vendorPhone = "0771" + String(stamp).slice(-7);
  const cVen = sb();
  const sv = await cVen.auth.signUp({ email: phoneToEmail(vendorPhone), password: "Test12345!", options: { data: { name: "صاحب صيدلية", phone: vendorPhone, role: "pharmacy" } } });
  log("VENDOR signUp", sv.error ? "ERR:" + sv.error.message : `session=${!!sv.data.session}`);
  if (sv.data?.session) {
    const ven = await cVen.from("pharmacies").insert({ owner_id: sv.data.user.id, name: "صيدلية الاختبار", type: "pharmacy", governorate: "البصرة", phone: vendorPhone, status: "approved" }).select().single();
    log("VENDOR createVendor", ven.error ? "ERR:" + ven.error.message : `pharmacy_id=${ven.data.id}`);
    if (ven.data) {
      const vp = await cVen.from("profiles").upsert({ id: sv.data.user.id, name: "صاحب صيدلية", phone: vendorPhone, role: "pharmacy", status: "approved_pending_signature", pharmacy_id: ven.data.id }).select().single();
      log("VENDOR profile", vp.error ? "ERR:" + vp.error.message : `pharmacy_id=${vp.data.pharmacy_id}`);
      // vendor adds inventory (RLS pm_write scoped)
      const inv = await cVen.from("pharmacy_medications").insert({ pharmacy_id: ven.data.id, medication_id: meds.data[0].id, price: 2500, quantity: 10 }).select().single();
      log("VENDOR inventory insert", inv.error ? "ERR:" + inv.error.message : `id=${inv.data.id}`);
    }
  }

  // 4) Login (signInWithPassword) with patient phone
  const cLogin = sb();
  const li = await cLogin.auth.signInWithPassword({ email: phoneToEmail(patientPhone), password: "Test12345!" });
  log("LOGIN", li.error ? "ERR:" + li.error.message : `session=${!!li.data.session}`);

  log("DONE");
};

run().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
