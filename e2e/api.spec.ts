import { test, expect } from '@playwright/test'

/**
 * API routes must return 401 for unauthenticated requests.
 * These tests call the routes directly without a Supabase session.
 */

test.describe('API security — unauthenticated requests', () => {
  test('POST /api/extract-document returns 401', async ({ request }) => {
    const formData = new FormData()
    formData.append('doc_type', 'us_passport')
    const resp = await request.post('/api/extract-document', {
      multipart: { doc_type: 'us_passport' },
    })
    expect(resp.status()).toBe(401)
  })

  test('POST /api/validate-application returns 401', async ({ request }) => {
    const resp = await request.post('/api/validate-application', {
      data: { application_id: 'fake-id' },
    })
    expect(resp.status()).toBe(401)
  })

  test('POST /api/create-checkout returns 401', async ({ request }) => {
    const resp = await request.post('/api/create-checkout', {
      data: { application_id: 'fake-id', service_type: 'oci_new' },
    })
    expect(resp.status()).toBe(401)
  })

  test('GET /api/application-status returns 401', async ({ request }) => {
    const resp = await request.get('/api/application-status?application_id=fake-id')
    expect(resp.status()).toBe(401)
  })
})

test.describe('API validation — bad inputs', () => {
  // These tests verify that the API validates inputs properly.
  // Without auth we still get 401, but we can also check the response shape is JSON.

  test('POST /api/extract-document responds with JSON', async ({ request }) => {
    const resp = await request.post('/api/extract-document', {
      multipart: { doc_type: 'us_passport' },
    })
    const body = await resp.json()
    expect(body).toHaveProperty('error')
  })
})
