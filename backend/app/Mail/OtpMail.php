<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $type;
    public ?string $userName;

    /**
     * Create a new message instance.
     */
    public function __construct(string $otp, string $type = 'register', ?string $userName = null)
    {
        $this->otp = $otp;
        $this->type = $type;
        $this->userName = $userName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = match ($this->type) {
            'register' => "{$this->otp} is your RemiVault verification code",
            'forgot_password' => "{$this->otp} is your RemiVault password reset code",
            'reset_pin' => "{$this->otp} is your RemiVault PIN reset code",
            default => "Your RemiVault Security Code: {$this->otp}",
        };

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $recipientEmail = null;
        if (!empty($this->to) && isset($this->to[0]['address'])) {
            $recipientEmail = $this->to[0]['address'];
        }

        $securityRef = 'RV-' . strtoupper(substr(hash('crc32b', $this->otp . $this->type . microtime()), 0, 8));

        return new Content(
            view: 'emails.otp',
            with: [
                'otp' => $this->otp,
                'digits' => str_split($this->otp),
                'type' => $this->type,
                'userName' => $this->userName,
                'recipientEmail' => $recipientEmail,
                'timestamp' => now()->setTimezone('UTC')->format('M d, Y • H:i \U\T\C'),
                'securityRef' => $securityRef,
                'expiresInMinutes' => 10,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
