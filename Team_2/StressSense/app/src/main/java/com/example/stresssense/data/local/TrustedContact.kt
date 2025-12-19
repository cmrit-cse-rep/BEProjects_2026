package com.example.stresssense.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "trusted_contacts")
data class TrustedContact(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val name: String,
    val phoneNumber: String
)