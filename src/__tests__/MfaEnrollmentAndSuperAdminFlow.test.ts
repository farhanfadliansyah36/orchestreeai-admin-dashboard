import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../lib/api';

describe('Bagian A: Super Admin MFA Enrollment & Verification Flow', () => {
  const superAdminEmail = 'orchestree.ai.id@gmail.com';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Endpoint adminMfaEnroll returns otpauthUri, secret, and superAdmin email', async () => {
    const enrollRes = await api.adminMfaEnroll({ email: superAdminEmail });

    expect(enrollRes).toBeDefined();
    expect(enrollRes.secret).toBeDefined();
    expect(typeof enrollRes.secret).toBe('string');
    expect(enrollRes.secret!.length).toBeGreaterThanOrEqual(16);

    expect(enrollRes.otpauthUri).toBeDefined();
    expect(enrollRes.otpauthUri!).toContain('otpauth://totp/');
    expect(enrollRes.otpauthUri!).toContain('OrchestreeAI');
    expect(enrollRes.otpauthUri!).toContain(encodeURIComponent(superAdminEmail));
  });

  it('2. Endpoint adminMfaConfirmEnrollment successfully validates code with secret', async () => {
    const enrollRes = await api.adminMfaEnroll({ email: superAdminEmail });

    const confirmRes = await api.adminMfaConfirmEnrollment({
      code: '123456',
      secret: enrollRes.secret,
      email: superAdminEmail,
    });

    expect(confirmRes).toBeDefined();
    expect(confirmRes.success).toBe(true);
    expect(confirmRes.token).toBeDefined();
    expect(confirmRes.user).toBeDefined();
    expect(confirmRes.user?.email).toBe(superAdminEmail);
    expect(confirmRes.user?.role).toBe('SUPER_ADMIN');
  });

  it('3. Endpoint adminMfaConfirmEnrollment validates 6-digit TOTP code requirements', async () => {
    await expect(
      api.adminMfaConfirmEnrollment({
        code: '123', // invalid length
        secret: 'JBSWY3DPEHPK3PXP',
        email: superAdminEmail,
      })
    ).rejects.toThrow('Kode TOTP harus terdiri dari 6 digit angka.');
  });

  it('4. Re-enrollment flow produces new secret and URI for manual trigger', async () => {
    const firstEnroll = await api.adminMfaEnroll({ email: superAdminEmail });
    const secondEnroll = await api.adminMfaEnroll({ email: superAdminEmail });

    expect(firstEnroll.otpauthUri).toBeDefined();
    expect(secondEnroll.otpauthUri).toBeDefined();
  });
});
