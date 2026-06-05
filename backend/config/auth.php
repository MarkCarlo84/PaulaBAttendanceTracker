<?php
return [
    'defaults' => [
        'guard' => 'web',
        'passwords' => 'teachers',
    ],
    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'teachers',
        ],
    ],
    'providers' => [
        'teachers' => [
            'driver' => 'eloquent',
            'model' => App\Models\Teacher::class,
        ],
    ],
    'passwords' => [
        'teachers' => [
            'provider' => 'teachers',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],
    'password_timeout' => 10800,
];
