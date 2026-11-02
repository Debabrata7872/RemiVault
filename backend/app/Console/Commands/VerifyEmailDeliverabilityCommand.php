<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class VerifyEmailDeliverabilityCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vault:verify-email {--send-to= : Optional recipient email to send a real-world test OTP email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit domain DNS authentication (SPF, DKIM, DMARC) and test Brevo SMTP transactional deliverability';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->newLine();
        $this->line('<fg=cyan;options=bold>==============================================================</>');
        $this->line('<fg=cyan;options=bold>  📧  REMIVAULT EMAIL DELIVERABILITY & DNS AUDIT ENGINE       </>');
        $this->line('<fg=cyan;options=bold>==============================================================</>');
        $this->newLine();

        $fromAddress = (string) config('mail.from.address', 'no-reply@remivault.app');
        $fromName = (string) config('mail.from.name', 'RemiVault');
        $mailer = (string) config('mail.default', 'log');
        $smtpHost = (string) config('mail.mailers.smtp.host', 'smtp-relay.brevo.com');
        $smtpPort = (int) config('mail.mailers.smtp.port', 587);
        $smtpUsername = config('mail.mailers.smtp.username');

        $domain = substr(strrchr($fromAddress, "@"), 1);
        if (!$domain) {
            $domain = 'remivault.app';
        }

        $this->comment("Auditing sender address: <fg=white;options=bold>{$fromAddress}</> (Domain: <fg=yellow>{$domain}</>)");
        $this->comment("Active Mailer: <fg=white>{$mailer}</> via <fg=white>{$smtpHost}:{$smtpPort}</>");
        $this->newLine();

        $rows = [];
        $isLocalPlaceholder = in_array($domain, ['example.com', 'localhost', 'remivault.local']);

        // 1. SPF Check
        $spfStatus = 'WARN';
        $spfValue = 'Not found';
        $spfAdvice = 'Add TXT record: v=spf1 include:spf.brevo.com ~all';

        if (!$isLocalPlaceholder && function_exists('dns_get_record')) {
            $txtRecords = @dns_get_record($domain, DNS_TXT) ?: [];
            foreach ($txtRecords as $rec) {
                $txt = $rec['txt'] ?? ($rec['entries'][0] ?? '');
                if (str_starts_with(trim($txt), 'v=spf1')) {
                    $spfValue = Str::limit($txt, 40);
                    if (str_contains($txt, 'spf.brevo.com') || str_contains($txt, 'sendinblue.com')) {
                        $spfStatus = 'PASS';
                        $spfAdvice = 'Brevo authorized in SPF';
                    } else {
                        $spfStatus = 'WARN';
                        $spfAdvice = 'Add "include:spf.brevo.com" inside your SPF record';
                    }
                    break;
                }
            }
        } elseif ($isLocalPlaceholder) {
            $spfValue = 'Local domain placeholder';
            $spfAdvice = 'Configure real sender domain in production .env';
        }

        $rows[] = ['SPF Authentication', $spfValue, $spfStatus, $spfAdvice];

        // 2. DMARC Check
        $dmarcStatus = 'WARN';
        $dmarcValue = 'Not found';
        $dmarcAdvice = 'Add TXT on _dmarc.' . $domain . ': v=DMARC1; p=none; sp=none;';

        if (!$isLocalPlaceholder && function_exists('dns_get_record')) {
            $dmarcRecords = @dns_get_record("_dmarc.{$domain}", DNS_TXT) ?: [];
            foreach ($dmarcRecords as $rec) {
                $txt = $rec['txt'] ?? ($rec['entries'][0] ?? '');
                if (str_starts_with(trim($txt), 'v=DMARC1')) {
                    $dmarcStatus = 'PASS';
                    $dmarcValue = Str::limit($txt, 40);
                    $dmarcAdvice = 'DMARC policy active';
                    break;
                }
            }
        } elseif ($isLocalPlaceholder) {
            $dmarcValue = 'Local domain placeholder';
            $dmarcAdvice = 'Configure _dmarc record on live domain';
        }

        $rows[] = ['DMARC Policy', $dmarcValue, $dmarcStatus, $dmarcAdvice];

        // 3. DKIM Check
        $dkimStatus = 'WARN';
        $dkimValue = 'Not found';
        $dkimAdvice = 'Obtain selector from Brevo Dashboard (Senders & IP -> Domains)';

        if (!$isLocalPlaceholder && function_exists('dns_get_record')) {
            $selectors = ['mail._domainkey', 'brevo._domainkey', 'k1._domainkey'];
            foreach ($selectors as $sel) {
                $dkimRecords = @dns_get_record("{$sel}.{$domain}", DNS_TXT) ?: [];
                if (!empty($dkimRecords)) {
                    $txt = $dkimRecords[0]['txt'] ?? ($dkimRecords[0]['entries'][0] ?? '');
                    if (str_contains($txt, 'k=rsa') || str_contains($txt, 'v=DKIM1') || !empty($txt)) {
                        $dkimStatus = 'PASS';
                        $dkimValue = "{$sel} (Active)";
                        $dkimAdvice = 'DKIM public key configured';
                        break;
                    }
                }
            }
        } elseif ($isLocalPlaceholder) {
            $dkimValue = 'Local domain placeholder';
            $dkimAdvice = 'Authenticate domain in Brevo dashboard';
        }

        $rows[] = ['DKIM Signature', $dkimValue, $dkimStatus, $dkimAdvice];

        // 4. SMTP Connection & Port Check
        $smtpStatus = 'WARN';
        $smtpValue = 'Untested';
        $smtpAdvice = '';

        if ($mailer === 'smtp') {
            $start = microtime(true);
            $errno = 0;
            $errstr = '';
            $socket = @fsockopen($smtpHost, $smtpPort, $errno, $errstr, 4);

            if ($socket) {
                $latencyMs = round((microtime(true) - $start) * 1000, 1);
                $greeting = fgets($socket, 512);
                fclose($socket);

                $smtpStatus = 'PASS';
                $smtpValue = "Connected ({$latencyMs}ms)";
                $smtpAdvice = 'SMTP port ' . $smtpPort . ' open & responding: ' . Str::limit(trim($greeting ?: ''), 30);
            } else {
                $smtpStatus = 'FAIL';
                $smtpValue = "Failed (Port {$smtpPort})";
                $smtpAdvice = "Could not reach {$smtpHost}:587. Check firewall or network: {$errstr}";
            }
        } else {
            $smtpValue = "Mailer is set to '{$mailer}'";
            $smtpAdvice = 'Set MAIL_MAILER=smtp for Brevo transactional delivery';
        }

        $rows[] = ['SMTP Relay Reachability', $smtpValue, $smtpStatus, $smtpAdvice];

        // 5. Brevo Credentials Verification
        $credStatus = 'PASS';
        $credValue = 'Configured';
        $credAdvice = 'Using Brevo relay credentials';

        if (empty($smtpUsername) || str_contains($smtpUsername, 'example.com') || str_contains($smtpUsername, 'YOUR_')) {
            $credStatus = 'WARN';
            $credValue = 'Unconfigured';
            $credAdvice = 'Update MAIL_USERNAME and MAIL_PASSWORD in .env';
        }

        $rows[] = ['Brevo Credentials', $credValue, $credStatus, $credAdvice];

        // Format and render table
        $tableData = [];
        foreach ($rows as [$aspect, $val, $status, $advice]) {
            $badge = match ($status) {
                'PASS' => '<fg=green;options=bold>✔ PASS</>',
                'WARN' => '<fg=yellow;options=bold>⚠ WARN</>',
                'FAIL' => '<fg=red;options=bold>✖ FAIL</>',
                default => $status,
            };

            $tableData[] = [$aspect, $val, $badge, $advice];
        }

        $this->table(['Deliverability Aspect', 'Value / Result', 'Status', 'Assessment & Recommendation'], $tableData);

        // Optional Real-World Test Email Dispatch
        $sendTo = $this->option('send-to');
        if ($sendTo) {
            $this->newLine();
            $this->comment("Dispatching live verification test OTP email to: <fg=white;options=bold>{$sendTo}</>...");

            try {
                $testOtp = (string) random_int(100000, 999999);
                Mail::send('emails.otp', [
                    'otp' => $testOtp,
                    'user' => (object) ['name' => 'Launch Auditor', 'email' => $sendTo],
                    'validityMinutes' => 10,
                    'purpose' => 'Deliverability & Domain Health Verification',
                ], function ($message) use ($sendTo, $fromAddress, $fromName) {
                    $message->to($sendTo)
                            ->from($fromAddress, $fromName)
                            ->subject('RemiVault Security • Deliverability Test OTP');
                });

                $this->info("✔ SUCCESS: Test OTP email sent successfully! Please check inbox and spam folders.");
            } catch (\Throwable $e) {
                $this->error("✖ FAILED to send email: " . $e->getMessage());
            }
        } else {
            $this->newLine();
            $this->line("Tip: To send a live test OTP email, run:");
            $this->line("<fg=yellow>  php artisan vault:verify-email --send-to=your-email@example.com</>");
        }

        // Display DNS Record Cheat-Sheet
        $this->newLine();
        $this->line('<fg=white;options=bold>📋 RECOMMENDED DNS RECORDS FOR DOMAIN (COPY & PASTE TO CLOUDFLARE/DNS):</>');
        $this->line("----------------------------------------------------------------------------------");
        $this->line("Type: <fg=green>TXT</>  Name: <fg=yellow>@</>                    Value: <fg=cyan>v=spf1 include:spf.brevo.com ~all</>");
        $this->line("Type: <fg=green>TXT</>  Name: <fg=yellow>_dmarc</>               Value: <fg=cyan>v=DMARC1; p=none; sp=none; aspf=r;</>");
        $this->line("Type: <fg=green>TXT</>  Name: <fg=yellow>mail._domainkey</>     Value: <fg=cyan>(Obtain from Brevo Dashboard -> Senders & IP -> Domains)</>");
        $this->line("----------------------------------------------------------------------------------");

        return 0;
    }
}
