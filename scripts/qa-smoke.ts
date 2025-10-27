import fs from 'fs';
import path from 'path';

/*
  QA Smoke Script
  Run with: npx tsx scripts/qa-smoke.ts (ensure dev server running on localhost:9002)
  Steps:
    1. Login (email/password) to obtain session cookie (assumes credentials from env QA_USER_EMAIL / QA_USER_PASSWORD)
    2. Fetch services, pick first or bodyguard-like service
    3. Create draft service request with extended fields
    4. Edit draft (change personnelCount + notes)
    5. Submit draft (isDraft=false)
    6. Upload a small temp file and attach to a new draft
    7. Trigger reminder job
  Outputs concise JSON per step.
*/

const BASE = process.env.QA_BASE_URL || 'http://localhost:9002';
const email = process.env.QA_USER_EMAIL || process.env.TEST_USER_EMAIL || 'client@example.com';
const password = process.env.QA_USER_PASSWORD || process.env.TEST_USER_PASSWORD || 'password123';

async function login(): Promise<string> {
  // NextAuth default credentials path might differ; adjust if needed.
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken: '', // If CSRF enforced, would need to fetch it. For dev fallback, many configs skip strict check.
      email,
      password
    }) as any,
    redirect: 'manual'
  });
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('No session cookie returned from login');
  return setCookie.split(';')[0];
}

async function fetchServices(cookie: string) {
  const r = await fetch(`${BASE}/api/services`, { headers: { cookie } });
  if (!r.ok) throw new Error('Failed services');
  const data = await r.json();
  return data;
}

async function createDraft(cookie: string, serviceId: string) {
  const payload = {
    serviceId,
    title: 'QA Draft Bodyguard',
    description: 'Initial draft description',
    personnelCount: 2,
    durationUnit: 'HOURS',
    startAt: new Date(Date.now() + 4 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 6 * 3600_000).toISOString(),
    locationText: 'Cairo Festival City',
    locationLat: 30.0301,
    locationLng: 31.4724,
    armamentLevel: 'STANDARD',
    notes: 'Initial notes',
    notifyBeforeHours: 3,
    isDraft: true,
    attachments: []
  };
  const r = await fetch(`${BASE}/api/service-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('Draft create failed');
  return r.json();
}

async function editDraft(cookie: string, id: string) {
  const r = await fetch(`${BASE}/api/service-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      personnelCount: 3,
      notes: 'Updated notes (QA)',
      isDraft: true
    })
  });
  if (!r.ok) throw new Error('Draft edit failed');
  return r.json();
}

async function submitDraft(cookie: string, id: string) {
  const r = await fetch(`${BASE}/api/service-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      isDraft: false
    })
  });
  if (!r.ok) throw new Error('Submit draft failed');
  return r.json();
}

async function uploadFile(cookie: string) {
  const form = new FormData();
  const tmpContent = 'QA test file ' + new Date().toISOString();
  const blob = new Blob([tmpContent], { type: 'text/plain' });
  form.append('file', blob, 'qa-test.txt');
  const r = await fetch(`${BASE}/api/uploads`, { method: 'POST', headers: { cookie }, body: form as any });
  if (!r.ok) throw new Error('Upload failed');
  return r.json();
}

async function createWithAttachment(cookie: string, serviceId: string, fileUrl: string) {
  const payload = {
    serviceId,
    title: 'QA With Attachment',
    description: 'Attachment test',
    personnelCount: 1,
    durationUnit: 'HOURS',
    startAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
    locationText: 'Nasr City',
    armamentLevel: 'ARMED',
    notifyBeforeHours: 1,
    isDraft: false,
    attachments: [{ url: fileUrl, name: 'qa-test.txt', mimeType: 'text/plain' }]
  };
  const r = await fetch(`${BASE}/api/service-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('Create with attachment failed');
  return r.json();
}

async function runReminder(cookie: string) {
  const r = await fetch(`${BASE}/api/jobs/reminders/run`, { headers: { cookie } });
  if (!r.ok) throw new Error('Reminder run failed');
  return r.json();
}

(async () => {
  const results: Record<string, any> = {};
  try {
    const cookie = await login();
    results.login = 'ok';
    const services = await fetchServices(cookie);
    const chosen = services.find((s: any) => /حراسة شخصية|Bodyguard/i.test(s.name)) || services[0];
    results.serviceChosen = chosen?.id;

    const draft = await createDraft(cookie, chosen.id);
    results.draftCreated = draft.id;

    const edited = await editDraft(cookie, draft.id);
    results.draftEditedPersonnel = edited.personnelCount;

    const submitted = await submitDraft(cookie, draft.id);
    results.draftSubmittedStatus = submitted.status;

    const upload = await uploadFile(cookie);
    const fileUrl = upload.files?.[0]?.url || upload.url;
    results.uploadFile = fileUrl;

    const withAttachment = await createWithAttachment(cookie, chosen.id, fileUrl);
    results.attachmentRequest = withAttachment.id;

    const reminder = await runReminder(cookie);
    results.reminder = reminder;

    console.log(JSON.stringify({ success: true, results }, null, 2));
  } catch (e: any) {
    console.error(JSON.stringify({ success: false, error: e.message, results }, null, 2));
    process.exit(1);
  }
})();
