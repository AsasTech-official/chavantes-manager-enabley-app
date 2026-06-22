<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EnableyUserManagerGroup extends Model
{
    protected $fillable = [
        'enabley_user_identifier',
        'group_identifier',
    ];
}
