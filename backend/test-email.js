/**
 * Email / SMTP tests.
 *
 * Runs against a throwaway SMTP sink started in-process, so no external mail
 * server or credentials are needed. Covers:
 *   - graceful degradation when SMTP is not configured
 *   - a real SMTP conversation (EHLO / MAIL FROM / RCPT TO / DATA)
 *   - the reset link and token actually reaching the message body
 *   - forgot-password staying 200 and enumeration-safe either way
 */
const assert = require('assert');
const net = require('net');

const API = 'http://localhost:5000/api';

/** Minimal SMTP server that accepts one message and records it. */
function startSmtpSink() {
  const received = [];

  const server = net.createServer((socket) => {
    let buffer = '';
    let inData = false;
    let message = { rcpt: [], from: null, body: '' };

    socket.write('220 localhost Test SMTP\r\n');

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');

      let index;
      while ((index = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);

        if (inData) {
          if (line === '.') {
            inData = false;
            received.push(message);
            message = { rcpt: [], from: null, body: '' };
            socket.write('250 OK queued\r\n');
          } else {
            message.body += `${line}\n`;
          }
          continue;
        }

        const upper = line.toUpperCase();
        if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
          socket.write('250-localhost\r\n250 SIZE 10240000\r\n');
        } else if (upper.startsWith('MAIL FROM')) {
          message.from = line;
          socket.write('250 OK\r\n');
        } else if (upper.startsWith('RCPT TO')) {
          message.rcpt.push(line);
          socket.write('250 OK\r\n');
        } else if (upper.startsWith('DATA')) {
          inData = true;
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
        } else if (upper.startsWith('QUIT')) {
          socket.write('221 Bye\r\n');
          socket.end();
        } else if (upper.startsWith('RSET') || upper.startsWith('NOOP')) {
          socket.write('250 OK\r\n');
        } else {
          socket.write('250 OK\r\n');
        }
      }
    });

    socket.on('error', () => {});
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, received, port: server.address().port });
    });
  });
}

/**
 * Reloads the email service so it picks up changed env vars.
 * Note: SMTP_HOST is blanked rather than deleted in the "not configured" tests -
 * dotenv repopulates absent keys from a real .env, which would defeat them.
 */
function loadEmailService() {
  delete require.cache[require.resolve('./src/services/email.service')];
  delete require.cache[require.resolve('./src/config/env')];
  return require('./src/services/email.service');
}

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
    console.log(`  PASS  ${name}`);
  } catch (error) {
    results.push(['FAIL', name, error.message]);
    console.log(`  FAIL  ${name}: ${error.message}`);
  }
}

(async () => {
  const originalEnv = { ...process.env };

  console.log('--- SMTP NOT CONFIGURED ---');

  await check('isConfigured() is false without SMTP_HOST', async () => {
    process.env.SMTP_HOST = '';
    const email = loadEmailService();
    assert.equal(email.isConfigured(), false);
  });

  await check('sendPasswordResetEmail degrades gracefully instead of throwing', async () => {
    process.env.SMTP_HOST = '';
    const email = loadEmailService();
    const result = await email.sendPasswordResetEmail({
      to: 'nobody@example.com',
      name: 'Nobody',
      token: 'token123',
      expiresAt: new Date(Date.now() + 3600000),
    });
    assert.equal(result.delivered, false);
    assert.match(result.reason, /not configured/i);
  });

  await check('verifyConnection() reports unconfigured rather than failing', async () => {
    process.env.SMTP_HOST = '';
    const email = loadEmailService();
    const status = await email.verifyConnection();
    assert.equal(status.configured, false);
    assert.equal(status.ok, false);
  });

  // ------------------------------------------------------------------
  console.log('--- SMTP CONFIGURED (local sink) ---');
  const sink = await startSmtpSink();

  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String(sink.port);
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_FROM = 'Urban Furniture <no-reply@urban.test>';
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  process.env.FRONTEND_URL = 'http://localhost:3000';

  const email = loadEmailService();

  await check('isConfigured() is true once SMTP_HOST is set', async () => {
    assert.equal(email.isConfigured(), true);
  });

  await check('verifyConnection() succeeds against the sink', async () => {
    const status = await email.verifyConnection();
    assert.equal(status.configured, true);
    assert.equal(status.ok, true, status.reason);
  });

  await check('password reset email is delivered over SMTP', async () => {
    const result = await email.sendPasswordResetEmail({
      to: 'reset.target@example.com',
      name: 'Reset Target',
      token: 'abc123resettoken',
      expiresAt: new Date(Date.now() + 3600000),
    });
    assert.equal(result.delivered, true, result.reason);
    assert.ok(result.messageId, 'messageId returned');
    assert.equal(sink.received.length, 1, 'sink received exactly one message');
  });

  await check('envelope addresses the requesting user', async () => {
    const message = sink.received[0];
    assert.match(message.from, /no-reply@urban\.test/);
    assert.equal(message.rcpt.length, 1);
    assert.match(message.rcpt[0], /reset\.target@example\.com/);
  });

  await check('body carries the reset link, the token and the subject', async () => {
    // Quoted-printable may wrap long lines, so compare on a de-wrapped copy.
    const body = sink.received[0].body.replace(/=\r?\n/g, '').replace(/=3D/g, '=');
    assert.match(body, /Subject:.*Reset your/i);
    assert.match(body, /localhost:3000\/reset-password\?token=abc123resettoken/);
    assert.match(body, /abc123resettoken/);
    assert.match(body, /Reset Target/);
  });

  await check('a broken SMTP host returns delivered:false rather than throwing', async () => {
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = '1'; // nothing listening
    const broken = loadEmailService();
    const result = await broken.sendPasswordResetEmail({
      to: 'x@example.com',
      name: 'X',
      token: 't',
      expiresAt: new Date(),
    });
    assert.equal(result.delivered, false);
    assert.ok(result.reason, 'a reason is reported');
  });

  sink.server.close();
  Object.assign(process.env, originalEnv);

  // ------------------------------------------------------------------
  console.log('--- FORGOT PASSWORD ENDPOINT ---');

  let apiUp = true;
  try {
    await fetch(`${API}/health`);
  } catch {
    apiUp = false;
    console.log('  SKIP  API not running on port 5000 - endpoint checks skipped');
  }

  if (apiUp) {
    await check('forgot-password returns 200 for a known address', async () => {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com' }),
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });

    await check('forgot-password gives the same answer for an unknown address', async () => {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `missing.${Date.now()}@example.com` }),
      });
      assert.equal(res.status, 200, 'no account enumeration');
      const json = await res.json();
      assert.equal(json.success, true);
    });

    await check('a reset token row is created for the known address', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      try {
        const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
        const token = await prisma.passwordResetToken.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });
        assert.ok(token, 'token row exists');
        assert.ok(token.expiresAt > new Date(), 'token is still valid');
        assert.equal(token.usedAt, null, 'token unused');
        assert.equal(token.tokenHash.length, 64, 'only the sha256 hash is stored');
      } finally {
        await prisma.$disconnect();
      }
    });

    await check('health reports email configuration state', async () => {
      const res = await fetch(`${API}/health`);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(['configured', 'not configured'].includes(json.email));
    });
  }

  const failed = results.filter((r) => r[0] === 'FAIL');
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    failed.forEach((f) => console.log(`FAILED: ${f[1]} -> ${f[2]}`));
    process.exit(1);
  }
  process.exit(0);
})();
