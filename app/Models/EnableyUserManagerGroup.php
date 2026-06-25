<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EnableyUserManagerGroup extends Model
{
    protected $fillable = [
        'user_id',
        'group_identifier',
        'group_name',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
