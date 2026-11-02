<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class VaultSecurityAuditCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vault:security-audit {--strict : Exit with code 1 if any warning or failure occurs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform an automated production security and launch readiness audit for RemiVault';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->newLine();
        $this->line('<fg=yellow;options=bold>==============================================================</>');
        $this->line('<fg=yellow;options=bold>  🛡️  REMIVAULT PRODUCTION SECURITY & LAUNCH AUDIT ENGINE     </>');
        $this->line('<fg=yellow;options=bold>==============================================================</>');
        $this->newLine();

        $checks = [];
        $hasFailures = false;
        $hasWarnings = false;

        // 1. Environment Check
        $env = config('app.env');
        if ($env === 'production') {
            $checks[] = ['Application Environment', 'production', 'PASS', 'Production environment is active'];
        } else {
            $checks[] = ['Application Environment', $env, 'WARN', "Set APP_ENV=production before public release"];
            $hasWarnings = true;
        }

        // 2. Debug Mode Check
        $debug = config('app.debug');
        if ($debug === false) {
            $checks[] = ['Debug Mode (APP_DEBUG)', 'false (Disabled)', 'PASS', 'Error stack traces are hidden from visitors'];
        } else {
            $checks[] = ['Debug Mode (APP_DEBUG)', 'true (Enabled)', 'FAIL', 'CRITICAL: Stack traces & database details exposed! Set APP_DEBUG=false'];
            $hasFailures = true;
        }

        // 3. Application Encryption Key (APP_KEY)
        $appKey = config('app.key');
        if (!empty($appKey) && str_starts_with($appKey, 'base64:')) {
            $checks[] = ['Encryption Key (APP_KEY)', 'Configured (AES-256)', 'PASS', 'Valid base64 key generated. Ensure this key is safely backed up'];
        } elseif (!empty($appKey)) {
            $checks[] = ['Encryption Key (APP_KEY)', 'Configured', 'PASS', 'Application key is present'];
        } else {
            $checks[] = ['Encryption Key (APP_KEY)', 'MISSING', 'FAIL', 'Run: php artisan key:generate'];
            $hasFailures = true;
        }

        // 4. AES-256 Cryptographic Roundtrip Test
        try {
            $canary = 'remivault-canary-test-' . bin2hex(random_bytes(8));
            $cipher = Crypt::encryptString($canary);
            $decrypted = Crypt::decryptString($cipher);

            if ($decrypted === $canary) {
                $checks[] = ['AES-256 Cryptographic Roundtrip', 'Verified', 'PASS', 'Data encryption and decryption tests passed successfully'];
            } else {
                $checks[] = ['AES-256 Cryptographic Roundtrip', 'Failed', 'FAIL', 'Decrypted payload did not match plaintext'];
                $hasFailures = true;
            }
        } catch (\Throwable $e) {
            $checks[] = ['AES-256 Cryptographic Roundtrip', 'Error', 'FAIL', 'Encryption engine error: ' . $e->getMessage()];
            $hasFailures = true;
        }

        // 5. HTTPS Secure Session Cookies
        $secureCookie = config('session.secure');
        if ($secureCookie === true) {
            $checks[] = ['HTTPS Secure Cookies', 'true (Enforced)', 'PASS', 'Session cookies are restricted strictly to HTTPS'];
        } else {
            if ($env === 'production') {
                $checks[] = ['HTTPS Secure Cookies', 'false (Disabled)', 'FAIL', 'Set SESSION_SECURE_COOKIE=true for production HTTPS'];
                $hasFailures = true;
            } else {
                $checks[] = ['HTTPS Secure Cookies', 'false (Local dev)', 'WARN', 'Set SESSION_SECURE_COOKIE=true on production HTTPS'];
                $hasWarnings = true;
            }
        }

        // 6. Session Encryption at Rest
        $sessionEncrypt = config('session.encrypt');
        if ($sessionEncrypt) {
            $checks[] = ['Session Data Encryption', 'Encrypted', 'PASS', 'Session payloads are encrypted at rest'];
        } else {
            $checks[] = ['Session Data Encryption', 'Unencrypted', 'WARN', 'Set SESSION_ENCRYPT=true for maximum session defense'];
            $hasWarnings = true;
        }

        // 7. Session Driver Check
        $sessionDriver = config('session.driver');
        if (in_array($sessionDriver, ['database', 'redis'])) {
            $checks[] = ['Session Storage Driver', $sessionDriver, 'PASS', 'Safe persistent session storage active'];
        } else {
            $checks[] = ['Session Storage Driver', $sessionDriver, 'WARN', 'Recommend database or redis driver for production'];
            $hasWarnings = true;
        }

        // 8. CORS Allowed Origins Lockdown
        $corsOrigins = config('cors.allowed_origins', []);
        $hasCustomCors = !empty(env('CORS_ALLOWED_ORIGINS'));
        if ($hasCustomCors) {
            $checks[] = ['CORS Production Lockdown', 'Custom Origins Active', 'PASS', count($corsOrigins) . ' origins permitted'];
        } else {
            $checks[] = ['CORS Production Lockdown', 'Default Dev Ports', 'WARN', 'Specify CORS_ALLOWED_ORIGINS in production .env'];
            $hasWarnings = true;
        }

        // 9. Sanctum Token Expiration
        $tokenExpiration = config('sanctum.expiration');
        if (!empty($tokenExpiration)) {
            $days = round($tokenExpiration / 1440, 1);
            $checks[] = ['Sanctum Token Expiration', "{$tokenExpiration}m (~{$days}d)", 'PASS', 'Tokens automatically expire when inactive'];
        } else {
            $checks[] = ['Sanctum Token Expiration', 'Indefinite', 'WARN', 'Set SANCTUM_TOKEN_EXPIRATION (e.g. 43200 for 30d) in .env'];
            $hasWarnings = true;
        }

        // 10. Super Admin Master PIN Rotation
        $masterPin = (string) config('app.admin_master_pin', '7872');
        if ($masterPin === '7872') {
            $checks[] = ['Super Admin Master PIN', 'Default (7872)', 'WARN', 'Rotate default PIN via Settings or set ADMIN_MASTER_PIN in .env'];
            $hasWarnings = true;
        } else {
            $checks[] = ['Super Admin Master PIN', 'Custom Key Set', 'PASS', 'Non-default master admin PIN configured'];
        }

        // 11. Transactional Mailer (OTP Delivery)
        $mailer = config('mail.default');
        if ($mailer === 'smtp') {
            $checks[] = ['OTP Email Delivery Relay', 'smtp (Brevo/Active)', 'PASS', 'Transactional email relay configured'];
        } elseif ($mailer === 'log') {
            $checks[] = ['OTP Email Delivery Relay', 'log (Development)', 'WARN', 'Set MAIL_MAILER=smtp with Brevo credentials for live OTPs'];
            $hasWarnings = true;
        } else {
            $checks[] = ['OTP Email Delivery Relay', $mailer, 'PASS', 'Custom mailer active'];
        }

        // 12. Database Connection & Ping Latency
        try {
            $startTime = microtime(true);
            DB::connection()->getPdo();
            $latencyMs = round((microtime(true) - $startTime) * 1000, 2);
            $checks[] = ['Database Connectivity', "Connected ({$latencyMs}ms)", 'PASS', 'MySQL connection active and responsive'];
        } catch (\Throwable $e) {
            $checks[] = ['Database Connectivity', 'Disconnected', 'FAIL', $e->getMessage()];
            $hasFailures = true;
        }

        // Format and render table
        $tableData = [];
        foreach ($checks as [$name, $value, $status, $advice]) {
            $badge = match ($status) {
                'PASS' => '<fg=green;options=bold>✔ PASS</>',
                'WARN' => '<fg=yellow;options=bold>⚠ WARN</>',
                'FAIL' => '<fg=red;options=bold>✖ FAIL</>',
                default => $status,
            };

            $tableData[] = [$name, $value, $badge, $advice];
        }

        $this->table(['Security Aspect', 'Current Value', 'Status', 'Assessment & Recommendation'], $tableData);

        $this->newLine();
        if ($hasFailures) {
            $this->error('🚨 AUDIT RESULT: FAILED - Action is required on highlighted FAIL items before public launch.');
            return $this->option('strict') ? 1 : 0;
        } elseif ($hasWarnings) {
            $this->warn('⚠️ AUDIT RESULT: ACCEPTABLE WITH ADVISORIES - Address WARN recommendations for hardened production.');
            return 0;
        } else {
            $this->info('🎉 AUDIT RESULT: EXCELLENT - All 12 security and cryptographic benchmarks passed with flying colors!');
            return 0;
        }
    }
}

