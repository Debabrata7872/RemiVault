<?php

namespace App\Http\Requests\ImportantDates;

use Illuminate\Foundation\Http\FormRequest;

class StoreImportantDateRequest extends FormRequest
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
            'category' => ['required', 'string', 'in:passport,license,anniversary,birthday,warranty,subscription,custom'],
            'target_date' => ['required', 'date'],
            'recurrence' => ['nullable', 'string', 'in:none,yearly,monthly'],
            'notify_days_before' => ['nullable', 'integer', 'min:0', 'max:365'],
            'is_pinned' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
