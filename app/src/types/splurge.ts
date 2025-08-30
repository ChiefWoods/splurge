/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/splurge.json`.
 */
export type Splurge = {
  "address": "SPLGho1qL14YvTSyzxf3XSH8yw22ey9MY99gzokV29A",
  "metadata": {
    "name": "splurge",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "completeOrder",
      "discriminator": [
        73,
        78,
        89,
        7,
        140,
        132,
        17,
        97
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "authority",
          "writable": true,
          "relations": [
            "shopper"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "shopper"
        },
        {
          "name": "store",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "store.authority",
                "account": "store"
              }
            ]
          },
          "relations": [
            "item"
          ]
        },
        {
          "name": "item"
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "shopper"
              },
              {
                "kind": "account",
                "path": "item"
              },
              {
                "kind": "account",
                "path": "order.timestamp",
                "account": "order"
              }
            ]
          }
        },
        {
          "name": "paymentMint",
          "relations": [
            "order"
          ]
        },
        {
          "name": "orderTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "order"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "storeTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "store"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": []
    },
    {
      "name": "createOrder",
      "discriminator": [
        141,
        54,
        37,
        207,
        237,
        210,
        250,
        215
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "shopper",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  111,
                  112,
                  112,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "store",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "store.authority",
                "account": "store"
              }
            ]
          },
          "relations": [
            "item"
          ]
        },
        {
          "name": "item",
          "writable": true
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "shopper"
              },
              {
                "kind": "account",
                "path": "item"
              },
              {
                "kind": "arg",
                "path": "timestamp"
              }
            ]
          }
        },
        {
          "name": "priceUpdateV2"
        },
        {
          "name": "paymentMint"
        },
        {
          "name": "authorityTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "orderTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "order"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u32"
        },
        {
          "name": "timestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "createReview",
      "discriminator": [
        69,
        237,
        87,
        43,
        238,
        125,
        40,
        1
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "shopper",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  111,
                  112,
                  112,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "order",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "shopper"
              },
              {
                "kind": "account",
                "path": "order.item",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.timestamp",
                "account": "order"
              }
            ]
          }
        },
        {
          "name": "review",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  105,
                  101,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "order"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createReviewArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initializeConfigArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initializeShopper",
      "discriminator": [
        177,
        113,
        87,
        95,
        53,
        90,
        67,
        129
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "shopper",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  111,
                  112,
                  112,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initializeShopperArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initializeStore",
      "discriminator": [
        109,
        149,
        210,
        214,
        188,
        126,
        220,
        140
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "store",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initializeStoreArgs"
            }
          }
        }
      ]
    },
    {
      "name": "listItem",
      "discriminator": [
        174,
        245,
        22,
        211,
        228,
        103,
        121,
        13
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "store"
          ]
        },
        {
          "name": "item",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  116,
                  101,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "store"
              },
              {
                "kind": "arg",
                "path": "args.name"
              }
            ]
          }
        },
        {
          "name": "store",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "listItemArgs"
            }
          }
        }
      ]
    },
    {
      "name": "unlistItem",
      "discriminator": [
        170,
        45,
        195,
        119,
        162,
        155,
        42,
        94
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "store"
          ]
        },
        {
          "name": "item",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  116,
                  101,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "store"
              },
              {
                "kind": "account",
                "path": "item.name",
                "account": "item"
              }
            ]
          }
        },
        {
          "name": "store"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "updateConfig",
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateConfigArgs"
            }
          }
        }
      ]
    },
    {
      "name": "updateItem",
      "discriminator": [
        28,
        222,
        44,
        175,
        216,
        228,
        171,
        184
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "store"
          ]
        },
        {
          "name": "item",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  116,
                  101,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "store"
              },
              {
                "kind": "account",
                "path": "item.name",
                "account": "item"
              }
            ]
          }
        },
        {
          "name": "store"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateItemArgs"
            }
          }
        }
      ]
    },
    {
      "name": "updateOrder",
      "discriminator": [
        54,
        8,
        208,
        207,
        34,
        134,
        239,
        168
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "order.shopper",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.item",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.timestamp",
                "account": "order"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "status",
          "type": {
            "defined": {
              "name": "orderStatus"
            }
          }
        }
      ]
    },
    {
      "name": "withdrawEarnings",
      "discriminator": [
        6,
        132,
        233,
        254,
        241,
        87,
        247,
        185
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "store",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "paymentMint"
        },
        {
          "name": "storeTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "store"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "authorityTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "item",
      "discriminator": [
        92,
        157,
        163,
        130,
        72,
        254,
        86,
        216
      ]
    },
    {
      "name": "order",
      "discriminator": [
        134,
        173,
        223,
        185,
        77,
        86,
        28,
        51
      ]
    },
    {
      "name": "priceUpdateV2",
      "discriminator": [
        34,
        241,
        35,
        99,
        157,
        126,
        244,
        205
      ]
    },
    {
      "name": "review",
      "discriminator": [
        124,
        63,
        203,
        215,
        226,
        30,
        222,
        15
      ]
    },
    {
      "name": "shopper",
      "discriminator": [
        24,
        132,
        213,
        128,
        71,
        32,
        190,
        246
      ]
    },
    {
      "name": "store",
      "discriminator": [
        130,
        48,
        247,
        244,
        182,
        191,
        30,
        26
      ]
    }
  ],
  "events": [
    {
      "name": "itemListed",
      "discriminator": [
        51,
        193,
        103,
        51,
        201,
        26,
        211,
        113
      ]
    },
    {
      "name": "orderCancelled",
      "discriminator": [
        108,
        56,
        128,
        68,
        168,
        113,
        168,
        239
      ]
    },
    {
      "name": "orderCompleted",
      "discriminator": [
        90,
        77,
        52,
        248,
        56,
        233,
        110,
        197
      ]
    },
    {
      "name": "orderCreated",
      "discriminator": [
        224,
        1,
        229,
        63,
        254,
        60,
        190,
        159
      ]
    },
    {
      "name": "orderShipped",
      "discriminator": [
        200,
        225,
        83,
        123,
        179,
        86,
        221,
        24
      ]
    },
    {
      "name": "shopperInitialized",
      "discriminator": [
        245,
        82,
        153,
        46,
        179,
        7,
        235,
        6
      ]
    },
    {
      "name": "storeInitialized",
      "discriminator": [
        227,
        199,
        199,
        58,
        219,
        60,
        250,
        31
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAddress",
      "msg": "Address cannot be default pubkey"
    },
    {
      "code": 6001,
      "name": "invalidTimestamp",
      "msg": "Timestamp cannot be in the future"
    },
    {
      "code": 6002,
      "name": "emptyAcceptedMints",
      "msg": "Whitelist cannot be empty"
    },
    {
      "code": 6003,
      "name": "unauthorizedAdmin",
      "msg": "Signer not authorized as config admin"
    },
    {
      "code": 6004,
      "name": "platformPaused",
      "msg": "Platform paused, no new orders can be created"
    },
    {
      "code": 6005,
      "name": "paymentMintNotAccepted",
      "msg": "Payment mint is not accepted"
    },
    {
      "code": 6006,
      "name": "invalidPriceUpdateV2",
      "msg": "Price update v2 does not match with any accepted mint"
    },
    {
      "code": 6007,
      "name": "shopperNameRequired",
      "msg": "Shopper name is required"
    },
    {
      "code": 6008,
      "name": "shopperNameTooLong",
      "msg": "Shopper name exceeded maximum length"
    },
    {
      "code": 6009,
      "name": "shopperAddressRequired",
      "msg": "Shopper address is required"
    },
    {
      "code": 6010,
      "name": "storeNameRequired",
      "msg": "Store name is required"
    },
    {
      "code": 6011,
      "name": "storeNameTooLong",
      "msg": "Store name exceeded maximum length"
    },
    {
      "code": 6012,
      "name": "itemNameRequired",
      "msg": "Store item name is required"
    },
    {
      "code": 6013,
      "name": "itemNameTooLong",
      "msg": "Store item name exceeded maximum length"
    },
    {
      "code": 6014,
      "name": "insufficientInventory",
      "msg": "Store item has insufficient inventory to fulfill order"
    },
    {
      "code": 6015,
      "name": "orderAlreadyFinalized",
      "msg": "Order already finalized"
    },
    {
      "code": 6016,
      "name": "orderNotBeingShipped",
      "msg": "Order status is not shipping"
    },
    {
      "code": 6017,
      "name": "orderAlreadyCompleted",
      "msg": "Order already completed"
    },
    {
      "code": 6018,
      "name": "orderNotCompleted",
      "msg": "Order not completed"
    },
    {
      "code": 6019,
      "name": "invalidOrderStatus",
      "msg": "Order completion must be done through complete_order instruction"
    },
    {
      "code": 6020,
      "name": "invalidRating",
      "msg": "Rating must be between 1 and 5"
    },
    {
      "code": 6021,
      "name": "mathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6022,
      "name": "invalidPrice",
      "msg": "Oracle price must be above 0"
    }
  ],
  "types": [
    {
      "name": "acceptedMint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "Mint address of the stablecoin"
            ],
            "type": "pubkey"
          },
          {
            "name": "priceUpdateV2",
            "docs": [
              "Pyth price feed account address of the stablecoin"
            ],
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasury",
            "docs": [
              "Address to which platform fees are sent to"
            ],
            "type": "pubkey"
          },
          {
            "name": "orderFeeBps",
            "docs": [
              "Fee charged on each order in basis points"
            ],
            "type": "u16"
          },
          {
            "name": "admin",
            "docs": [
              "Address that has authority over the config"
            ],
            "type": "pubkey"
          },
          {
            "name": "isPaused",
            "docs": [
              "Boolean indicating if new orders can be created"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump used for seed derivation"
            ],
            "type": "u8"
          },
          {
            "name": "acceptedMints",
            "docs": [
              "List of stablecoin mints accepted as payment"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "acceptedMint"
                }
              }
            }
          },
          {
            "name": "reserved",
            "docs": [
              "Reserved for future upgrades"
            ],
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    },
    {
      "name": "createReviewArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "text",
            "type": "string"
          },
          {
            "name": "rating",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "initializeConfigArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "orderFeeBps",
            "type": "u16"
          },
          {
            "name": "acceptedMints",
            "type": {
              "vec": {
                "defined": {
                  "name": "acceptedMint"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "initializeShopperArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "image",
            "type": "string"
          },
          {
            "name": "address",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "initializeStoreArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "image",
            "type": "string"
          },
          {
            "name": "about",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "item",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "store",
            "docs": [
              "PDA of store account"
            ],
            "type": "pubkey"
          },
          {
            "name": "price",
            "docs": [
              "Price in atomic units of mint with 6 decimals"
            ],
            "type": "u64"
          },
          {
            "name": "inventoryCount",
            "docs": [
              "Remaining inventory count"
            ],
            "type": "u32"
          },
          {
            "name": "bump",
            "docs": [
              "Bump used for seed derivation"
            ],
            "type": "u8"
          },
          {
            "name": "name",
            "docs": [
              "Display name"
            ],
            "type": "string"
          },
          {
            "name": "image",
            "docs": [
              "Display image"
            ],
            "type": "string"
          },
          {
            "name": "description",
            "docs": [
              "Item description"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "itemListed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "item",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "listItemArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "inventoryCount",
            "type": "u32"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "image",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "order",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "shopper",
            "docs": [
              "PDA of shopper account"
            ],
            "type": "pubkey"
          },
          {
            "name": "item",
            "docs": [
              "PDA of item account"
            ],
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "docs": [
              "Unix time of order creation"
            ],
            "type": "i64"
          },
          {
            "name": "status",
            "docs": [
              "Order status"
            ],
            "type": {
              "defined": {
                "name": "orderStatus"
              }
            }
          },
          {
            "name": "amount",
            "docs": [
              "Amount of item purchased"
            ],
            "type": "u32"
          },
          {
            "name": "paymentSubtotal",
            "docs": [
              "Payment subtotal in atomic units of mint"
            ],
            "type": "u64"
          },
          {
            "name": "platformFee",
            "docs": [
              "Platform fee in atomic units of mint"
            ],
            "type": "u64"
          },
          {
            "name": "paymentMint",
            "docs": [
              "Address of stablecoin mint used for payment"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump used for seed derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "orderCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "orderCompleted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "orderCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "orderShipped",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "orderStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "shipping"
          },
          {
            "name": "cancelled"
          },
          {
            "name": "completed"
          }
        ]
      }
    },
    {
      "name": "priceFeedMessage",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feedId",
            "docs": [
              "`FeedId` but avoid the type alias because of compatibility issues with Anchor's `idl-build` feature."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "price",
            "type": "i64"
          },
          {
            "name": "conf",
            "type": "u64"
          },
          {
            "name": "exponent",
            "type": "i32"
          },
          {
            "name": "publishTime",
            "docs": [
              "The timestamp of this price update in seconds"
            ],
            "type": "i64"
          },
          {
            "name": "prevPublishTime",
            "docs": [
              "The timestamp of the previous price update. This field is intended to allow users to",
              "identify the single unique price update for any moment in time:",
              "for any time t, the unique update is the one such that prev_publish_time < t <= publish_time.",
              "",
              "Note that there may not be such an update while we are migrating to the new message-sending logic,",
              "as some price updates on pythnet may not be sent to other chains (because the message-sending",
              "logic may not have triggered). We can solve this problem by making the message-sending mandatory",
              "(which we can do once publishers have migrated over).",
              "",
              "Additionally, this field may be equal to publish_time if the message is sent on a slot where",
              "where the aggregation was unsuccesful. This problem will go away once all publishers have",
              "migrated over to a recent version of pyth-agent."
            ],
            "type": "i64"
          },
          {
            "name": "emaPrice",
            "type": "i64"
          },
          {
            "name": "emaConf",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "priceUpdateV2",
      "docs": [
        "A price update account. This account is used by the Pyth Receiver program to store a verified price update from a Pyth price feed.",
        "It contains:",
        "- `write_authority`: The write authority for this account. This authority can close this account to reclaim rent or update the account to contain a different price update.",
        "- `verification_level`: The [`VerificationLevel`] of this price update. This represents how many Wormhole guardian signatures have been verified for this price update.",
        "- `price_message`: The actual price update.",
        "- `posted_slot`: The slot at which this price update was posted."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "writeAuthority",
            "type": "pubkey"
          },
          {
            "name": "verificationLevel",
            "type": {
              "defined": {
                "name": "verificationLevel"
              }
            }
          },
          {
            "name": "priceMessage",
            "type": {
              "defined": {
                "name": "priceFeedMessage"
              }
            }
          },
          {
            "name": "postedSlot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "review",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "docs": [
              "PDA of order account"
            ],
            "type": "pubkey"
          },
          {
            "name": "rating",
            "docs": [
              "Rating of review, on a scale of 1 - 5"
            ],
            "type": "u8"
          },
          {
            "name": "timestamp",
            "docs": [
              "Unix time of review creation"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump used for seed derivation"
            ],
            "type": "u8"
          },
          {
            "name": "text",
            "docs": [
              "Review text"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "shopper",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Address that has authority over the account"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump used for seed derivation"
            ],
            "type": "u8"
          },
          {
            "name": "name",
            "docs": [
              "Display name"
            ],
            "type": "string"
          },
          {
            "name": "image",
            "docs": [
              "Profile image"
            ],
            "type": "string"
          },
          {
            "name": "address",
            "docs": [
              "Delivery address"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "shopperInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "shopper",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "store",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Address that has authority over the account"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump used for seed derivation"
            ],
            "type": "u8"
          },
          {
            "name": "name",
            "docs": [
              "Display name"
            ],
            "type": "string"
          },
          {
            "name": "image",
            "docs": [
              "Display image"
            ],
            "type": "string"
          },
          {
            "name": "about",
            "docs": [
              "Store description"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "storeInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "store",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "updateConfigArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "newAdmin",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "treasury",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "isPaused",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "orderFeeBps",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "acceptedMints",
            "type": {
              "option": {
                "vec": {
                  "defined": {
                    "name": "acceptedMint"
                  }
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "updateItemArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "price",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "inventoryCount",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "verificationLevel",
      "docs": [
        "Pyth price updates are bridged to all blockchains via Wormhole.",
        "Using the price updates on another chain requires verifying the signatures of the Wormhole guardians.",
        "The usual process is to check the signatures for two thirds of the total number of guardians, but this can be cumbersome on Solana because of the transaction size limits,",
        "so we also allow for partial verification.",
        "",
        "This enum represents how much a price update has been verified:",
        "- If `Full`, we have verified the signatures for two thirds of the current guardians.",
        "- If `Partial`, only `num_signatures` guardian signatures have been checked.",
        "",
        "# Warning",
        "Using partially verified price updates is dangerous, as it lowers the threshold of guardians that need to collude to produce a malicious price update."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "partial",
            "fields": [
              {
                "name": "numSignatures",
                "type": "u8"
              }
            ]
          },
          {
            "name": "full"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "configSeed",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "itemSeed",
      "type": "bytes",
      "value": "[105, 116, 101, 109]"
    },
    {
      "name": "maxItemNameLen",
      "type": "u8",
      "value": "32"
    },
    {
      "name": "maxOracleStaleness",
      "type": "u8",
      "value": "60"
    },
    {
      "name": "maxShopperNameLen",
      "type": "u8",
      "value": "64"
    },
    {
      "name": "maxStoreNameLen",
      "type": "u8",
      "value": "64"
    },
    {
      "name": "orderSeed",
      "type": "bytes",
      "value": "[111, 114, 100, 101, 114]"
    },
    {
      "name": "reviewSeed",
      "type": "bytes",
      "value": "[114, 101, 118, 105, 101, 119]"
    },
    {
      "name": "shopperSeed",
      "type": "bytes",
      "value": "[115, 104, 111, 112, 112, 101, 114]"
    },
    {
      "name": "storeSeed",
      "type": "bytes",
      "value": "[115, 116, 111, 114, 101]"
    }
  ]
};
