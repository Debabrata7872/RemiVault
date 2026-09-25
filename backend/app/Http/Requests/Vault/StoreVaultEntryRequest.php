<?php

namespace App\Http\Requests\Vault;

use Illuminate\Foundation\Http\FormRequest;

class StoreVaultEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:login,credit_card,api_key,server,secure_note,other'],
            'password' => ['required', 'string', 'max:2000'],
            'username' => ['nullable', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'is_favorite' => ['nullable', 'boolean'],
        ];
    }
}
