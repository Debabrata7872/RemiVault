<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Email Template Preview (Available in debug/local mode)
Route::get('/preview-email/otp', function () {
    $type = request('type', 'register');
    $code = request('code', '582914');
    $name = request('name', 'Alex Mitchell');
    return (new \App\Mail\OtpMail($code, $type, $name));
});

